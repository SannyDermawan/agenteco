'use client'
import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { decodeEventLog, toHex, type Address, type Hash, type Hex } from 'viem'
import { AGENT_ECO_ABI, AGENT_ECO_ADDRESS } from './abi'
import { botChainTestnet } from './chain'

// Block AgentEco.sol was deployed at on BOT Chain Testnet — no escrow event
// can predate it, so every log scan starts here instead of at genesis.
export const AGENT_ECO_DEPLOY_BLOCK = BigInt(24270640)
// The RPC answers the full range since deployment in one call today; chunked
// anyway so the scan keeps working as the chain grows.
const LOG_CHUNK = BigInt(500000)

export function explorerTxUrl(hash: string): string {
  return `${botChainTestnet.blockExplorers.default.url}/tx/${hash}`
}

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>

async function forEachChunk(client: PublicClient, fn: (fromBlock: bigint, toBlock: bigint) => Promise<void>) {
  const head = await client.getBlockNumber()
  for (let from = AGENT_ECO_DEPLOY_BLOCK; from <= head; from += LOG_CHUNK) {
    const to = from + LOG_CHUNK - BigInt(1) < head ? from + LOG_CHUNK - BigInt(1) : head
    await fn(from, to)
  }
}

export interface EscrowCreatedLog {
  escrowId: bigint
  buyer: Address
  seller: Address
  amount: bigint
}

/**
 * Every escrow where any of `addresses` is the buyer or the seller — straight
 * from EscrowCreated logs, so it includes direct "Request Service" hires that
 * never get an Order row in the database.
 */
export function useEscrowsInvolving(addresses: string[]) {
  const client = usePublicClient({ chainId: botChainTestnet.id })
  const normalized = [...new Set(addresses.map((a) => a.toLowerCase()))].sort() as Address[]

  return useQuery({
    queryKey: ['escrowsInvolving', normalized],
    enabled: !!client && normalized.length > 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      const byId = new Map<string, EscrowCreatedLog>()
      await forEachChunk(client!, async (fromBlock, toBlock) => {
        const [asBuyer, asSeller] = await Promise.all(
          (['buyer', 'seller'] as const).map((side) =>
            client!.getContractEvents({
              address: AGENT_ECO_ADDRESS,
              abi: AGENT_ECO_ABI,
              eventName: 'EscrowCreated',
              args: { [side]: normalized },
              fromBlock,
              toBlock,
            })
          )
        )
        for (const log of [...asBuyer, ...asSeller]) {
          const { escrowId, buyer, seller, amount } = log.args
          if (escrowId === undefined || !buyer || !seller || amount === undefined) continue
          byId.set(escrowId.toString(), { escrowId, buyer, seller, amount })
        }
      })
      return [...byId.values()]
    },
  })
}

export interface DisputeSummary {
  escrowId: bigint
  buyer: Address
  seller: Address
  amount: bigint
  /** Live AgentEco.sol status — 4 DISPUTED while open, 5/6 once resolved. */
  status: number
  raisedAt: number // unix ms
  raisedTx: Hash
  resolution?: { releasedToSeller: boolean; at: number; tx: Hash }
}

// AgentEco.sol OrderStatus.DISPUTED
const DISPUTED = 4

/**
 * Every dispute ever raised on the contract, straight from DisputeRaised /
 * DisputeResolved logs — the arbiter's inbox. Open ones are still DISPUTED
 * on-chain. `enabled` lets non-arbiters skip the scan entirely.
 */
