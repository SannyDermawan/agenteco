'use client'
import type { AgentStatusValue } from '@/lib/agenteco-data'

export function AvailabilityToggle({
  status,
  onChange,
  labels = { on: 'online', off: 'offline' },
}: {
  status: AgentStatusValue
  onChange: (next: AgentStatusValue) => void
  labels?: { on: string; off: string }
}) {
  const online = status === 'online'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={online}
      aria-label={online ? `Set agent ${labels.off.toLowerCase()}` : `Set agent ${labels.on.toLowerCase()}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onChange(online ? 'offline' : 'online')
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        online ? 'bg-[#22A06B]' : 'bg-white/[0.12]'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          online ? 'translate-x-[19px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}
