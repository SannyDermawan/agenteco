import { createPublicClient, http, type Address } from 'viem'
import { createOnchainClients } from '../../agent-runtime/src/index.ts'
import { AGENT_ECO_ABI } from './abi/agentEcoAbi.ts'
import { botChainTestnet } from './chain.ts'
import { decryptAgentKey } from './agentKeyCrypto.ts'
import { prisma } from './db.ts'
import { refundLeftover } from './host/buyerTaskHost.ts'

const RPC_URL = process.env.RPC_URL ?? 'https://rpc.bohr.life'
const AGENT_ECO_ADDRESS = process.env.AGENT_ECO_ADDRESS as Address
const publicClient = createPublicClient({ chain: botChainTestnet, transport: http(RPC_URL) })

// AgentEco.sol OrderStatus: FUNDED, EXECUTING, DELIVERED, DISPUTED — money is
// locked and someone still has to act. CREATED/SETTLED/REFUNDED are safe.
const IN_PROGRESS_STATUSES = new Set([1, 2, 3, 4])
const STATUS_LABEL = ['CREATED', 'FUNDED', 'EXECUTING', 'DELIVERED', 'DISPUTED', 'SETTLED', 'REFUNDED']
const MAX_BLOCK_RANGE = BigInt(5000)

type DeletableAgent = {
  id: string
  role: string
  walletAddress: string | null
  taskStatus: string | null
  escrowScanBlock: bigint | null
}

async function escrowStatus(escrowId: bigint): Promise<number> {
  return publicClient.readContract({
    address: AGENT_ECO_ADDRESS,
    abi: AGENT_ECO_ABI,
    functionName: 'getEscrowStatus',
    args: [escrowId],
  })
}

/** Escrows naming a hosted seller's own wallet — includes direct hires that have no Order row. */
async function hostedSellerEscrowIds(wallet: Address, fromBlock: bigint): Promise<bigint[]> {
  const ids: bigint[] = []
  const latest = await publicClient.getBlockNumber()
  for (let cursor = fromBlock; cursor <= latest; cursor += MAX_BLOCK_RANGE + BigInt(1)) {
    const end = cursor + MAX_BLOCK_RANGE > latest ? latest : cursor + MAX_BLOCK_RANGE
    const events = await publicClient.getContractEvents({
      address: AGENT_ECO_ADDRESS,
      abi: AGENT_ECO_ABI,
      eventName: 'EscrowCreated',
      args: { seller: wallet },
      fromBlock: cursor,
      toBlock: end,
    })
    for (const event of events) if (event.args.escrowId !== undefined) ids.push(event.args.escrowId)
  }
  return ids
}

/**
 * Why this agent can't be deleted right now, or null if it can. Deleting
 * mid-deal would strand the counterparty: a hosted agent would stop acting,
 * and an agreed-but-unfunded deal would never get funded.
 */
export async function findBlockingWork(agent: DeletableAgent): Promise<string | null> {
  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerAgentId: agent.id }, { sellerAgentId: agent.id }] },
    select: { status: true, escrowId: true },
  })

  if (orders.some((o) => o.status === 'agreed')) {
    return 'This agent has an agreed deal that has not been funded yet.'
  }

  const escrowIds = new Set(orders.filter((o) => o.escrowId).map((o) => BigInt(o.escrowId!)))
  if (agent.role === 'seller' && agent.taskStatus !== null && agent.walletAddress && agent.escrowScanBlock !== null) {
    for (const id of await hostedSellerEscrowIds(agent.walletAddress as Address, agent.escrowScanBlock)) escrowIds.add(id)
  }

  for (const escrowId of escrowIds) {
    const status = await escrowStatus(escrowId)
    if (IN_PROGRESS_STATUSES.has(status)) {
      return `On-chain order #${escrowId} is still ${STATUS_LABEL[status]} — finish, settle, or refund it first.`
    }
  }
  return null
}

/**
 * Empties a hosted agent's own wallet back to whoever funded it: all USDT,
 * then all native BOT minus the gas for that last transfer.
 */
export async function withdrawHostedWallet(encryptedKey: string, to: Address, label: string): Promise<void> {
  const onchain = createOnchainClients(decryptAgentKey(encryptedKey), RPC_URL)
  await refundLeftover(onchain, to, label, 'returned')

  const [balance, gasPrice] = await Promise.all([
    onchain.publicClient.getBalance({ address: onchain.account.address }),
    onchain.publicClient.getGasPrice(),
  ])
  // Plain transfer = 21000 gas; doubled so a gas-price tick between quote and send can't make it fail.
  const fee = gasPrice * BigInt(21000) * BigInt(2)
  if (balance <= fee) return

  const hash = await onchain.walletClient.sendTransaction({ to, value: balance - fee })
  await onchain.publicClient.waitForTransactionReceipt({ hash })
}
