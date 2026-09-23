import type { HTMLAttributes, ReactNode } from 'react'

type Variant = 'raised' | 'inset' | 'flat'

const VARIANT_CLASS: Record<Variant, string> = {
  raised:
    'bg-[#0D0F14] border border-white/[0.06] shadow-[6px_6px_18px_rgba(0,0,0,.45),-4px_-4px_16px_rgba(255,255,255,.015)]',
  inset:
    'bg-[#0B0C11] border border-white/[0.05] shadow-[inset_3px_3px_8px_rgba(0,0,0,.5),inset_-2px_-2px_6px_rgba(255,255,255,.02)]',
  flat: 'bg-[#0D0F14] border border-white/[0.06]',
}

export function NeumorphicCard({
  children,
  className = '',
  variant = 'raised',
  ...rest
}: { children: ReactNode; className?: string; variant?: Variant } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl ${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
