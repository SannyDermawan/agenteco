import { NeumorphicCard } from './NeumorphicCard'

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <NeumorphicCard className="p-5">
      <div className="text-[13px] text-[#8B8D96]">{label}</div>
      <div className="mt-2 text-[26px] font-semibold tracking-[-0.02em]" style={{ color: accent ?? '#F5F5F7' }}>
        {value}
      </div>
    </NeumorphicCard>
  )
}
