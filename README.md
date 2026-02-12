# Smart Contract Coding Test — Summary

Version: v0.1.0 (assignment release)

This project fully implements all mandatory requirements of the coding assignment.

**📚 Documentation**: Doc index → [**docs/README.md**](docs/README.md).  
**📚 For project lead / interviewer**: [docs/Technical_Overview_and_Entry.md](docs/Technical_Overview_and_Entry.md) (tech stack, structure, run and verify, doc index).  
**📚 Design and acceptance**: [docs/P0_P6_Summary.md](docs/P0_P6_Summary.md), [docs/P6_Completion_Assessment.md](docs/P6_Completion_Assessment.md).  
**📚 Local run and MetaMask**: [LOCAL_RUN.md](LOCAL_RUN.md). **📚 Project overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).  
Optional: [docs/archive/](docs/archive/) (walkthrough, demo checklist, assessment mapping) when needed.

- React + TypeScript + ethers v6 frontend on Hardhat local chain (31337)
- One-click deploys USD8/WETH/SimpleLending and exports ABI + addresses
- Frontend supports auto add/switch chain, and persists connection state
- Supports approve→supply and withdraw/borrow/repay as real on-chain transactions
- Refresh strategy: tx confirmed + contract event listeners (Mandatory)
- Optional fail-safe: 3s throttled `provider.on('block')` refresh (not the main logic)

## Repo structure

| Path | Description |
|------|-------------|
| [docs/README.md](docs/README.md) | **Doc index** (by role and purpose) |
| [docs/Technical_Overview_and_Entry.md](docs/Technical_Overview_and_Entry.md) | Tech stack, runbook, doc index |
| [docs/P0_P6_Summary.md](docs/P0_P6_Summary.md) | P0–P6 design, implementation, acceptance |
| [docs/P6_Completion_Assessment.md](docs/P6_Completion_Assessment.md) | P6 completion and polish |
| [learning/](learning/) | Learning and interview materials |
| [slides/](slides/) | Slide decks and exports |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution and code/doc conventions |

## Scope & Non-Goals

This project focuses on:
- smart contract integration
- frontend transaction lifecycle
- reliability and reproducibility

Out of scope:
- mainnet deployment
- oracle integration
- liquidation logic
- production monitoring / alerting

## Engineering notes (why this design)

- Design tradeoffs, non-goals, and intentional choices: see docs in [docs/archive/](docs/archive/) (e.g. ENGINEERING_RATIONALE) when needed.

## Production hardening (optional)

Roadmap and scope boundaries: see `docs/PRODUCTION_GRADE_ROADMAP.md`.
Security communication policy: see `SECURITY.md`.

Deployment headers (recommended): for any real hosting of the frontend, set a baseline Content Security Policy (CSP) and disable framing (e.g., `frame-ancestors 'none'` / `X-Frame-Options: DENY`) to reduce injection and clickjacking risks.

## Enterprise hardening (in-scope, quick spot check)

- Amount safety: strict decimal schema + bigint end-to-end (no number round-trip) — see [frontend/src/utils/amount.ts](frontend/src/utils/amount.ts) and its UI usage in [frontend/src/App.tsx](frontend/src/App.tsx)
- Conservative Max actions: “Max (safe)” uses maxBorrow/maxWithdraw minus 1 wei as rounding headroom — see [frontend/src/App.tsx](frontend/src/App.tsx)
- Approve safety: exact vs infinite toggle + USDT-style fallback approve(0)→approve(amount) — see [frontend/src/App.tsx](frontend/src/App.tsx) and [frontend/src/hooks/useActions.ts](frontend/src/hooks/useActions.ts)
- Pre-wallet transaction summary (intent clarity): before any wallet prompt, the UI presents a concise, deterministic summary of the pending action, including **Action / Token / Spender / Amount**. For Supply and Repay, it also indicates whether an **Exact** or **Infinite** allowance is required and whether the flow includes an approval step — see [frontend/src/App.tsx](frontend/src/App.tsx)
- Address display safety (checksum + full reveal): contract and account addresses are rendered using **EIP-55 checksum** format, with a consistent short form, optional full expansion, and one-click copy. Addresses are sourced exclusively from exported deployment artifacts and are not derived from URL parameters or local overrides — see [frontend/src/App.tsx](frontend/src/App.tsx) and [frontend/src/contracts/deployments.json](frontend/src/contracts/deployments.json)
- Final consistency: confirmations + pending-tx restore + event backfill (queryFilter) — see [frontend/src/state/tx.ts](frontend/src/state/tx.ts), [frontend/src/state/txStore.ts](frontend/src/state/txStore.ts), [frontend/src/hooks/useDashboard.ts](frontend/src/hooks/useDashboard.ts)

Pending txs are timeout-protected; users can re-check status or clear “stuck” local entries to handle dropped/replaced transactions on real RPCs.

