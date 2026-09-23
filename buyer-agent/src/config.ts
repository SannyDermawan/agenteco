import type { AgentConfig } from '../../agent-runtime/src/types.ts'

// Hackathon demo scenario §5.2 — Juri B's buyer agent, 1 USDT budget.
export const buyerAgentConfig: AgentConfig = {
  name: 'Agent D',
  role: 'buyer',
  capabilities: ['product_price_research'],
  description: 'Demo buyer agent — discovers services and negotiates on your behalf.',
  basePrice: 0.15,
  maxBudget: 1,
}
