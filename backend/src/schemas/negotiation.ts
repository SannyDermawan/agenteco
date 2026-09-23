import { z } from 'zod'

const UUID = z.string().uuid()

export const createNegotiationSchema = z.object({
  buyerAgentId: UUID,
  sellerAgentId: UUID,
  capability: z.string().min(1),
  price: z.number().nonnegative(),
})

export const negotiationMessageSchema = z.object({
  side: z.enum(['buyer', 'seller']),
  action: z.enum(['counter', 'accept', 'reject']),
  price: z.number().nonnegative().optional(),
})

export const listNegotiationsQuerySchema = z.object({
  agentId: UUID.optional(),
  status: z.enum(['open', 'accepted', 'rejected']).optional(),
})
