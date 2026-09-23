/** Mirrors AgentEco.sol's OrderStatus enum exactly. Do not renumber. */
export const ORDER_STATUS = {
  CREATED: 0,
  FUNDED: 1,
  EXECUTING: 2,
  DELIVERED: 3,
  DISPUTED: 4,
  SETTLED: 5,
  REFUNDED: 6,
} as const

export type KeeperAction = 'claimExecutionTimeout' | 'finalizeAfterReviewWindow' | null

/**
 * Pure decision function — no I/O. Given an escrow's on-chain status and
 * the two eligibility flags the contract itself exposes
 * (isExecutionTimedOut / isReviewExpired), decides which keeper action,
 * if any, should be submitted. Kept separate from the RPC/tx code so it's
 * trivially unit-testable without a live chain connection.
 */
export function decideKeeperAction(
  status: number,
  isExecutionTimedOut: boolean,
  isReviewExpired: boolean
): KeeperAction {
  if (status === ORDER_STATUS.EXECUTING && isExecutionTimedOut) {
    return 'claimExecutionTimeout'
  }
  if (status === ORDER_STATUS.DELIVERED && isReviewExpired) {
    return 'finalizeAfterReviewWindow'
  }
  return null
}
