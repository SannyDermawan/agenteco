import { defineChain } from 'viem'

/**
 * Native currency assumed 18 decimals / symbol "BOT" — display-only
 * placeholder. Confirm against BOT Chain's actual docs and adjust if wrong.
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
