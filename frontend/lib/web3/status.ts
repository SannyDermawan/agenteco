/** Mirrors AgentEco.sol's `OrderStatus` enum ordering exactly. */
export const ON_CHAIN_STATUS = [
  'CREATED',
  'FUNDED',
  'EXECUTING',
  'DELIVERED',
  'DISPUTED',
  'SETTLED',
  'REFUNDED',
] as const

export type OnChainStatus = (typeof ON_CHAIN_STATUS)[number]

export function onChainStatusLabel(status: number): OnChainStatus {
  return ON_CHAIN_STATUS[status] ?? 'CREATED'
}

const ACCENT: Record<OnChainStatus, string> = {
  CREATED: '#8B8D96',
  FUNDED: '#5B5FEF',
  EXECUTING: '#F59E0B',
  DELIVERED: '#8B5CF6',
  DISPUTED: '#EF4444',
  SETTLED: '#22A06B',
  REFUNDED: '#8B8D96',
}

export function onChainStatusAccent(status: number): string {
  return ACCENT[onChainStatusLabel(status)]
}
