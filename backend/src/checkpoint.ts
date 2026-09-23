import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Minimal local checkpoint so the keeper doesn't rescan the whole chain
 * every cycle. Deliberately just a JSON file next to the project root —
 * no database for this MVP, per the brief.
 */
const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_FILE = join(__dirname, '..', '.keeper-state.json')

type PersistedState = {
  lastProcessedBlock: string | null
  knownEscrowIds: string[]
}

export type KeeperState = {
  lastProcessedBlock: bigint | null
  knownEscrowIds: bigint[]
}

export function loadState(): KeeperState {
  if (!existsSync(STATE_FILE)) {
    return { lastProcessedBlock: null, knownEscrowIds: [] }
  }
  try {
    const raw = readFileSync(STATE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as PersistedState
    return {
      lastProcessedBlock: parsed.lastProcessedBlock ? BigInt(parsed.lastProcessedBlock) : null,
      knownEscrowIds: (parsed.knownEscrowIds ?? []).map((id) => BigInt(id)),
    }
  } catch (error) {
    console.error('[KEEPER] Failed to read checkpoint state, starting fresh.', error)
    return { lastProcessedBlock: null, knownEscrowIds: [] }
  }
}

export function saveState(state: KeeperState & { lastProcessedBlock: bigint }): void {
  const serializable: PersistedState = {
    lastProcessedBlock: state.lastProcessedBlock.toString(),
    knownEscrowIds: state.knownEscrowIds.map((id) => id.toString()),
  }
  writeFileSync(STATE_FILE, JSON.stringify(serializable, null, 2), 'utf-8')
}
