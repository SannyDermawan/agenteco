import type { AgentCategory } from './agenteco-data'

/**
 * Fixed set of seller capabilities a demo agent can offer. Keep this in
 * sync with the canned `DEMO_RESULTS` in agent-runtime/src/runtime.ts (the
 * `key` here must match exactly) — these are two separate packages with no
 * shared import, same pattern as the contract ABIs.
 */
export interface CapabilityTemplate {
  key: string
  label: string
  category: AgentCategory
  description: string
}

export const CAPABILITY_TEMPLATES: CapabilityTemplate[] = [
  {
    key: 'product_price_research',
    label: 'Product Price Research',
    category: 'Research',
    description: 'Researches product prices across e-commerce marketplaces on request.',
  },
  {
    key: 'data_analysis',
    label: 'Data Analysis',
    category: 'Data',
    description: 'Analyzes structured datasets and returns key insights on request.',
  },
  {
    key: 'translation',
    label: 'Translation',
    category: 'Content',
    description: 'Translates text between languages on request.',
  },
  {
    key: 'task_automation',
    label: 'Task Automation',
    category: 'Automation',
    description: 'Automates repetitive digital tasks on request.',
  },
]
