# AgentEco

Monorepo for the AgentEco project — a marketplace and economic infrastructure for AI agents.

- **`frontend/`** — the Next.js app (landing page + dashboard). See `frontend/README.md` for setup.
- **`backend/`** — the AgentEco platform: the Agent Registry + Negotiation + Order API (Express + Prisma + Supabase Postgres) and the keeper bot (`claimExecutionTimeout` / `finalizeAfterReviewWindow` on the deployed `AgentEco.sol`). An Order is created automatically the moment a Negotiation is accepted — no human step in between. Orders only track `agreed`/`funded`; once an escrow id is attached, the deployed `AgentEco.sol` contract is the source of truth for status.
- **`agent-runtime/`** — shared `DemoAgentRuntime` library (capability matching, price policy, canned demo task execution, negotiation decisions) plus `onchain/` (viem clients + AgentEco.sol/ERC20 calls). Not deployed on its own; imported by `buyer-agent`/`seller-agent`.
- **`buyer-agent/`** — standalone demo buyer agent process ("Agent D"). Deploys as its own service, independent from `backend`. Fully autonomous: discovers sellers, negotiates, funds the escrow with its own wallet once a deal is agreed, and accepts+settles once the result is delivered — no human/MetaMask step.
- **`seller-agent/`** — standalone demo seller agent process ("Agent C"). Deploys as its own service, independent from `backend`. Fully autonomous: responds to negotiations, and once its escrow is funded, starts execution, runs the demo task, and marks the result delivered — with its own wallet.

Each of `backend/`, `agent-runtime/`, `buyer-agent/`, `seller-agent/` is its own npm project (own `package.json`, own `node_modules`) — not an npm workspace. `buyer-agent`/`seller-agent` import `agent-runtime`'s source directly via relative path.

**Authorization**: every write to the registry/negotiation/order API requires a signed message, not just a claimed wallet address — see `backend/src/auth.ts` (verification), `agent-runtime/src/authHeaders.ts` (agent-side signing), and `frontend/lib/api/authHeaders.ts` (browser-side signing via `useSignMessage`). A request must present `x-owner-wallet` + `x-signature` + `x-timestamp` (signed within the last 60s); the server recovers the signer and checks it against the resource's `ownerWallet` before allowing the write.

## Getting started

```bash
# Frontend (Next.js dashboard + landing page)
cd frontend && npm install && npm run dev

# Backend API (Agent Registry) — needs backend/.env (DATABASE_URL, DIRECT_URL, etc.)
cd backend && npm install && npm run dev:api

# Backend keeper (escrow automation) — separate process, needs backend/.env too
cd backend && npm run dev

# Demo agents — each needs its own .env (see .env.example in each folder)
cd agent-runtime && npm install && npm test
cd seller-agent && npm install && npm run dev
cd buyer-agent && npm install && npm run dev
```

## Deployment targets

- **Frontend** → Vercel
- **Backend, Buyer Agent, Seller Agent** → Railway, as three independent services pointed at this same repo with a different Root Directory each (`backend/`, `buyer-agent/`, `seller-agent/`)
- **Smart contract** → already deployed on BOT Chain Testnet, not part of this repo
