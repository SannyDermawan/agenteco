import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { botChainTestnet } from './chain.ts'
import type { KeeperConfig } from './config.ts'

export function createClients(config: KeeperConfig) {
  const account = privateKeyToAccount(config.keeperPrivateKey)
  const transport = http(config.rpcUrl)

  const publicClient = createPublicClient({ chain: botChainTestnet, transport })
  const walletClient = createWalletClient({ account, chain: botChainTestnet, transport })

  return { account, publicClient, walletClient }
}

export type Clients = ReturnType<typeof createClients>
