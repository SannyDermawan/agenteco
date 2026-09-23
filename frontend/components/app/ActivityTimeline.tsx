import type { ActivityEntry, ActivityKind } from '@/lib/agenteco-data'

const KIND_COLOR: Record<ActivityKind, string> = {
  discovery: '#5B5FEF',
  negotiation: '#4F7CFF',
  escrow: '#8B5CF6',
  execution: '#F59E0B',
  settlement: '#22A06B',
}

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div>
      {entries.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[e.kind] }} />
            {i < entries.length - 1 && <span className="w-px flex-1 bg-white/10" style={{ minHeight: 20 }} />}
          </div>
          <div className="pb-4">
            <div className="text-[11px] text-[#54565F]">{e.time}</div>
            <div className="text-[13px] text-[#F5F5F7]">{e.message}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
