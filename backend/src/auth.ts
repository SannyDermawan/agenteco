import type { Request } from 'express'
import { isAddress, recoverMessageAddress, type Address } from 'viem'

// A signature is only valid for this long after its timestamp — bounds how
// long a captured header set could be replayed.
const MAX_AGE_MS = 60_000

export type AuthResult = { ok: true; wallet: Address } | { ok: false; error: string }

/**
 * Cryptographic proof of wallet ownership — replaces trusting a plain
 * x-owner-wallet header. The caller signs `AgentEco:<wallet>:<timestamp>`
 * with their private key (see agent-runtime/src/authHeaders.ts and
 * frontend/lib/api/authHeaders.ts) and sends the signature + timestamp
 * alongside the claimed wallet. This only proves *who is calling* —
 * whether that wallet is allowed to touch a given resource is still a
 * separate, per-route check against that resource's stored ownerWallet.
 */
export async function verifyOwnerAuth(req: Request): Promise<AuthResult> {
  const wallet = req.header('x-owner-wallet')
  const signature = req.header('x-signature')
  const timestampRaw = req.header('x-timestamp')

  if (!wallet || !isAddress(wallet)) return { ok: false, error: 'Missing or invalid x-owner-wallet header' }
  if (!signature) return { ok: false, error: 'Missing x-signature header' }
  if (!timestampRaw) return { ok: false, error: 'Missing x-timestamp header' }

  const timestamp = Number(timestampRaw)
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_AGE_MS) {
    return { ok: false, error: 'x-timestamp is missing, invalid, or expired (must be within 60s of the server clock)' }
  }

  const message = `AgentEco:${wallet.toLowerCase()}:${timestamp}`
  try {
    const recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` })
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return { ok: false, error: 'Signature does not match x-owner-wallet' }
    }
  } catch {
    return { ok: false, error: 'Malformed signature' }
  }

  return { ok: true, wallet: wallet as Address }
}

/**
 * Is `wallet` allowed to act as this agent? True for the human owner
 * (administrative actions from the website — toggling online/offline,
 * editing) OR the agent's own operating wallet (a hosted buyer task's host
 * runtime, signing with the key it holds for exactly this agent). A
 * self-custodied agent like buyer-agent/seller-agent has these be the same
 * address anyway, so this is a strict superset of the old check.
 */
export function isAuthorizedForAgent(wallet: Address, agent: { ownerWallet: string; walletAddress: string | null }): boolean {
  if (wallet.toLowerCase() === agent.ownerWallet.toLowerCase()) return true
  if (agent.walletAddress && wallet.toLowerCase() === agent.walletAddress.toLowerCase()) return true
  return false
}