export function useDisputes(enabled: boolean) {
  const client = usePublicClient({ chainId: botChainTestnet.id })

  return useQuery({
    queryKey: ['disputes'],
    enabled: enabled && !!client,
    refetchInterval: 15_000,
    queryFn: async (): Promise<DisputeSummary[]> => {
      const raised: { escrowId: bigint; tx: Hash; block: bigint }[] = []
      const resolved = new Map<string, { releasedToSeller: boolean; tx: Hash; block: bigint }>()
      await forEachChunk(client!, async (fromBlock, toBlock) => {
        const [r, s] = await Promise.all([
          client!.getContractEvents({ address: AGENT_ECO_ADDRESS, abi: AGENT_ECO_ABI, eventName: 'DisputeRaised', fromBlock, toBlock }),
          client!.getContractEvents({ address: AGENT_ECO_ADDRESS, abi: AGENT_ECO_ABI, eventName: 'DisputeResolved', fromBlock, toBlock }),
        ])
        for (const log of r) if (log.args.escrowId !== undefined) raised.push({ escrowId: log.args.escrowId, tx: log.transactionHash, block: log.blockNumber })
        for (const log of s) {
          if (log.args.escrowId === undefined) continue
          resolved.set(log.args.escrowId.toString(), { releasedToSeller: !!log.args.releasedToSeller, tx: log.transactionHash, block: log.blockNumber })
        }
      })

      const blockTime = new Map<bigint, number>()
      const timeOf = async (block: bigint) => {
        if (!blockTime.has(block)) blockTime.set(block, Number((await client!.getBlock({ blockNumber: block })).timestamp) * 1000)
        return blockTime.get(block)!
      }

      const summaries = await Promise.all(
        raised.map(async ({ escrowId, tx, block }): Promise<DisputeSummary> => {
          const [buyer, seller, amount, status] = await client!.readContract({
            address: AGENT_ECO_ADDRESS,
            abi: AGENT_ECO_ABI,
            functionName: 'getEscrowBasic',
            args: [escrowId],
          })
          const res = resolved.get(escrowId.toString())
          return {
            escrowId,
            buyer,
            seller,
            amount,
            status: Number(status),
            raisedAt: await timeOf(block),
            raisedTx: tx,
            resolution: res ? { releasedToSeller: res.releasedToSeller, at: await timeOf(res.block), tx: res.tx } : undefined,
          }
        })
      )
      // Open disputes oldest-first (longest waiting on top); resolved ones newest-first.
      const open = summaries.filter((d) => d.status === DISPUTED).sort((a, b) => a.raisedAt - b.raisedAt)
      const closed = summaries.filter((d) => d.status !== DISPUTED).sort((a, b) => (b.resolution?.at ?? 0) - (a.resolution?.at ?? 0))
      return [...open, ...closed]
    },
  })
}

export interface EscrowTxHashes {
  /** Aligned with OnChainTimeline's steps: CREATED, FUNDED, EXECUTING, DELIVERED, SETTLED. */
  steps: (Hash | undefined)[]
  refund?: Hash
}

// Which lifecycle event marks each timeline step. SETTLED can be reached by
// the buyer accepting, the review window expiring, or an arbiter ruling.
const STEP_EVENTS: string[][] = [
  ['EscrowCreated'],
  ['EscrowFunded'],
  ['ExecutionStarted'],
  ['ResultDelivered'],
  ['EscrowSettled', 'ReviewFinalized', 'DisputeResolved'],
]
const REFUND_EVENTS = ['EscrowRefunded', 'ExecutionTimedOut']

/** The transaction behind each lifecycle step of one escrow, for explorer links. */
export function useEscrowTxHashes(escrowId?: bigint) {
  const client = usePublicClient({ chainId: botChainTestnet.id })

  return useQuery({
    queryKey: ['escrowTxHashes', escrowId?.toString()],
    enabled: !!client && escrowId !== undefined,
    // Hosted agents advance escrows on their own, so keep picking up new steps.
    refetchInterval: 10_000,
    queryFn: async (): Promise<EscrowTxHashes> => {
      const firstHashByEvent = new Map<string, Hash>()
      await forEachChunk(client!, async (fromBlock, toBlock) => {
        // Every AgentEco event indexes escrowId as its first topic — one
        // unfiltered-by-event query catches the escrow's whole lifecycle.
        const logs = await client!.request({
          method: 'eth_getLogs',
          params: [
            {
              address: AGENT_ECO_ADDRESS,
              fromBlock: toHex(fromBlock),
              toBlock: toHex(toBlock),
              topics: [null, toHex(escrowId!, { size: 32 })],
            },
          ],
        })
        for (const log of logs) {
          try {
            const { eventName } = decodeEventLog({ abi: AGENT_ECO_ABI, data: log.data, topics: log.topics as [Hex, ...Hex[]] })
            if (!firstHashByEvent.has(eventName) && log.transactionHash) firstHashByEvent.set(eventName, log.transactionHash)
          } catch {
            // Not an AgentEco event we know about — nothing to link.
          }
        }
      })

      const pick = (names: string[]) => names.map((n) => firstHashByEvent.get(n)).find(Boolean)
      return { steps: STEP_EVENTS.map(pick), refund: pick(REFUND_EVENTS) }
    },
  })
}
