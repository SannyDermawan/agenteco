import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, toHex, type Address } from 'viem'
import {
  DemoAgentRuntime,
  respondToNegotiation,
  listNegotiationsForAgent,
  countOffersBySide,
  isMyTurn,
  createOnchainClients,
  startOnchainExecution,
  markOnchainDelivered,
  getEscrowStatus,
  discoverEscrowsAsSeller,
  publishEscrowResult,
  type OnchainClients,
} from '../../../agent-runtime/src/index.ts'
import { decryptAgentKey } from '../agentKeyCrypto.ts'
import { prismaWithAgentKey } from '../db.ts'
import { log, logError } from '../log.ts'
import { refundLeftover } from './buyerTaskHost.ts'

const API_URL = `http://localhost:${process.env.API_PORT ?? 4000}`
const RPC_URL = process.env.RPC_URL ?? 'https://rpc.bohr.life'

// AgentEco.sol OrderStatus enum ordering.
const ON_CHAIN_FUNDED = 1
const ON_CHAIN_EXECUTING = 2
const ON_CHAIN_DELIVERED = 3
const ON_CHAIN_DISPUTED = 4
const ON_CHAIN_SETTLED = 5

export interface HostedSellerAgentRow {
  id: string
  name: string
  capabilities: string[]
  price: unknown // Prisma.Decimal
  minimumPrice: unknown
  agentWalletKey: string | null
  depositorWallet: string | null
  escrowScanBlock: bigint | null
}

/**
 * Per-agent scan checkpoint, in memory only. After a host restart it falls
 * back to the agent's escrowScanBlock (its creation block) and rescans from
 * there — cheap at testnet scale, and every step below is idempotent against
 * on-chain status, so a rescan never double-executes anything.
 */
type ScanState = { lastProcessedBlock: bigint; pendingEscrowIds: Set<bigint> }
const scanStates = new Map<string, ScanState>()

async function hasPublishedResult(escrowId: bigint): Promise<boolean> {
  const res = await fetch(`${API_URL}/escrow-results/${escrowId}`)
  return res.ok
}

/**
 * Executes one escrow as far as it can go this cycle: FUNDED -> EXECUTING ->
 * DELIVERED (+ publishes the plaintext result). Returns true once there's
 * nothing left for the seller to do on it.
 */
async function advanceEscrow(
  runtime: DemoAgentRuntime,
  onchain: OnchainClients,
  escrowId: bigint,
  capability: string
): Promise<boolean> {
  const label = runtime.config.name
  const status = await getEscrowStatus(onchain, escrowId)

  if (status === ON_CHAIN_FUNDED || status === ON_CHAIN_EXECUTING) {
    if (status === ON_CHAIN_FUNDED) {
      log(`[host:${label}] escrow #${escrowId} is funded — starting execution…`)
      await startOnchainExecution(onchain, escrowId)
    }
    // execute() is deterministic per capability, so the hash committed here
    // always matches the result published right after.
    const result = runtime.execute(capability)
    await markOnchainDelivered(onchain, escrowId, keccak256(toHex(JSON.stringify(result))))
    log(`[host:${label}] escrow #${escrowId} marked delivered.`)
    await publishEscrowResult(API_URL, escrowId.toString(), capability, result)
    return true
  }

  if (status === ON_CHAIN_DELIVERED || status === ON_CHAIN_SETTLED || status === ON_CHAIN_DISPUTED) {
    // Self-heal: delivered in an earlier cycle whose result publish failed.
    if (!(await hasPublishedResult(escrowId))) {
      await publishEscrowResult(API_URL, escrowId.toString(), capability, runtime.execute(capability))
      log(`[host:${label}] published missing result for escrow #${escrowId}.`)
    }
    return true
  }

  // CREATED (not funded yet) keeps waiting; REFUNDED is terminal.
  return status !== 0
}

export async function processHostedSellerTask(agentRow: HostedSellerAgentRow): Promise<void> {
  if (!agentRow.agentWalletKey || !agentRow.depositorWallet) return
  const capability = agentRow.capabilities[0]
  if (!capability) return

  const privateKey = decryptAgentKey(agentRow.agentWalletKey)
  const account = privateKeyToAccount(privateKey)
  const onchain = createOnchainClients(privateKey, RPC_URL)

  const runtime = new DemoAgentRuntime({
    name: agentRow.name,
    role: 'seller',
    capabilities: agentRow.capabilities,
    description: 'Hosted seller agent.',
    basePrice: Number(agentRow.price),
    minimumPrice: agentRow.minimumPrice != null ? Number(agentRow.minimumPrice) : undefined,
  })

  // 1. Answer every negotiation waiting on the seller.
  const negotiations = await listNegotiationsForAgent(API_URL, agentRow.id, 'open')
  for (const negotiation of negotiations) {
    if (!isMyTurn(negotiation, 'seller')) continue
    const lastMessage = negotiation.messages[negotiation.messages.length - 1]
    const offeredPrice = Number(lastMessage.price)
    const decision = runtime.decideOnOffer(offeredPrice, countOffersBySide(negotiation, 'seller'))
    log(
      `[host:${agentRow.name}] negotiation ${negotiation.id}: incoming ${offeredPrice} USDT -> ${decision.action}` +
        (decision.action === 'counter' ? ` (${decision.price} USDT)` : '')
    )
    await respondToNegotiation(API_URL, account, negotiation.id, {
      side: 'seller',
      action: decision.action,
      ...(decision.action === 'counter' ? { price: decision.price } : {}),
    })
  }

  // 2. Discover escrows naming this wallet as seller — negotiated orders and
  //    direct "Request Service" hires alike, straight from the chain.
  let state = scanStates.get(agentRow.id)
  if (!state) {
    const startBlock = agentRow.escrowScanBlock ?? (await onchain.publicClient.getBlockNumber())
    state = { lastProcessedBlock: startBlock - BigInt(1), pendingEscrowIds: new Set() }
    scanStates.set(agentRow.id, state)
  }

  const latestBlock = await onchain.publicClient.getBlockNumber()
  if (state.lastProcessedBlock < latestBlock) {
    const newIds = await discoverEscrowsAsSeller(onchain, account.address, state.lastProcessedBlock + BigInt(1), latestBlock)
    for (const id of newIds) {
      if (!state.pendingEscrowIds.has(id)) log(`[host:${agentRow.name}] discovered escrow #${id} on-chain`)
      state.pendingEscrowIds.add(id)
    }
    state.lastProcessedBlock = latestBlock
  }

  // 3. Work every pending escrow; drop the ones with nothing left to do.
  for (const escrowId of [...state.pendingEscrowIds]) {
    const done = await advanceEscrow(runtime, onchain, escrowId, capability)
    if (done) state.pendingEscrowIds.delete(escrowId)
  }

  // 4. Sweep settled earnings out to the owner — the agent wallet is only
  //    an operating wallet, not where the seller's money should sit.
  await refundLeftover(onchain, agentRow.depositorWallet as Address, agentRow.name, 'paid out earnings of')
}

export async function runSellerHostCycleOnce(): Promise<void> {
  // The only place (besides the buyer host) allowed to read agentWalletKey — see db.ts.
  const activeSellers = await prismaWithAgentKey.agent.findMany({ where: { role: 'seller', taskStatus: 'active', deletedAt: null } })

  for (const agentRow of activeSellers) {
    try {
      await processHostedSellerTask(agentRow)
    } catch (error) {
      logError(`[host:${agentRow.name}] cycle failed`, error, 'HOST')
    }
  }
}
