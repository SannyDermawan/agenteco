'use client'
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

type UnavailableModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  context?: string
}

export function UnavailableModal({
  open,
  onClose,
  title = 'Feature not available yet',
  description = 'This feature is not available in the current MVP.',
  context,
}: UnavailableModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocusedRef.current?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#11141B] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#8B8D96] transition-colors hover:bg-white/[0.06] hover:text-[#F5F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FEF]"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            {context && (
              <div className="mb-3 inline-flex items-center gap-2 text-[10.5px] font-medium tracking-[0.14em] text-[#5B5FEF]">
                <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#5B5FEF] shadow-[0_0_8px_#5B5FEF]" />
                {context.toUpperCase()}
              </div>
            )}

            <h2 id={titleId} className="pr-8 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#F5F5F7]">
              {title}
            </h2>
            <p id={descriptionId} className="mt-2 text-[13.5px] leading-relaxed text-[#8B8D96]">
              {description}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
