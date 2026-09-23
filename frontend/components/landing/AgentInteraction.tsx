'use client'
import { useEffect } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { BuyerAgent } from './BuyerAgent'
import { SellerAgent } from './SellerAgent'
import { SpeechBubble } from './SpeechBubble'
import { EscrowCard } from './EscrowCard'
import { TransactionStatus, type Status } from './TransactionStatus'
import { LINES, useNegotiation, type Phase } from './useNegotiation'
import type { Lit } from './AgentShell'

const ESCROW: Phase[] = ['escrow', 'executing', 'completed', 'done']
const STATUS: Partial<Record<Phase, Status>> = { executing: 'executing', completed: 'completed', done: 'done' }

export function AgentInteraction() {
  const phase = useNegotiation()
  const reduce = useReducedMotion()
  const together = phase !== 'idle' && phase !== 'reset'
  const progress = useMotionValue(0)
  useEffect(() => {
    const c = animate(progress, together ? 1 : 0, {
      duration: reduce ? 0 : together ? 1.4 : 1.2, ease: [0.65, 0, 0.35, 1],
    })
    return () => c.stop()
  }, [together, reduce, progress])

  const line = LINES[phase]
  const escrowOn = ESCROW.includes(phase)
  const settled = phase === 'completed' || phase === 'done'
  const lit = (side: 'buyer' | 'seller'): Lit =>
    phase === 'seller2' ? 'bright' : line ? (line.side === side ? 'active' : 'dim') : 'idle'
  const center = { left: '50%', transform: 'translateX(-50%)' } as const

  return (
    <div
      className="relative mt-1 w-[min(1120px,100%)] [--aw:clamp(70px,21.5vw,122px)] [--eb:calc(72px_+_var(--aw)*.672)] [--g:-2px] [container-type:inline-size] md:[--aw:clamp(88px,15.1vw,198px)] md:[--eb:calc(60px_+_var(--aw)*.26)] md:[--g:40px]"
      style={{ height: 'calc(var(--aw) * .672 + 175px)' }}
    >
      {/* soft glow in the interaction area between the agents */}
      <div aria-hidden className="pointer-events-none absolute" style={{ ...center, bottom: 'calc(var(--g) + 10px)', width: '44%', height: '62%' }}>
        <motion.div className="absolute inset-0" animate={{ opacity: escrowOn && !settled ? 1 : 0 }} transition={{ duration: 0.9 }}
          style={{ background: 'radial-gradient(closest-side, rgba(91,95,239,.22), transparent)' }} />
        <motion.div className="absolute inset-0" animate={{ opacity: settled ? 1 : 0 }} transition={{ duration: 0.9 }}
          style={{ background: 'radial-gradient(closest-side, rgba(34,160,107,.18), transparent)' }} />
      </div>

      <BuyerAgent progress={progress} lit={lit('buyer')} />
      <SellerAgent progress={progress} lit={lit('seller')} />

      <AnimatePresence>
        {line && <SpeechBubble key={phase} side={line.side}>{line.text}</SpeechBubble>}
      </AnimatePresence>

      <div className="absolute" style={{ ...center, bottom: 'var(--eb)' }}>
        <EscrowCard show={escrowOn} settled={phase === 'done'} />
      </div>
      <div className="absolute" style={{ ...center, bottom: 'calc(var(--eb) - 58px)' }}>
        <TransactionStatus status={STATUS[phase] ?? null} />
      </div>
    </div>
  )
}
