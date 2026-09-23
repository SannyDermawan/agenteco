import type { Address, PublicClient } from 'viem'
import { AGENT_ECO_ADDRESS } from '../../../agent-runtime/src/onchain/abi.ts'

const REPUTATION_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'agent', type: 'address' }],
    name: 'getReputation',
    outputs: [
      { internalType: 'uint256', name: 'completedJobs', type: 'uint256' },
      { internalType: 'uint256', name: 'failedJobs', type: 'uint256' },
      { internalType: 'uint256', name: 'totalVolumeSettled', type: 'uint256' },
      { internalType: 'uint256', name: 'successRateBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface OnchainReputation {
  completedJobs: number
  successRatePct: number
}

export async function getOnchainReputation(publicClient: PublicClient, address: Address): Promise<OnchainReputation> {
  const [completedJobs, , , successRateBps] = await publicClient.readContract({
    address: AGENT_ECO_ADDRESS,
    abi: REPUTATION_ABI,
    functionName: 'getReputation',
    args: [address],
  })
  return { completedJobs: Number(completedJobs), successRatePct: Number(successRateBps) / 100 }
}
