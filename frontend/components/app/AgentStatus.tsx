import type { AgentStatusValue } from '@/lib/agenteco-data'

export function AgentStatus({
  status,
  labels = { on: 'Online', off: 'Offline' },
}: {
  status: AgentStatusValue
  // A hosted buyer reads as Running/Paused rather than Online/Offline.
  labels?: { on: string; off: string }
}) {
  const online = status === 'online'
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${online ? 'text-[#22A06B]' : 'text-[#8B8D96]'}`}
    >
      <i className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-[#22A06B] shadow-[0_0_6px_#22A06B]' : 'bg-[#8B8D96]'}`} />
      {online ? labels.on : labels.off}
    </span>
  )
}
