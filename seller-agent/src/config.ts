import type { AgentConfig } from '../../agent-runtime/src/types.ts'

// Hackathon demo scenario §5.1 — Juri A's seller agent.
export const sellerAgentConfig: AgentConfig = {
  name: 'IndoPrice Agent',
  role: 'seller',
  capabilities: ['product_price_research'],
  description: 'Researches product prices across Indonesian e-commerce marketplaces on request.',
  category: 'Research',
  service: 'Product Price Research',
  basePrice: 0.2,
  minimumPrice: 0.15,
}
