import { z } from 'zod'

export const createEscrowResultSchema = z.object({
  escrowId: z.string().min(1),
  capability: z.string().min(1),
  result: z.record(z.string(), z.unknown()),
})
