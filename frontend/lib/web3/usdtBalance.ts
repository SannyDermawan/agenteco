import { formatUnits } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from './config'
import { ERC20_ABI, USDT_ADDRESS } from './abi'
import { CHAIN_NAME } from './network'

/**
 * Throws a readable error when `wallet` holds less than `amount` USDT. Run it
 * before the first transaction of a flow — otherwise createEscrow still goes
 * through, fundEscrow reverts with "ERC20 transferFrom failed", and the buyer
 * has paid gas for an escrow stuck in CREATED.
 */
export async function assertUsdtBalance(wallet: `0x${string}`, amount: bigint, decimals: number): Promise<void> {
  const balance = await readContract(wagmiConfig, {
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [wallet],
  })
  if (balance < amount) {
    throw new Error(
      `Not enough USDT: this needs ${formatUnits(amount, decimals)} USDT but your wallet holds ` +
        `${formatUnits(balance, decimals)} USDT on ${CHAIN_NAME}. Top up USDT first — no transaction was sent.`
    )
  }
}
