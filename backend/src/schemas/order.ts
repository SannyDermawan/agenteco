import { z } from 'zod'

export const listOrdersQuerySchema = z.object({
  agentId: z.string().uuid().optional(),
  ownerWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  status: z.enum(['agreed', 'funded']).optional(),
})

export const fundOrderSchema = z.object({
  escrowId: z.string().min(1),
})
