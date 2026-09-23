'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const RGB = { buyer: '79,124,255', seller: '139,92,246' } as const

export function SpeechBubble({ side, children }: { side: 'buyer' | 'seller'; children: ReactNode }) {
  const rgb = RGB[side]
  const edge = `rgba(${rgb},.42)`
  const buyer = side === 'buyer'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className={`absolute whitespace-nowrap rounded-xl border bg-[#0E1017] px-3 py-2 text-[12.5px] text-[#F5F5F7] md:px-[15px] md:py-2.5 md:text-sm ${
        buyer ? 'left-[1%] md:left-[23%]' : 'right-[1%] md:right-[23%]'
      }`}
      style={{
        bottom: 'calc(94px + var(--aw) * .672)', borderColor: edge,
        boxShadow: `0 10px 30px rgba(0,0,0,.55), 0 0 26px rgba(${rgb},.15)`,
      }}
    >
      {children}
      <span
        aria-hidden
        className="absolute -bottom-[5px] h-[9px] w-[9px] rotate-45 border-b border-r bg-[#0E1017]"
        style={{ borderColor: edge, [buyer ? 'left' : 'right']: 26 }}
      />
    </motion.div>
  )
}
