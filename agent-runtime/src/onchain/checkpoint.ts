import { existsSync, readFileSync, writeFileSync } from 'node:fs'

/**
 * Same minimal local-JSON-checkpoint pattern as backend/src/checkpoint.ts
 * (the keeper), generalized so each agent process can point it at its own
 * state file — agent-runtime is imported via relative path, not installed,
 * so a hardcoded path here would resolve inside agent-runtime's own folder
 * and collide between buyer-agent and seller-agent.
 */
type PersistedState = {
  lastProcessedBlock: string | null
  knownEscrowIds: string[]
}

export type ScanState = {
  lastProcessedBlock: bigint | null
  knownEscrowIds: bigint[]
}

export function loadScanState(stateFilePath: string): ScanState {
  if (!existsSync(stateFilePath)) {
    return { lastProcessedBlock: null, knownEscrowIds: [] }
  }
  try {
    const raw = readFileSync(stateFilePath, 'utf-8')
    const parsed = JSON.parse(raw) as PersistedState
    return {
      lastProcessedBlock: parsed.lastProcessedBlock ? BigInt(parsed.lastProcessedBlock) : null,
      knownEscrowIds: (parsed.knownEscrowIds ?? []).map((id) => BigInt(id)),
    }
  } catch (error) {
    console.error('Failed to read checkpoint state, starting fresh.', error)
    return { lastProcessedBlock: null, knownEscrowIds: [] }
  }
}

export function saveScanState(stateFilePath: string, state: ScanState & { lastProcessedBlock: bigint }): void {
  const serializable: PersistedState = {
    lastProcessedBlock: state.lastProcessedBlock.toString(),
    knownEscrowIds: state.knownEscrowIds.map((id) => id.toString()),
  }
  writeFileSync(stateFilePath, JSON.stringify(serializable, null, 2), 'utf-8')
}
