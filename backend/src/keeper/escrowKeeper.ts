import type { Address } from 'viem'
import { AGENT_ECO_ABI } from '../abi/agentEcoAbi.ts'
import { loadState, saveState } from '../checkpoint.ts'
import type { Clients } from '../clients.ts'
import type { KeeperConfig } from '../config.ts'
import { log, logError } from '../log.ts'
import { decideKeeperAction, ORDER_STATUS } from './decide.ts'

/** eth_getLogs range per call — chunked so we never ask an RPC for an unbounded block range. */
const MAX_BLOCK_RANGE = BigInt(5000)

async function discoverNewEscrows(
  clients: Clients,
  agentEcoAddress: Address,
  fromBlock: bigint,
  toBlock: bigint
): Promise<bigint[]> {
  const discovered: bigint[] = []
  let cursor = fromBlock

  while (cursor <= toBlock) {
    const end = cursor + MAX_BLOCK_RANGE > toBlock ? toBlock : cursor + MAX_BLOCK_RANGE

    const events = await clients.publicClient.getContractEvents({
      address: agentEcoAddress,
      abi: AGENT_ECO_ABI,
      eventName: 'EscrowCreated',
      fromBlock: cursor,
      toBlock: end,
    })

    for (const event of events) {
      const escrowId = event.args.escrowId
      if (escrowId !== undefined) discovered.push(escrowId)
    }

    cursor = end + BigInt(1)
  }

  return discovered
}

async function submitKeeperTx(
  clients: Clients,
  config: KeeperConfig,
  escrowId: bigint,
  functionName: 'claimExecutionTimeout' | 'finalizeAfterReviewWindow'
): Promise<void> {
  if (config.dryRun) {
    log(`[DRY RUN] Would submit ${functionName}(#${escrowId}) — no transaction sent.`)
    return
  }

  try {
    // Simulate first: catches a stale/ineligible escrow (e.g. someone
    // else's keeper already claimed it) before we spend gas.
    const { request } = await clients.publicClient.simulateContract({
      address: config.agentEcoAddress,
      abi: AGENT_ECO_ABI,
      functionName,
      args: [escrowId],
      account: clients.account,
    })

    log(`Submitting ${functionName}(#${escrowId})`)
    const hash = await clients.walletClient.writeContract(request)
    log(`Transaction: ${hash}`)

    // Awaiting the receipt here — not just the hash — is what guarantees
    // this escrow can't be double-submitted: processEscrow() is only
    // called sequentially within a cycle, and cycles never overlap
    // (see index.ts), so nothing else touches this escrowId until this
    // resolves.
    const receipt = await clients.publicClient.waitForTransactionReceipt({ hash })
    log(
      `${functionName}(#${escrowId}) ${receipt.status === 'success' ? 'succeeded' : 'reverted'} — ` +
        `block ${receipt.blockNumber}, tx ${receipt.transactionHash}`
    )
  } catch (error) {
    logError(`${functionName}(#${escrowId}) failed`, error)
  }
}

async function processEscrow(clients: Clients, config: KeeperConfig, escrowId: bigint): Promise<void> {
  try {
    const status = await clients.publicClient.readContract({
      address: config.agentEcoAddress,
      abi: AGENT_ECO_ABI,
      functionName: 'getEscrowStatus',
      args: [escrowId],
    })

    const isExecutionTimedOut =
      status === ORDER_STATUS.EXECUTING
        ? await clients.publicClient.readContract({
            address: config.agentEcoAddress,
            abi: AGENT_ECO_ABI,
            functionName: 'isExecutionTimedOut',
            args: [escrowId],
          })
        : false

    const isReviewExpired =
      status === ORDER_STATUS.DELIVERED
        ? await clients.publicClient.readContract({
            address: config.agentEcoAddress,
            abi: AGENT_ECO_ABI,
            functionName: 'isReviewExpired',
            args: [escrowId],
          })
        : false

    if (status === ORDER_STATUS.EXECUTING) log(`Escrow #${escrowId} is executing`)
    if (status === ORDER_STATUS.DELIVERED) log(`Escrow #${escrowId} is delivered, awaiting review`)

    const action = decideKeeperAction(status, isExecutionTimedOut, isReviewExpired)
    if (!action) return

    if (action === 'claimExecutionTimeout') log(`Escrow #${escrowId} execution timeout detected`)
    if (action === 'finalizeAfterReviewWindow') log(`Escrow #${escrowId} review expired`)

    await submitKeeperTx(clients, config, escrowId, action)
  } catch (error) {
    logError(`Failed checking escrow #${escrowId}`, error)
  }
}

/**
 * One full keeper pass: discover any new EscrowCreated events since the
 * last checkpoint, persist the updated checkpoint, then check every
 * known escrow for timeout/finalization eligibility. Escrows are
 * processed sequentially (not in parallel) so a slow or stuck
 * transaction can't cause overlapping submissions.
 */
export async function runKeeperCycle(clients: Clients, config: KeeperConfig): Promise<void> {
  const state = loadState()
  const latestBlock = await clients.publicClient.getBlockNumber()

  let fromBlock: bigint
  if (state.lastProcessedBlock !== null) {
    fromBlock = state.lastProcessedBlock + BigInt(1)
  } else if (config.deploymentBlock !== null) {
    fromBlock = config.deploymentBlock
  } else {
    fromBlock = latestBlock // nothing to backfill; start watching from now
  }

  const knownEscrowIds = new Set(state.knownEscrowIds)

  if (fromBlock <= latestBlock) {
    log(`Scanning blocks ${fromBlock} → ${latestBlock}`)
    const newIds = await discoverNewEscrows(clients, config.agentEcoAddress, fromBlock, latestBlock)
    for (const id of newIds) {
      if (!knownEscrowIds.has(id)) {
        knownEscrowIds.add(id)
        log(`Discovered new escrow #${id}`)
      }
    }
  }

  saveState({ lastProcessedBlock: latestBlock, knownEscrowIds: [...knownEscrowIds] })

  for (const escrowId of knownEscrowIds) {
    await processEscrow(clients, config, escrowId)
  }
}
