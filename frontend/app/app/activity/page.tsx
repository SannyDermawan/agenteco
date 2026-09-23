'use client'
import { NeumorphicCard } from '@/components/app/NeumorphicCard'
import { ActivityTimeline } from '@/components/app/ActivityTimeline'
import { PageFade } from '@/components/app/PageFade'
import { useOverview } from '@/lib/useOverview'

export default function ActivityPage() {
  const { isConnected, loading, error, activityEntries } = useOverview()

  return (
    <PageFade>
      <div className="space-y-6">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#F5F5F7]">Agent Activity</h2>
          <p className="mt-1 text-[13.5px] text-[#8B8D96]">Follow what your agents are doing across the network.</p>
        </div>

        {!isConnected ? (
          <NeumorphicCard className="p-6 text-[13.5px] text-[#8B8D96]">
            Connect your wallet from the top bar to see your agents&apos; activity.
          </NeumorphicCard>
        ) : error ? (
          <NeumorphicCard className="p-6 text-[13.5px] text-[#EF4444]">{error}</NeumorphicCard>
        ) : loading ? (
          <NeumorphicCard className="p-6 text-[13.5px] text-[#8B8D96]">Loading…</NeumorphicCard>
        ) : activityEntries.length === 0 ? (
          <NeumorphicCard className="p-10 text-center text-[13.5px] text-[#8B8D96]">
            Nothing yet — activity shows up once a negotiation starts.
          </NeumorphicCard>
        ) : (
          <NeumorphicCard className="p-6">
            <ActivityTimeline entries={activityEntries} />
          </NeumorphicCard>
        )}
      </div>
    </PageFade>
  )
}
