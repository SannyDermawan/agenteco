import { createPublicClient, http, parseUnits, formatEther, type Address } from 'viem'
import { RPC_URL, USDT_ADDRESS, botChain } from './network.ts'

const ERC20_ABI = [
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

// Buyer: enough for createEscrow + approve + fundEscrow + acceptAndSettle + one refund transfer.
// Seller: enough for a handful of startExecution + markDelivered + earnings-sweep rounds.
const MIN_BOT_FOR_GAS = '0.05'

const publicClient = createPublicClient({ chain: botChain, transport: http(RPC_URL) })

export async function getChainHead(): Promise<bigint> {
  return publicClient.getBlockNumber()
}

/** Pass requiredUsdt = '0' for a hosted seller — it only needs gas, not a budget. */
export async function checkHostedDeposit(
  walletAddress: Address,
  requiredUsdt: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const decimals = await publicClient.readContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const requiredAmount = parseUnits(requiredUsdt, decimals)

  const [usdtBalance, botBalance] = await Promise.all([
    publicClient.readContract({ address: USDT_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress] }),
    publicClient.getBalance({ address: walletAddress }),
  ])

  if (usdtBalance < requiredAmount) {
    return { ok: false, error: `Agent wallet has not received the required ${requiredUsdt} USDT deposit yet.` }
  }
  if (botBalance < parseUnits(MIN_BOT_FOR_GAS, 18)) {
    return { ok: false, error: `Agent wallet needs at least ${MIN_BOT_FOR_GAS} BOT for gas (has ${formatEther(botBalance)}).` }
  }

  return { ok: true }
}
