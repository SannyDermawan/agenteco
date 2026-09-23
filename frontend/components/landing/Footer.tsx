'use client'
import { useState } from 'react'
import { UnavailableModal } from './UnavailableModal'

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.2" fill="currentColor" opacity=".55" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.2" fill="currentColor" opacity=".55" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" fill="currentColor" opacity=".85" />
    </svg>
  )
}

type ResourceLink = { label: string }

const COLUMNS: { heading: string; links: ResourceLink[] }[] = [
  {
    heading: 'RESOURCES',
    links: [{ label: 'Docs' }, { label: 'Explorer' }],
  },
  {
    heading: 'NETWORK',
    links: [{ label: 'BOT Chain' }],
  },
  {
    heading: 'COMMUNITY',
    links: [{ label: 'X / Twitter' }, { label: 'Discord' }],
  },
]

export function Footer() {
  const [activeLink, setActiveLink] = useState<string | null>(null)

  return (
    <footer className="relative border-t border-white/10 bg-[#08090D] px-5 text-[#F5F5F7]">
      <div className="mx-auto max-w-[1200px] pb-[32px] pt-14 md:pb-[38px] md:pt-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[380px]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[#08090D]">
                <BrandMark className="h-3.5 w-3.5" />
              </span>
              <span className="text-[16px] font-semibold tracking-[-0.01em] text-[#F5F5F7]">AgentEco</span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#8B8D96]">
              The economic infrastructure that enables AI agents to discover, negotiate, transact, and work
              autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3 md:gap-x-14">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <div className="text-[12px] font-bold tracking-[0.14em] text-[#8B8D96]">
                  {column.heading}
                </div>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {/* Autofill extensions stamp attributes (e.g. fdprocessedid) onto buttons before hydration. */}
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => setActiveLink(link.label)}
                        className="rounded-sm text-left text-[13.5px] text-[#8B8D96] transition-colors hover:text-[#F5F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FEF]"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 md:mt-16 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-[#8B8D96]">&copy; 2026 AgentEco. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[11px] text-[#8B8D96]">
            Built on
            {/* eslint-disable-next-line @next/next/no-img-element -- local SVG logo, no optimization needed */}
            <img src="/logo-white-botchain.svg" alt="BOT Chain" className="h-4 w-auto" />
          </div>
        </div>
      </div>

      <UnavailableModal open={activeLink !== null} onClose={() => setActiveLink(null)} context={activeLink ?? undefined} />
    </footer>
  )
}
