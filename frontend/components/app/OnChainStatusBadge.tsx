import { onChainStatusAccent, onChainStatusLabel } from '@/lib/web3/status'

export function OnChainStatusBadge({ status }: { status: number }) {
  const color = onChainStatusAccent(status)
  const label = onChainStatusLabel(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium"
      style={{ color, borderColor: `${color}40`, background: `${color}14` }}
    >
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
