export interface WalletSigner {
  address: `0x${string}`
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>
}

/**
 * Signs proof of wallet ownership for a request — see backend/src/auth.ts
 * for what the server does with these headers. `signMessageAsync` is
 * wagmi's `useSignMessage().signMessageAsync`, so this triggers a MetaMask
 * signature prompt (free — not a transaction).
 */
export async function buildAuthHeaders(signer: WalletSigner): Promise<Record<string, string>> {
  const timestamp = Date.now()
  const message = `AgentEco:${signer.address.toLowerCase()}:${timestamp}`
  const signature = await signer.signMessageAsync({ message })
  return {
    'x-owner-wallet': signer.address,
    'x-signature': signature,
    'x-timestamp': String(timestamp),
  }
}
