import { isAddress, isHex, type Address, type Hex } from 'viem'

export type KeeperConfig = {
  rpcUrl: string
  agentEcoAddress: Address
  keeperPrivateKey: Hex
  keeperIntervalMs: number
  dryRun: boolean
  deploymentBlock: bigint | null
}

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw || raw.trim() === '') return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number, got: ${raw}`)
  }
  return parsed
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (!raw || raw.trim() === '') return fallback
  return raw.trim().toLowerCase() === 'true'
}

function optionalBigInt(name: string): bigint | null {
  const raw = process.env[name]
  if (!raw || raw.trim() === '') return null
  try {
    return BigInt(raw.trim())
  } catch {
    throw new Error(`Environment variable ${name} must be a valid integer block number, got: ${raw}`)
  }
}

/**
 * Loads and validates all keeper configuration from process.env. Throws
 * a descriptive error on the first problem found — the caller (index.ts)
 * is expected to let this crash the process at startup rather than run
 * with partial/invalid config.
 */
export function loadConfig(): KeeperConfig {
  const rpcUrl = required('RPC_URL')

  const agentEcoAddressRaw = required('AGENT_ECO_ADDRESS')
  if (!isAddress(agentEcoAddressRaw)) {
    throw new Error(`AGENT_ECO_ADDRESS is not a valid EVM address: ${agentEcoAddressRaw}`)
  }

  const keeperPrivateKeyRaw = required('KEEPER_PRIVATE_KEY')
  const normalizedKey = keeperPrivateKeyRaw.startsWith('0x') ? keeperPrivateKeyRaw : `0x${keeperPrivateKeyRaw}`
  if (!isHex(normalizedKey) || normalizedKey.length !== 66) {
    throw new Error('KEEPER_PRIVATE_KEY must be a 32-byte hex private key (0x followed by 64 hex characters).')
  }

  return {
    rpcUrl,
    agentEcoAddress: agentEcoAddressRaw as Address,
    keeperPrivateKey: normalizedKey as Hex,
    keeperIntervalMs: optionalNumber('KEEPER_INTERVAL_MS', 30_000),
    dryRun: optionalBoolean('DRY_RUN', false),
    deploymentBlock: optionalBigInt('DEPLOYMENT_BLOCK'),
  }
}
