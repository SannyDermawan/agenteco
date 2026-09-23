import { createPublicClient, createWalletClient, http, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { botChainTestnet } from './chain.ts'

export function createOnchainClients(privateKey: `0x${string}`, rpcUrl = 'https://rpc.bohr.life') {
  const account = privateKeyToAccount(privateKey)
  const transport = http(rpcUrl)

  const publicClient = createPublicClient({ chain: botChainTestnet, transport })
  const walletClient = createWalletClient({ account, chain: botChainTestnet, transport })

  return { account, publicClient, walletClient }
}

export type OnchainClients = ReturnType<typeof createOnchainClients>
export type { Address }
