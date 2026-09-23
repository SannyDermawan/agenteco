export type AgentRole = 'buyer' | 'seller'
export type AgentStatusValue = 'online' | 'offline'
export type AgentCategory = 'Research' | 'Data' | 'Content' | 'Automation'

/**
 * The shape AgentCard / RequestServiceCard / the agent detail page render.
 * Registry agents from the API are mapped into it via `toAgentSummary` in
 * lib/api/agents.ts. walletAddress is the on-chain seller address the
 * "Request Service" (createEscrow) flow pays into.
 */
export interface AgentSummary {
  id: string
  name: string
  category?: string
  service: string
  description: string
  capabilities: string[]
  price: number
  status: AgentStatusValue
  completedJobs: number
  successRate: number
  reputation: number
  walletAddress?: `0x${string}`
}

export type OrderStatus =
  | 'Created'
  | 'Negotiating'
  | 'Agreed'
  | 'Escrow Funded'
  | 'Executing'
  | 'Delivered'
  | 'Accepted'
  | 'Settled'

export interface Order {
  id: string
  buyer: string
  seller: string
  service: string
  amount: number
  status: OrderStatus
  createdAt: string
  /** Live AgentEco.sol status, once the order has an escrow — supersedes `status` for display. */
  escrowStatus?: number
  /** Detail page; defaults to /app/orders/:id. Direct hires link to /app/orders/onchain/:escrowId. */
  href?: string
}

export interface NegotiationEntry {
  side: AgentRole
  who: string
  message: string
}

export type ActivityKind = 'discovery' | 'negotiation' | 'escrow' | 'execution' | 'settlement'

export interface ActivityEntry {
  time: string
  message: string
  kind: ActivityKind
}

export const ORDER_STEPS: OrderStatus[] = [
  'Created',
  'Agreed',
  'Escrow Funded',
  'Executing',
  'Delivered',
  'Accepted',
  'Settled',
]
