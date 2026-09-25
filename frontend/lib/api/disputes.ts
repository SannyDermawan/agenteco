import { buildAuthHeaders, type WalletSigner } from './authHeaders'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export interface ApiDisputeReason {
  id: string
  escrowId: string
  buyerWallet: string
  reason: string
  createdAt: string
  updatedAt: string
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function getDisputeReason(escrowId: string): Promise<ApiDisputeReason | null> {
  const res = await fetch(`${API_URL}/disputes/${escrowId}`, { cache: 'no-store' })
  if (res.status === 404) return null
  return parseOrThrow(res)
}

export async function listDisputeReasons(): Promise<ApiDisputeReason[]> {
  return parseOrThrow(await fetch(`${API_URL}/disputes`, { cache: 'no-store' }))
}

/** The buyer's side of the story for the arbiter — signed, since only the escrow's buyer may write it. */
export async function submitDisputeReason(signer: WalletSigner, escrowId: string, reason: string): Promise<ApiDisputeReason> {
  const authHeaders = await buildAuthHeaders(signer)
  const res = await fetch(`${API_URL}/disputes/${escrowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ reason }),
  })
  return parseOrThrow(res)
}
