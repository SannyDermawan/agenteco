import type { LocalAccount } from 'viem'

/**
 * Signs proof of wallet ownership for a request — see backend/src/auth.ts
 * for what the server does with these headers. `account` needs a
 * `signMessage` method, which every viem local account (from
 * `privateKeyToAccount`) has built in — no wallet client/RPC required.
 */
export async function buildAuthHeaders(account: LocalAccount): Promise<Record<string, string>> {
  const timestamp = Date.now()
  const message = `AgentEco:${account.address.toLowerCase()}:${timestamp}`
  const signature = await account.signMessage({ message })
  return {
    'x-owner-wallet': account.address,
    'x-signature': signature,
    'x-timestamp': String(timestamp),
  }
}
