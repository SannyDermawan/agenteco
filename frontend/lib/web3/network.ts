import { isAddress, type Address } from 'viem'

/**
 * Which network the app runs on and which AgentEco deployment it talks to.
 * Mirrors agent-runtime/src/network.ts (the backend side) — keep in sync.
 *
 * Pick the network with NEXT_PUBLIC_NETWORK=testnet|mainnet (default testnet).
 * Chain params come from the presets below; the deployment — contract, USDT,
 * deploy block — comes from env. Testnet has working defaults; mainnet knows
 * its USDT but not the AgentEco contract, so a mainnet build without it fails
 * loudly instead of silently pointing users at testnet contracts.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so each must be read with a
 * literal `process.env.NEXT_PUBLIC_…` — and changing one needs a redeploy.
 */

type NetworkName = 'testnet' | 'mainnet'

interface NetworkPreset {
  chainId: number
  name: string
  /** Short label for the top bar badge. */
  label: string
  rpcUrl: string
  explorerUrl: string
  testnet: boolean
  /** The chain's USDT token — a property of the chain, not of an AgentEco deployment. */
  usdtAddress: Address
  deployment?: { agentEcoAddress: Address; deployBlock: bigint }
}

// BOT Chain parameters, each verified against its RPC's eth_chainId.
const PRESETS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    chainId: 968,
    name: 'BOT Chain Testnet',
    label: 'Testnet',
    rpcUrl: 'https://rpc.bohr.life',
    explorerUrl: 'https://scan.bohr.life',
    testnet: true,
    usdtAddress: '0x75edC9335175Fc0552D51D48439F229c10420fe3',
    deployment: {
      agentEcoAddress: '0x0a68fe20feA2780cF1AC32862504021D96a8E50C',
      deployBlock: BigInt(24270640),
    },
  },
  mainnet: {
    chainId: 677,
    name: 'BOT Chain Mainnet',
    label: 'Mainnet',
    rpcUrl: 'https://rpc.botchain.ai',
    explorerUrl: 'https://scan.botchain.ai',
    testnet: false,
    // Tether USD, 6 decimals — verified on-chain.
    usdtAddress: '0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C',
  },
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function readNetwork(raw: string | undefined): NetworkName {
  const value = (clean(raw) ?? 'testnet').toLowerCase()
  if (value !== 'testnet' && value !== 'mainnet') {
    throw new Error(`NEXT_PUBLIC_NETWORK must be "testnet" or "mainnet", got: ${value}`)
  }
  return value
}

export const NETWORK: NetworkName = readNetwork(process.env.NEXT_PUBLIC_NETWORK)
const preset = PRESETS[NETWORK]

function readAddress(name: string, raw: string | undefined, fallback: Address | undefined): Address {
  const value = clean(raw) ?? fallback
  if (!value) throw new Error(`${name} must be set when NEXT_PUBLIC_NETWORK=${NETWORK} — there is no default deployment for it.`)
  if (!isAddress(value)) throw new Error(`${name} is not a valid EVM address: ${value}`)
  return value
}

function readBlock(raw: string | undefined, fallback: bigint | undefined): bigint {
  const value = clean(raw)
  if (!value) {
    if (fallback === undefined) throw new Error(`NEXT_PUBLIC_DEPLOY_BLOCK must be set when NEXT_PUBLIC_NETWORK=${NETWORK}.`)
    return fallback
  }
  try {
    return BigInt(value)
  } catch {
    throw new Error(`NEXT_PUBLIC_DEPLOY_BLOCK must be an integer block number, got: ${value}`)
  }
}

export const CHAIN_ID = preset.chainId
export const CHAIN_NAME = preset.name
export const NETWORK_LABEL = preset.label
export const IS_TESTNET = preset.testnet
export const RPC_URL = clean(process.env.NEXT_PUBLIC_RPC_URL) ?? preset.rpcUrl
export const EXPLORER_URL = preset.explorerUrl

export const AGENT_ECO_ADDRESS = readAddress(
  'NEXT_PUBLIC_AGENT_ECO_ADDRESS',
  process.env.NEXT_PUBLIC_AGENT_ECO_ADDRESS,
  preset.deployment?.agentEcoAddress
)
export const USDT_ADDRESS = readAddress(
  'NEXT_PUBLIC_USDT_ADDRESS',
  process.env.NEXT_PUBLIC_USDT_ADDRESS,
  preset.usdtAddress
)
/** Block AgentEco.sol was deployed at — every event-log scan starts here. */
export const DEPLOY_BLOCK = readBlock(process.env.NEXT_PUBLIC_DEPLOY_BLOCK, preset.deployment?.deployBlock)

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`
}
