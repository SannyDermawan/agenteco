'use client'
import { useQuery } from '@tanstack/react-query'
import { NeumorphicCard } from './NeumorphicCard'
import { getEscrowResult } from '@/lib/api/escrowResults'

const DELIVERED_OR_LATER = 3 // AgentEco.sol OrderStatus.DELIVERED
const RETRY_MS = 4000

/** Shown once an escrow reaches DELIVERED or later — shared by the on-chain
 * order page and the off-chain order page's live status section. */
export function EscrowResultCard({ escrowId, status }: { escrowId: bigint; status: number }) {
  // The seller commits the result hash on-chain first and publishes the
  // plaintext a few seconds later, so a page that sees DELIVERED early gets a
  // 404 — keep polling until the result lands, then stop.
  const { data: result } = useQuery({
    queryKey: ['escrowResult', escrowId.toString()],
    queryFn: () => getEscrowResult(escrowId.toString()),
    enabled: status >= DELIVERED_OR_LATER,
    refetchInterval: (query) => (query.state.data ? false : RETRY_MS),
  })

  if (status < DELIVERED_OR_LATER) return null

  return (
    <NeumorphicCard className="p-6">
      <h3 className="mb-3 text-[12px] font-medium tracking-[0.1em] text-[#8B8D96]">RESULT</h3>
      {result ? (
        <>
          <div className="mb-2 text-[12px] text-[#8B8D96]">Capability: {result.capability}</div>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0B0C11] p-3.5 text-[12px] leading-relaxed text-[#F5F5F7]">
            {JSON.stringify(result.result, null, 2)}
          </pre>
          <div className="mt-2 truncate font-mono text-[10.5px] text-[#54565F]" title={result.resultHash}>
            hash: {result.resultHash}
          </div>
        </>
      ) : (
        <p className="text-[13px] text-[#8B8D96]">
          No result recorded off-chain yet — only its hash was committed on-chain.
        </p>
      )}
    </NeumorphicCard>
  )
}
