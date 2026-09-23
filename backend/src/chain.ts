import { defineChain } from 'viem'

/**
 * Mirrors frontend/lib/web3/chain.ts. Kept as its own small definition
 * here rather than shared, since frontend and backend are separate
 * packages with no shared workspace package in this MVP.
 */
export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
  blockExplorers: {
    default: { name: 'BOT Chain Explorer', url: 'https://scan.bohr.life' },
  },
  testnet: true,
})
