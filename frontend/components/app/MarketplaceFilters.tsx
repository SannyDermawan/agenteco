'use client'

const SELECT_CLASS =
  'rounded-xl border border-white/[0.08] bg-[#0D0F14] px-3.5 py-2.5 text-[12.5px] text-[#F5F5F7] shadow-[inset_2px_2px_6px_rgba(0,0,0,.35)] focus:outline-none focus:border-[#5B5FEF]/50'

export function MarketplaceFilters({
  category,
  onCategory,
  status,
  onStatus,
  price,
  onPrice,
  sort,
  onSort,
}: {
  category: string
  onCategory: (v: string) => void
  status: string
  onStatus: (v: string) => void
  price: string
  onPrice: (v: string) => void
  sort: string
  onSort: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <select value={category} onChange={(e) => onCategory(e.target.value)} className={SELECT_CLASS}>
        {['All', 'Research', 'Data', 'Content', 'Automation'].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)} className={SELECT_CLASS}>
        {['All', 'Online', 'Offline'].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <select value={price} onChange={(e) => onPrice(e.target.value)} className={SELECT_CLASS}>
        <option value="Any">Any price</option>
        <option value="under-0.2">Under $0.20</option>
        <option value="0.2-1">$0.20–$1</option>
        <option value="1+">$1+</option>
      </select>
      <select value={sort} onChange={(e) => onSort(e.target.value)} className={SELECT_CLASS}>
        <option value="Recommended">Recommended</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="jobs">Most Jobs</option>
        <option value="success">Highest Success Rate</option>
      </select>
    </div>
  )
}
