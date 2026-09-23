import type { NegotiationEntry } from '@/lib/agenteco-data'

export function NegotiationTimeline({ entries }: { entries: NegotiationEntry[] }) {
  return (
    <div className="space-y-2.5">
      {entries.map((e, i) => (
        <div key={i} className={`flex ${e.side === 'buyer' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[75%] rounded-xl border px-3.5 py-2.5 text-[13px] ${
              e.side === 'buyer'
                ? 'border-[#4F7CFF]/30 bg-[#4F7CFF]/10 text-[#F5F5F7]'
                : 'border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#F5F5F7]'
            }`}
          >
            <div
              className={`mb-0.5 text-[10px] font-medium tracking-[0.06em] ${
                e.side === 'buyer' ? 'text-[#4F7CFF]' : 'text-[#8B5CF6]'
              }`}
            >
              {e.who.toUpperCase()}
            </div>
            {e.message}
          </div>
        </div>
      ))}
    </div>
  )
}
