import { defineChain, isAddress, type Address } from 'viem'

/**
 * The one place the Node side (backend API, host, keeper, and the standalone
 * buyer/seller agents) learns which network it's on and which AgentEco
 * deployment to talk to. Mirrors frontend/lib/web3/network.ts.
 *
 * Pick the network with NETWORK=testnet|mainnet (default testnet). Chain
 * params come from the presets below; the deployment itself — contract,
 * USDT, deploy block — comes from env. Testnet has working defaults so local
 * dev needs no extra env. Mainnet knows its USDT but not the AgentEco
 * contract, so a mainnet process without AGENT_ECO_ADDRESS refuses to start
 * instead of quietly using testnet values.
 */

type NetworkName = 'testnet' | 'mainnet'

interface NetworkPreset {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  testnet: boolean
  /** The chain's USDT token — a property of the chain, not of an AgentEco deployment. */
  usdtAddress: Address
  /** AgentEco deployment defaults — only testnet has one. */
  deployment?: { agentEcoAddress: Address; deploymentBlock: bigint }
}

// BOT Chain parameters, each verified against its RPC's eth_chainId.
const PRESETS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    chainId: 968,
    name: 'BOT Chain Testnet',
    rpcUrl: 'https://rpc.bohr.life',
    explorerUrl: 'https://scan.bohr.life',
    testnet: true,
    usdtAddress: '0x75edC9335175Fc0552D51D48439F229c10420fe3',
    deployment: {
      agentEcoAddress: '0x0a68fe20feA2780cF1AC32862504021D96a8E50C',
      deploymentBlock: BigInt(24270640),
    },
  },
  mainnet: {
    chainId: 677,
    name: 'BOT Chain Mainnet',
    rpcUrl: 'https://rpc.botchain.ai',
    explorerUrl: 'https://scan.botchain.ai',
    testnet: false,
    // Tether USD, 6 decimals — verified on-chain.
    usdtAddress: '0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C',
  },
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function readNetwork(): NetworkName {
  const raw = (env('NETWORK') ?? 'testnet').toLowerCase()
  if (raw !== 'testnet' && raw !== 'mainnet') {
    throw new Error(`NETWORK must be "testnet" or "mainnet", got: ${raw}`)
  }
  return raw
}

function readAddress(name: string, fallback: Address | undefined): Address {
  const value = env(name) ?? fallback
  if (!value) throw new Error(`${name} must be set when NETWORK=${NETWORK} — there is no default deployment for it.`)
  if (!isAddress(value)) throw new Error(`${name} is not a valid EVM address: ${value}`)
  return value
}

function readBlock(name: string, fallback: bigint | undefined): bigint | null {
  const value = env(name)
  if (!value) return fallback ?? null
  try {
    return BigInt(value)
  } catch {
    throw new Error(`${name} must be an integer block number, got: ${value}`)
  }
}

export const NETWORK: NetworkName = readNetwork()
const preset = PRESETS[NETWORK]

/** Overridable (e.g. a private RPC provider); defaults to the network's public RPC. */
export const RPC_URL = env('RPC_URL') ?? preset.rpcUrl
export const EXPLORER_URL = preset.explorerUrl
export const AGENT_ECO_ADDRESS = readAddress('AGENT_ECO_ADDRESS', preset.deployment?.agentEcoAddress)
export const USDT_ADDRESS = readAddress('USDT_ADDRESS', preset.usdtAddress)
/** Block AgentEco.sol was deployed at — log scans start here. Null = unknown (scan from "now"). */
export const DEPLOYMENT_BLOCK = readBlock('DEPLOYMENT_BLOCK', preset.deployment?.deploymentBlock)

export const botChain = defineChain({
  id: preset.chainId,
  name: preset.name,
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'BOT Chain Explorer', url: preset.explorerUrl } },
  testnet: preset.testnet,
})

/**
 * Fails fast when RPC_URL points at a different chain than NETWORK — e.g. a
 * mainnet process accidentally given the testnet RPC.
 */
export async function assertRpcMatchesNetwork(getChainId: () => Promise<number>): Promise<void> {
  const actual = await getChainId()
  if (actual !== botChain.id) {
    throw new Error(`RPC_URL reports chain id ${actual}, but NETWORK=${NETWORK} expects ${botChain.id} (${botChain.name}).`)
  }
}
