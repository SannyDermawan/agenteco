'use client'
import { motion } from 'framer-motion'
import { CheckIcon } from './icons'
import { explorerTxUrl, type EscrowTxHashes } from '@/lib/web3/escrowEvents'

const STEPS = ['CREATED', 'FUNDED', 'EXECUTING', 'DELIVERED', 'SETTLED'] as const

function formatTimestamp(unixSeconds: bigint) {
  if (unixSeconds === BigInt(0)) return null
  return new Date(Number(unixSeconds) * 1000).toLocaleString()
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="mt-0.5 inline-block font-mono text-[11px] font-normal text-[#5B5FEF] hover:underline"
    >
      tx {hash.slice(0, 10)}…{hash.slice(-6)} ↗
    </a>
  )
}

type Timestamps = {
  createdAt: bigint
  fundedAt: bigint
  executingAt: bigint
  deliveredAt: bigint
  settledAt: bigint
}

/** status enum: 0 CREATED, 1 FUNDED, 2 EXECUTING, 3 DELIVERED, 4 DISPUTED, 5 SETTLED, 6 REFUNDED */
export function OnChainTimeline({
  status,
  timestamps,
  txHashes,
}: {
  status: number
  timestamps: Timestamps
  txHashes?: EscrowTxHashes
}) {
  const stepTimestamps = [
    timestamps.createdAt,
    timestamps.fundedAt,
    timestamps.executingAt,
    timestamps.deliveredAt,
    timestamps.settledAt,
  ]
  const terminal = status === 4 || status === 5 || status === 6
  const currentIndex = status <= 3 ? status : -1

  return (
    <div className="flex flex-col">
      {STEPS.map((step, i) => {
        const reached = stepTimestamps[i] > BigInt(0)
        const done = reached && (terminal || i < currentIndex)
        const current = !terminal && i === currentIndex
        const ts = formatTimestamp(stepTimestamps[i])
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
              {i < STEPS.length - 1 && (
                <span className={`w-px flex-1 ${done ? 'bg-[#22A06B]/40' : 'bg-white/10'}`} style={{ minHeight: 24 }} />
              )}
            </div>
            <div
              className={`pb-6 text-[13.5px] ${done || current ? 'text-[#F5F5F7]' : 'text-[#54565F]'} ${
                current ? 'font-semibold' : 'font-medium'
              }`}
            >
              {step}
              {current && <span className="ml-2 text-[11px] font-normal text-[#5B5FEF]">In progress</span>}
              {ts && <div className="mt-0.5 text-[11px] font-normal text-[#8B8D96]">{ts}</div>}
              {txHashes?.steps[i] && (
                <div>
                  <TxLink hash={txHashes.steps[i]!} />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
      {status === 6 && txHashes?.refund && (
        <div className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#8B8D96]/40 bg-[#8B8D96]/10 text-[11px] text-[#8B8D96]">
            ↩
          </span>
          <div className="text-[13.5px] font-medium text-[#F5F5F7]">
            REFUNDED
            <div>
              <TxLink hash={txHashes.refund} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
