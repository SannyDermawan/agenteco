'use client'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const MAX_PARALLAX_X = 10
const MAX_PARALLAX_Y = 6
const PARALLAX_EASE = 0.06

/**
 * Hero background: the source image anchors the scene, three low-opacity
 * radial layers add barely-perceptible breathing/drift on top of it (pure
 * CSS, gated by prefers-reduced-motion in globals.css), and pointer
 * movement nudges those layers a few px via a CSS variable written
 * directly to the DOM — no React state, so mouse movement never re-renders.
 */
export function AnimatedBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return

    const el = parallaxRef.current
    if (!el) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frame = 0

    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2 * MAX_PARALLAX_X
      targetY = (event.clientY / window.innerHeight - 0.5) * 2 * MAX_PARALLAX_Y
    }

    const tick = () => {
      currentX += (targetX - currentX) * PARALLAX_EASE
      currentY += (targetY - currentY) * PARALLAX_EASE
      el.style.setProperty('--parallax-x', `${currentX.toFixed(2)}px`)
      el.style.setProperty('--parallax-y', `${currentY.toFixed(2)}px`)
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(frame)
    }
  }, [reduceMotion])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/hero-background.png')" }}
      />

      <div
        ref={parallaxRef}
        className="absolute inset-0"
        style={{ transform: 'translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)' }}
      >
        <div
          className="hero-glow-blue absolute inset-0"
          style={{
            background: 'radial-gradient(46% 60% at 4% 28%, rgba(90,150,255,.18), transparent 62%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="hero-glow-purple absolute inset-0"
          style={{
            background: 'radial-gradient(48% 42% at 92% 4%, rgba(150,90,200,.16), transparent 64%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="hero-glow-horizon absolute inset-x-0 bottom-0 h-[36%]"
          style={{
            background: 'radial-gradient(55% 100% at 50% 100%, rgba(70,120,255,.18), transparent 72%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
    </div>
  )
}
