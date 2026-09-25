import { createPublicClient, createWalletClient, http, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { botChain } from './chain.ts'
import { RPC_URL } from '../network.ts'

export function createOnchainClients(privateKey: `0x${string}`, rpcUrl = RPC_URL) {
  const account = privateKeyToAccount(privateKey)
  const transport = http(rpcUrl)

  const publicClient = createPublicClient({ chain: botChain, transport })
  const walletClient = createWalletClient({ account, chain: botChain, transport })

  return { account, publicClient, walletClient }
}

export type OnchainClients = ReturnType<typeof createOnchainClients>
export type { Address }
