import { defineChain } from 'viem'
import { CHAIN_ID, CHAIN_NAME, EXPLORER_URL, IS_TESTNET, RPC_URL } from './network'

/** The chain this build targets — testnet or mainnet, from NEXT_PUBLIC_NETWORK (see ./network.ts). */
export const botChain = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'BOT Chain Explorer', url: EXPLORER_URL },
  },
  testnet: IS_TESTNET,
})
