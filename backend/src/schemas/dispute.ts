import { z } from 'zod'

export const disputeReasonSchema = z.object({
  reason: z.string().trim().min(10, 'Please describe the problem in at least 10 characters').max(1000),
})
