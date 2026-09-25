import cors from 'cors'
import express from 'express'
import { prisma } from './db.ts'
import { agentsRouter } from './routes/agents.ts'
import { negotiationsRouter } from './routes/negotiations.ts'
import { ordersRouter } from './routes/orders.ts'
import { escrowResultsRouter } from './routes/escrowResults.ts'
import { disputesRouter } from './routes/disputes.ts'
import { log, logError } from './log.ts'

// PORT is what hosting platforms (Railway, Render, …) inject; API_PORT is the local-dev name.
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 4000)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

const app = express()
app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ ok: true, db: 'connected' })
})

app.use('/agents', agentsRouter)
app.use('/negotiations', negotiationsRouter)
app.use('/orders', ordersRouter)
app.use('/escrow-results', escrowResultsRouter)
app.use('/disputes', disputesRouter)

app.listen(PORT, () => {
  log(`AgentEco API listening on http://localhost:${PORT}`, 'API')
  log(`Allowed frontend origin: ${FRONTEND_ORIGIN}`, 'API')
})

process.on('unhandledRejection', (error) => {
  logError('Unhandled rejection', error, 'API')
})
