export type AgentRole = 'buyer' | 'seller'

export interface AgentConfig {
  name: string
  role: AgentRole
  capabilities: string[]
  description: string
  category?: string
  service?: string
  /** The agent's own asking price (seller) or initial offer (buyer). */
  basePrice: number
  /** Seller only: the lowest price this agent is allowed to settle for. */
  minimumPrice?: number
  /** Buyer only: the highest price this agent is allowed to pay. */
  maxBudget?: number
}

export interface DemoTaskResult {
  status: 'completed'
  [key: string]: unknown
}

export type NegotiationDecision =
  | { action: 'accept' }
  | { action: 'counter'; price: number }
  | { action: 'reject' }
