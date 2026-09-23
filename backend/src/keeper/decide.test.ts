import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decideKeeperAction, ORDER_STATUS } from './decide.ts'

test('claims execution timeout when EXECUTING and the deadline has passed', () => {
  assert.equal(decideKeeperAction(ORDER_STATUS.EXECUTING, true, false), 'claimExecutionTimeout')
})

test('does nothing when EXECUTING but still within the execution window', () => {
  assert.equal(decideKeeperAction(ORDER_STATUS.EXECUTING, false, false), null)
})

test('finalizes when DELIVERED and the review window has expired', () => {
  assert.equal(decideKeeperAction(ORDER_STATUS.DELIVERED, false, true), 'finalizeAfterReviewWindow')
})

test('does nothing when DELIVERED but still within the review window', () => {
  assert.equal(decideKeeperAction(ORDER_STATUS.DELIVERED, false, false), null)
})

test('never acts on terminal or pre-execution statuses, even if flags are true', () => {
  assert.equal(decideKeeperAction(ORDER_STATUS.CREATED, true, true), null)
  assert.equal(decideKeeperAction(ORDER_STATUS.FUNDED, true, true), null)
  assert.equal(decideKeeperAction(ORDER_STATUS.DISPUTED, true, true), null)
  assert.equal(decideKeeperAction(ORDER_STATUS.SETTLED, true, true), null)
  assert.equal(decideKeeperAction(ORDER_STATUS.REFUNDED, true, true), null)
})
