// Trimmed to exactly what an autonomous buyer/seller agent needs to call —
// dispute/refund/arbiter functions stay out of scope for the demo flow.
// Deployment addresses come from ../network.ts (NETWORK + env), not hardcoded.
export { AGENT_ECO_ADDRESS, USDT_ADDRESS } from '../network.ts'

export const EXECUTION_WINDOW_SECONDS = BigInt(24 * 60 * 60) // 24h
export const REVIEW_WINDOW_SECONDS = BigInt(48 * 60 * 60) // 48h

export const AGENT_ECO_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'executionWindow', type: 'uint256' },
      { internalType: 'uint256', name: 'reviewWindow', type: 'uint256' },
    ],
    name: 'createEscrow',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'escrowId', type: 'uint256' }],
    name: 'fundEscrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'escrowId', type: 'uint256' }],
    name: 'startExecution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'escrowId', type: 'uint256' },
      { internalType: 'bytes32', name: 'resultHash', type: 'bytes32' },
    ],
    name: 'markDelivered',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'escrowId', type: 'uint256' }],
    name: 'acceptAndSettle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'escrowId', type: 'uint256' }],
    name: 'getEscrowBasic',
    outputs: [
      { internalType: 'address', name: 'buyer', type: 'address' },
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'enum AgentEco.OrderStatus', name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'escrowId', type: 'uint256' }],
    name: 'getEscrowStatus',
    outputs: [{ internalType: 'enum AgentEco.OrderStatus', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'escrowId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'EscrowCreated',
    type: 'event',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/** Mirrors AgentEco.sol's `OrderStatus` enum ordering exactly. */
export const ON_CHAIN_STATUS = ['CREATED', 'FUNDED', 'EXECUTING', 'DELIVERED', 'DISPUTED', 'SETTLED', 'REFUNDED'] as const
export type OnChainStatus = (typeof ON_CHAIN_STATUS)[number]

export function onChainStatusLabel(status: number): OnChainStatus {
  return ON_CHAIN_STATUS[status] ?? 'CREATED'
}