Scope boundary: these measures focus on frontend-level safety and correctness. Protocol-level risks (oracle integrity, liquidation design, MEV) are intentionally out of scope.

### Post-state verification (best-effort)

After a transaction is confirmed, the app performs a short post-state check by re-reading relevant on-chain views to verify that the intended state change is observable.

Because RPC reads are eventually consistent, a missing update is **not treated as a failure**.  
Instead, the transaction is marked as **“unverified”**, and the user is prompted to refresh the state manually.

This avoids false negatives while still providing a clear and deterministic user experience under real-world RPC behavior.

Verification checklist:
- All contracts compile and tests pass
- Frontend builds without warnings
- E2E flow completes (approve → supply → borrow → repay → withdraw)

Command (copy/paste): `npm run ci:local && npm run smoke:e2e`

## Scripted E2E smoke (optional)

- Runs: start local node (if needed) → deploy + export → perform a full approve→supply→borrow→repay→withdraw flow using the exported frontend ABIs.
- Command: `npm run smoke:e2e`

Run the same checks as CI:

```bash
# contracts
npm ci
npm run compile
npm test

# frontend
cd frontend
npm ci
npm run lint
npm run build
```

Dependency audit:

```bash
# production deps only (recommended for app security posture)
npm run audit:prod

# full graph (includes dev toolchain like Hardhat)
npm run audit:all
```

## Interviewer quick verify (copy/paste)

### A) One command to verify tests/lint/build

```bash
npm ci
npm run ci:local
```

### B) Run the local demo end-to-end

Terminal 1 (start local chain):

```bash
npx hardhat node
```

Terminal 2 (deploy + seed + export):

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Terminal 3 (start frontend dev server):

```bash
cd frontend
npm ci
npm run dev
```

Optional: seed your own MetaMask address (instead of importing Hardhat Account #0):

```bash
SEED_ADDRESS=0xYourMetaMaskAddress npx hardhat run scripts/deploy.ts --network localhost
```

# Part 1 — Hardhat (Local) + One-click Deploy

## Prerequisites
- Node.js + npm

## 1) Install
```bash
npm ci
```

## 2) Compile
```bash
npx hardhat compile
```

## 3) Start local chain (31337)
```bash
npx hardhat node
```

## Reproduction steps (copy-paste)

### Option A: Use Hardhat Account #0 (quickest)

1. Start local chain:
```bash
npx hardhat node
```

2. Deploy and seed:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Configure MetaMask (for local demo only):
- Add network: RPC `http://127.0.0.1:8545`, chainId `31337`
- Import Hardhat Account #0 private key (from `hardhat node` output)

4. Start frontend (after step 2):
```bash
cd frontend && npm run dev
```

Importing the key is not required by the assignment; it ensures the connected account matches the seeded one so balances are non-zero for approve/supply.

### Option B: Use your own MetaMask address (no key import)

Set before deploy:
```bash
SEED_ADDRESS=0xYourMetaMaskAddress
```

Windows PowerShell:
```powershell
$env:SEED_ADDRESS = "0xYourMetaMaskAddress"
```

Windows cmd:
```bat
set SEED_ADDRESS=0xYourMetaMaskAddress
```

Then run deploy; the script will send USD8/WETH to that address:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

This still satisfies“seed test account”requirement; you only need to provide the target address.

## 4) Deploy + seed + export
In a second terminal:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Outputs:
- `deployments/31337.json`
- `frontend/src/contracts/deployments.json`
- `frontend/src/abis/TestToken.json`
- `frontend/src/abis/SimpleLending.json`

## Stop local node
Stop the local Hardhat node by pressing `Ctrl+C` in the terminal that runs `npx hardhat node`.

## Part 2 — Strict Self-check (pre-submission)

Run these steps and screenshot the key screens (these are the common reviewer checkpoints):

### 1) Network & connection

- First open: click **Connect MetaMask** → auto switches to chainId `31337` (or shows one-click switch)
- Refresh the page → connection restores and shows account + chainId
- Switch to a wrong network → shows **Wrong network** and disables action buttons

### 2) Data display

- USD8/WETH balances display correctly
- Pool info displays: supply/borrow/utilization/rates
- User position displays: supplied/borrowed/healthFactor (colored) + maxBorrow/maxWithdraw

### 3) Transactions & status

- Supply: if allowance is insufficient → does approve first → then supply
- Borrow / Repay / Withdraw all succeed
- Tx state shows `pending/confirmed/failed` with hash and errors (when any)

### 4) Real-time updates (Mandatory + fail-safe)

- After tx confirmed → dashboard updates
- After events fire (`Supplied/Withdrawn/Borrowed/Repaid`) → dashboard updates, listeners cleaned up on unmount
- Fail-safe: even if events are missed, UI still catches up within ~3s via throttled block listener

This repository reflects a production-minded implementation of the assignment.
Optional hardening steps (tests, audit, CI) are included for completeness but are not required by the original task.
