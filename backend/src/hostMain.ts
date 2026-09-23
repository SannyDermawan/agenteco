import { log, logError } from './log.ts'
import { runHostCycleOnce } from './host/buyerTaskHost.ts'
import { runSellerHostCycleOnce } from './host/sellerTaskHost.ts'

const INTERVAL_MS = Number(process.env.HOST_INTERVAL_MS ?? 5000)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Multi-tenant runtime for hosted buyer tasks ("make an agent buy for me")
 * and hosted seller agents —
 * the platform-run counterpart to the standalone buyer-agent/seller-agent
 * processes, which self-custody their own keys instead. Requires the API
 * server (src/server.ts) to already be running on the same host, since it
 * talks to the registry over HTTP like any other agent.
 */
async function main(): Promise<void> {
  log('Host runtime started', 'HOST')
  log(`Polling interval: ${INTERVAL_MS}ms`, 'HOST')

  let running = true
  const shutdown = (signal: string) => {
    log(`Received ${signal}, finishing current cycle then shutting down…`, 'HOST')
    running = false
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  while (running) {
    try {
      await runHostCycleOnce()
    } catch (error) {
      logError('Host cycle failed', error, 'HOST')
    }
    try {
      await runSellerHostCycleOnce()
    } catch (error) {
      logError('Seller host cycle failed', error, 'HOST')
    }
    if (running) await sleep(INTERVAL_MS)
  }

  log('Stopped.', 'HOST')
}

main().catch((error) => {
  logError('Fatal startup error', error, 'HOST')
  process.exit(1)
})
