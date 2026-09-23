import { createPublicClient, http } from 'viem'
import { botChainTestnet } from './src/onchain/chain.ts'
import { AGENT_ECO_ABI, AGENT_ECO_ADDRESS } from './src/onchain/abi.ts'

const client = createPublicClient({ chain: botChainTestnet, transport: http('https://rpc.bohr.life') })

const seller = '0xa8D88e098bF7a5b7a940f6e6D3cD2EbcB19d14c1'

console.log('--- with seller filter ---')
try {
  const events1 = await client.getContractEvents({
    address: AGENT_ECO_ADDRESS,
    abi: AGENT_ECO_ABI,
    eventName: 'EscrowCreated',
    args: { seller },
    fromBlock: 24360250n,
    toBlock: 24363300n,
  })
  console.log('found:', events1.length, events1.map((e) => e.args))
} catch (err) {
  console.error('ERROR:', err)
}

console.log('\n--- without seller filter (all events in range) ---')
try {
  const events2 = await client.getContractEvents({
    address: AGENT_ECO_ADDRESS,
    abi: AGENT_ECO_ABI,
    eventName: 'EscrowCreated',
    fromBlock: 24360250n,
    toBlock: 24363300n,
  })
  console.log('found:', events2.length, events2.map((e) => e.args))
} catch (err) {
  console.error('ERROR:', err)
}
