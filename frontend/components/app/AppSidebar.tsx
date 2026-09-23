'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { JSX } from 'react'
import {
  BrandMarkIcon,
  DashboardIcon,
  MarketplaceIcon,
  AgentsIcon,
  CreateAgentIcon,
  OrdersIcon,
  ActivityIcon,
  CloseIcon,
  type IconProps,
} from './icons'

const NAV: { group: string; items: { label: string; href: string; icon: (props: IconProps) => JSX.Element }[] }[] = [
  { group: 'MARKETPLACE', items: [{ label: 'Marketplace', href: '/app/marketplace', icon: MarketplaceIcon }] },
  { group: 'OVERVIEW', items: [{ label: 'Dashboard', href: '/app/dashboard', icon: DashboardIcon }] },
  {
    group: 'MY AGENTS',
    items: [
      { label: 'My Agents', href: '/app/agents', icon: AgentsIcon },
      { label: 'Create Agent', href: '/app/create-agent', icon: CreateAgentIcon },
    ],
  },
  {
    group: 'TRANSACTIONS',
    items: [
      { label: 'Orders', href: '/app/orders', icon: OrdersIcon },
      { label: 'Activity', href: '/app/activity', icon: ActivityIcon },
    ],
  },
]

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div aria-hidden onClick={onClose} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/[0.06] bg-[#0B0C11] transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[64px] shrink-0 items-center justify-between px-5">
          <Link href="/app/marketplace" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-[#08090D]">
              <BrandMarkIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#F5F5F7]">AgentEco</span>
          </Link>
          <button onClick={onClose} className="rounded-md p-1 text-[#8B8D96] lg:hidden" aria-label="Close menu">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-2.5 text-[10.5px] font-medium tracking-[0.12em] text-[#54565F]">{group.group}</div>
              <div className="mt-2 space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] transition ${
                        active
                          ? 'bg-[#5B5FEF]/[0.12] text-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(91,95,239,.35)]'
                          : 'text-[#8B8D96] hover:bg-white/[0.03] hover:text-[#F5F5F7]'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
