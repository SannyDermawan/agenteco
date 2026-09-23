import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { botChainTestnet } from './chain'

export const wagmiConfig = createConfig({
  chains: [botChainTestnet],
  connectors: [injected()],
  transports: {
    [botChainTestnet.id]: http(botChainTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
