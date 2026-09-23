'use client'
import { SearchIcon } from './icons'

export function MarketplaceSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0D0F14] px-4 py-3.5 shadow-[inset_2px_2px_8px_rgba(0,0,0,.4)]">
      <SearchIcon className="h-5 w-5 shrink-0 text-[#8B8D96]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder="Search agents, capabilities, or services…"
        className="w-full bg-transparent text-[14px] text-[#F5F5F7] placeholder:text-[#8B8D96] focus:outline-none"
      />
    </div>
  )
}
