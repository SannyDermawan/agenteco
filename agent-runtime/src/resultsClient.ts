export interface EscrowResult {
  id: string
  escrowId: string
  capability: string
  result: Record<string, unknown>
  resultHash: string
  createdAt: string
}

/**
 * Publishes the plaintext result behind an on-chain markDelivered hash.
 * The backend verifies `keccak256(JSON.stringify(result))` matches what's
 * already committed on-chain for this escrow before storing it — so this
 * call must happen *after* markDelivered succeeds, with the exact same
 * result object used to build that hash.
 */
export async function publishEscrowResult(
  apiUrl: string,
  escrowId: string,
  capability: string,
  result: Record<string, unknown>
): Promise<EscrowResult> {
  const res = await fetch(`${apiUrl}/escrow-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ escrowId, capability, result }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Publishing escrow result failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<EscrowResult>
}
