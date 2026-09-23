# AgentEco Backend — Keeper Service

A small, standalone Node/TypeScript worker that keeps the deployed
`AgentEco.sol` contract moving forward on two permissionless functions
that no human would otherwise remember to call.

## 1. What this does

Every ~30 seconds (configurable), the keeper:

1. Scans for new `EscrowCreated` events since the last block it checked (checkpointed locally, so it never rescans the whole chain).
2. For every escrow it knows about, reads `getEscrowStatus(escrowId)`.
3. If the escrow is `EXECUTING`, checks `isExecutionTimedOut(escrowId)`. If true, submits `claimExecutionTimeout(escrowId)`.
4. If the escrow is `DELIVERED`, checks `isReviewExpired(escrowId)`. If true, submits `finalizeAfterReviewWindow(escrowId)`.

Both of those contract functions are **permissionless** — anyone can call
them once the relevant deadline has passed. This service exists so that
happens reliably even if the buyer or seller never comes back to click a
button in the UI.

## 2. What this does NOT do

- Does **not** manage user wallets or hold user funds.
- Does **not** call `createEscrow`, `fundEscrow`, `startExecution`, `markDelivered`, or `acceptAndSettle` — those are user-initiated actions that only the frontend (with the user's own connected wallet) should ever trigger.
- Does **not** implement, store, or calculate reputation. `completedJobs`, `failedJobs`, `totalVolumeSettled`, and `successRateBps` are computed and stored entirely inside `AgentEco.sol` (`_recordSuccess` / `_recordFailure`, read via `getReputation`). When a keeper-triggered timeout causes a seller failure, **the contract itself** updates that seller's reputation — this service never touches it directly.
- Does **not** run a database. The only local state is a tiny JSON checkpoint file (see below).
- Does **not** expose an HTTP/REST API. It's a background worker, not a server.
- Does **not** modify, redeploy, or otherwise touch `AgentEco.sol`. The deployed contract is the source of truth for everything economic.

## 3. Installation

```bash
cd backend
npm install
```

## 4. Environment variables

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `RPC_URL` | yes | BOT Chain Testnet RPC endpoint. Default: `https://rpc.bohr.life` |
| `AGENT_ECO_ADDRESS` | yes | Deployed `AgentEco.sol` address. Currently `0x0a68fe20feA2780cF1AC32862504021D96a8E50C` |
| `KEEPER_PRIVATE_KEY` | yes | Private key of the keeper's own dedicated wallet (see below). **Never** the user's wallet. |
| `KEEPER_INTERVAL_MS` | no (default `30000`) | How often to run a check cycle, in milliseconds. |
| `DEPLOYMENT_BLOCK` | no | Block number to backfill `EscrowCreated` events from on the very first run (no checkpoint yet). If unset, the keeper only watches events going forward from whatever block it first starts at — it will **not** find escrows created before that point. |
| `DRY_RUN` | no (default `false`) | When `true`, the keeper scans and logs what it *would* call, but never sends a transaction. |

## 5. How to create a keeper wallet

The keeper needs its own EVM keypair — **not** any real user's wallet, and
not the arbiter's wallet either. Generate a fresh one, e.g. with viem
itself:

```bash
node -e "const {generatePrivateKey, privateKeyToAccount} = require('viem/accounts'); const pk = generatePrivateKey(); console.log('Private key:', pk); console.log('Address:', privateKeyToAccount(pk).address);"
```

(You can also generate one in MetaMask by creating a new account, then exporting its private key.)

Put the private key in `.env` as `KEEPER_PRIVATE_KEY`. **Do not commit
`.env`** — it's already gitignored.

## 6. Funding the keeper wallet

The keeper only ever pays **gas** — it never spends USDT or any escrowed
funds (those move directly between buyer, seller, and the contract; the
keeper is not a party to any of it). It just needs a small amount of BOT
Chain Testnet's native gas token in its address to submit
`claimExecutionTimeout` / `finalizeAfterReviewWindow` transactions.

Send a small amount of testnet native token to the keeper's address
(printed at startup, and derivable from `KEEPER_PRIVATE_KEY`) using
whatever BOT Chain testnet faucet is available. A few cents' worth of gas
will cover a very large number of these calls.

## 7. Running in development

```bash
npm run dev
```

Runs continuously with file-watching (auto-restarts on code changes).
Stop with `Ctrl+C` — the keeper finishes its current cycle before
exiting, it doesn't cut a transaction off mid-flight.

For a one-off run without watching:

```bash
npm start
```

## 8. Dry-run mode

Set `DRY_RUN=true` in `.env` (this is the default in the committed
`.env` template until you've funded a real keeper wallet). With it on,
every cycle still discovers events and evaluates eligibility exactly as
normal, but instead of sending a transaction it logs:

```
[KEEPER] [DRY RUN] Would submit claimExecutionTimeout(#12) — no transaction sent.
```

Use this to verify the keeper is wired up correctly (RPC reachable,
correct chain ID, ABI decoding working, escrows being discovered) before
letting it actually submit transactions.

## 9. How the keeper discovers escrows

The contract has no `getAllEscrows()` / `getMyEscrows()` — the frontend's
ABI doesn't expose one, and this backend does not invent one. Instead,
the keeper listens for the contract's `EscrowCreated` event and tracks
every `escrowId` it has ever seen in a small local checkpoint file,
`.keeper-state.json` (gitignored, created automatically next to
`package.json` on first run):

```json
{
  "lastProcessedBlock": "24276059",
  "knownEscrowIds": ["1", "2", "3"]
}
```

Each cycle, it queries `eth_getLogs` only for the block range between
`lastProcessedBlock + 1` and the current block (chunked into 5000-block
windows per call, so it never asks an RPC for an unbounded range), adds
any newly discovered escrow IDs to its known set, and persists the
updated checkpoint — so a restart resumes exactly where it left off
instead of rescanning from genesis.

## 10. How timeout / finalization works

For every known escrow, on every cycle:

- If `getEscrowStatus` returns `EXECUTING` (`2`) and `isExecutionTimedOut` returns `true` → simulate then submit `claimExecutionTimeout(escrowId)`.
- If `getEscrowStatus` returns `DELIVERED` (`3`) and `isReviewExpired` returns `true` → simulate then submit `finalizeAfterReviewWindow(escrowId)`.
- Otherwise, nothing happens for that escrow this cycle.

Before sending, the keeper calls `publicClient.simulateContract(...)`
(an `eth_call` dry-run) to catch a stale/already-resolved escrow before
spending real gas on a transaction that would revert. After sending, it
**awaits the transaction receipt** before moving on to the next escrow —
escrows are processed one at a time, sequentially, and cycles never
overlap (the main loop is a plain sequential `while` loop with an
`await sleep(...)` between iterations, not a `setInterval`). That
combination is what guarantees the same escrow is never submitted twice
while a previous transaction for it is still pending.

## 11. Security notes

- `KEEPER_PRIVATE_KEY` is read only from `.env` / the process environment. It is never hardcoded, never logged (only the derived public **address** is logged at startup), and must never be prefixed `NEXT_PUBLIC_` or placed anywhere the frontend can read it.
- The keeper wallet has no special authority in the contract — `claimExecutionTimeout` and `finalizeAfterReviewWindow` are permissionless by design, callable by any address once the deadline has passed. Losing this key only risks the small amount of gas token funding it, nothing else.
- Startup fails loudly (and refuses to run) if `RPC_URL`, `AGENT_ECO_ADDRESS`, or `KEEPER_PRIVATE_KEY` are missing or malformed, or if the RPC's reported chain ID isn't `968`.
- All contract reads/writes go through the same trimmed ABI in `src/abi/agentEcoAbi.ts`, which only includes the five functions and one event this service actually uses — it cannot accidentally call `createEscrow`, `fundEscrow`, etc. even by mistake, because those aren't in its ABI at all.
- A failed or reverted transaction, or an RPC error mid-cycle, is logged and the cycle moves on — it does not crash the process.

> **Never put `KEEPER_PRIVATE_KEY` in the frontend or any `NEXT_PUBLIC_*` environment variable.**

## 12. Deploying this later

This is currently a single long-running Node process (`npm start`) with
no HTTP surface — deploy it anywhere that can run a persistent Node
process and give it outbound HTTPS access to `RPC_URL` (a small VM,
a container on any host, a "worker"/"background service" tier on a PaaS,
etc.). It needs:

- `KEEPER_PRIVATE_KEY` set as a secret (not committed), belonging to a wallet funded with a small amount of BOT Chain testnet gas token.
- The other env vars from `.env.example`.
- Nothing else — no build step, no database, no exposed port.

If usage ever grows enough to need horizontal scaling, the important
constraint to preserve is that only **one** keeper instance runs against
a given `.keeper-state.json` / checkpoint at a time, since two instances
racing to `claimExecutionTimeout` the same escrow would just waste gas
on the loser's reverted transaction (harmless, but wasteful) — not a
correctness problem, since the contract itself is the final arbiter of
what's actually eligible.
