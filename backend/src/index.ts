import { createClients } from './clients.ts'
import { loadConfig } from './config.ts'
import { runKeeperCycle } from './keeper/escrowKeeper.ts'
import { log, logError } from './log.ts'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  const config = loadConfig()
  const { account, publicClient, walletClient } = createClients(config)

  log('Started')
  log(`Wallet: ${account.address}`)
  log('Network: BOT Chain Testnet')
  log(`Contract: ${config.agentEcoAddress}`)
  log(`Polling interval: ${config.keeperIntervalMs}ms`)
  log(`Dry run: ${config.dryRun}`)

  const chainId = await publicClient.getChainId()
  if (chainId !== 968) {
    throw new Error(
      `Connected RPC reports chain id ${chainId}, expected 968 (BOT Chain Testnet). Check RPC_URL in .env.`
    )
  }
  log(`Chain ID verified: ${chainId}`)

  const clients = { account, publicClient, walletClient }

  let running = true
  const shutdown = (signal: string) => {
    log(`Received ${signal}, finishing current cycle then shutting down…`)
    running = false
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Sequential while-loop (not setInterval) so a slow cycle can never
  // overlap with the next one.
  while (running) {
    try {
      await runKeeperCycle(clients, config)
    } catch (error) {
      logError('Keeper cycle failed', error)
    }
    if (running) await sleep(config.keeperIntervalMs)
  }

  log('Stopped.')
}

main().catch((error) => {
  logError('Fatal startup error', error)
  process.exit(1)
})
