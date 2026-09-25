// Network + AgentEco deployment config, shared with agent-runtime so the API,
// host, and keeper can never disagree about which chain/contract they're on.
export {
  NETWORK,
  RPC_URL,
  EXPLORER_URL,
  AGENT_ECO_ADDRESS,
  USDT_ADDRESS,
  DEPLOYMENT_BLOCK,
  botChain,
  assertRpcMatchesNetwork,
} from '../../agent-runtime/src/network.ts'
