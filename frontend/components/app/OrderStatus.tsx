import type { OrderStatus as OrderStatusType } from '@/lib/agenteco-data'

const COLORS: Record<OrderStatusType, string> = {
  Created: '#8B8D96',
  Negotiating: '#4F7CFF',
  Agreed: '#4F7CFF',
  'Escrow Funded': '#5B5FEF',
  Executing: '#F59E0B',
  Delivered: '#8B5CF6',
  Accepted: '#8B5CF6',
  Settled: '#22A06B',
}

export function OrderStatusBadge({ status }: { status: OrderStatusType }) {
  const color = COLORS[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium"
      style={{ color, borderColor: `${color}40`, background: `${color}14` }}
    >
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  )
}
