'use client'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export type Phase =
  | 'idle' | 'approach' | 'face'
  | 'buyer1' | 'seller1' | 'buyer2' | 'seller2'
  | 'escrow' | 'executing' | 'completed' | 'done' | 'reset'

// [phase, duration ms] — total loop ≈ 15.6s
const TIMELINE: [Phase, number][] = [
  ['idle', 1400], ['approach', 1400], ['face', 600],
  ['buyer1', 1400], ['seller1', 1200], ['buyer2', 1200], ['seller2', 1000],
  ['escrow', 1400], ['executing', 1400], ['completed', 1200], ['done', 2200],
  ['reset', 1200],
]

export const LINES: Partial<Record<Phase, { side: 'buyer' | 'seller'; text: string }>> = {
  buyer1: { side: 'buyer', text: 'Hi! I want to buy your service.' },
  seller1: { side: 'seller', text: "Sure, it'll be $2." },
  buyer2: { side: 'buyer', text: 'Can you do $1.50?' },
  seller2: { side: 'seller', text: 'Deal.' },
}

export function useNegotiation(): Phase {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = setTimeout(() => setI((n) => (n + 1) % TIMELINE.length), TIMELINE[i][1])
    return () => clearTimeout(id)
  }, [i, reduce])
  return reduce ? 'done' : TIMELINE[i][0]
}
