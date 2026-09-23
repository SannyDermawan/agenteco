'use client'
import { motion } from 'framer-motion'
import { CheckIcon } from './icons'
import { ORDER_STEPS, type OrderStatus } from '@/lib/agenteco-data'

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = ORDER_STEPS.indexOf(status)

  return (
    <div className="flex flex-col">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIndex || (i === currentIndex && status === 'Settled')
        const current = i === currentIndex && status !== 'Settled'
        return (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? 'border-[#22A06B]/50 bg-[#22A06B]/15 text-[#22A06B]'
                    : current
                      ? 'border-[#5B5FEF]/60 bg-[#5B5FEF]/15 text-[#5B5FEF]'
                      : 'border-white/10 bg-[#0D0F14] text-[#54565F]'
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {i < ORDER_STEPS.length - 1 && (
                <span
                  className={`w-px flex-1 ${i < currentIndex ? 'bg-[#22A06B]/40' : 'bg-white/10'}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>
            <div
              className={`pb-6 text-[13.5px] ${done || current ? 'text-[#F5F5F7]' : 'text-[#54565F]'} ${
                current ? 'font-semibold' : 'font-medium'
              }`}
            >
              {step}
              {current && <span className="ml-2 text-[11px] font-normal text-[#5B5FEF]">In progress</span>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
