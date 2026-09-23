'use client'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const TYPE_MS = 55
const DELETE_MS = 28
const HOLD_MS = 1500
const GAP_MS = 250

export function Typewriter({ words }: { words: string[] }) {
  const reduce = useReducedMotion()
  const [wordIndex, setWordIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduce) return
    const word = words[wordIndex]

    if (!deleting && length === word.length) {
      const id = setTimeout(() => setDeleting(true), HOLD_MS)
      return () => clearTimeout(id)
    }
    if (deleting && length === 0) {
      const id = setTimeout(() => {
        setDeleting(false)
        setWordIndex((i) => (i + 1) % words.length)
      }, GAP_MS)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => {
      setLength((n) => n + (deleting ? -1 : 1))
    }, deleting ? DELETE_MS : TYPE_MS)
    return () => clearTimeout(id)
  }, [length, deleting, wordIndex, words, reduce])

  const text = reduce ? words[0] : words[wordIndex].slice(0, length)

  return (
    <span className="inline-flex items-baseline whitespace-pre">
      {text}
      {!reduce && (
        <span aria-hidden className="ml-[2px] inline-block h-[0.9em] w-[2px] translate-y-[1px] animate-pulse bg-current opacity-80" />
      )}
    </span>
  )
}
