'use client'
import { AnimatePresence, motion } from 'framer-motion'

export type Status = 'executing' | 'completed' | 'done' | null
const COPY = { executing: 'Executing…', completed: '✓ Completed', done: '✓ Transaction Complete' }

export function TransactionStatus({ status }: { status: Status }) {
  const ok = status === 'completed' || status === 'done'
  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 whitespace-nowrap rounded-full border bg-white/[0.06] px-[13px] py-1.5 text-[12.5px] backdrop-blur-xl transition-colors duration-500"
          style={{
            color: ok ? '#22A06B' : '#8B8D96',
            borderColor: ok ? 'rgba(34,160,107,.4)' : 'rgba(255,255,255,.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          {!ok && (
            <motion.i
              className="h-1.5 w-1.5 rounded-full bg-[#5B5FEF]"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {COPY[status]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
