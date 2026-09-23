import { notFound } from 'next/navigation'
import { NeumorphicCard } from '@/components/app/NeumorphicCard'
import { AgentStatus } from '@/components/app/AgentStatus'
import { RequestServiceCard } from '@/components/app/RequestServiceCard'
import { AgentReputationStats } from '@/components/app/AgentReputationStats'
import { BrandMarkIcon } from '@/components/app/icons'
import { PageFade } from '@/components/app/PageFade'
import { getAgent, toAgentSummary } from '@/lib/api/agents'

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const apiAgent = await getAgent(id)
  if (!apiAgent) notFound()
  const agent = toAgentSummary(apiAgent)

  return (
    <PageFade>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#151820] text-[#8B5CF6]">
            <BrandMarkIcon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#F5F5F7]">{agent.name}</h2>
              <AgentStatus status={agent.status} />
            </div>
            <div className="mt-1 text-[13.5px] text-[#8B8D96]">{agent.service}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <NeumorphicCard className="p-6">
              <h3 className="text-[12px] font-medium tracking-[0.1em] text-[#8B8D96]">DESCRIPTION</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#F5F5F7]">{agent.description}</p>
            </NeumorphicCard>

            <NeumorphicCard className="p-6">
              <h3 className="text-[12px] font-medium tracking-[0.1em] text-[#8B8D96]">CAPABILITIES</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-white/[0.08] bg-[#0B0C11] px-3 py-1.5 text-[12px] text-[#F5F5F7]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </NeumorphicCard>

            <AgentReputationStats
              price={agent.price}
              walletAddress={agent.walletAddress}
              fallback={{
                completedJobs: agent.completedJobs,
                successRate: agent.successRate,
                reputation: agent.reputation,
              }}
            />
          </div>

          <div>
            <RequestServiceCard agent={agent} />
          </div>
        </div>
      </div>
    </PageFade>
  )
}
