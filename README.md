# Smart Contract Demo Project — Summary

**Version: v1.0.0** (single source of truth: `package.json` → `"version": "1.0.0"`)

This repository delivers **P0–P10 Engineering-Complete (Local-Only)** Enterprise-Grade Release. **The repository is self-contained and public**: an interviewer can clone it and run the verification steps below (no extra assets or private docs required).

**Disclaimer:** Educational and local demonstration only. Not financial, legal, or investment advice. DeFi involves risk. See [REPO_DESCRIPTION.md](REPO_DESCRIPTION.md) for platform-safe self-description.

**📚 Documentation**: Doc index → [**docs/01-README.md**](docs/01-README.md). **Path A（本地演示）不迷路** → [**docs/00-INDEX.md**](docs/00-INDEX.md) § 按运行命令 + [docs/08-DEMO-RUNBOOK-LOCAL.md](docs/08-DEMO-RUNBOOK-LOCAL.md). **本地链联调（前后端）**：以 [**docs/09-本地链标准与地址.md**](docs/09-本地链标准与地址.md) 为唯一入口（SSOT）；严格按 node→deploy→（必须）重启前端→MetaMask 31337→/diagnostics 三项 Yes 执行，先过 GATE 五项再按 [debug/DEBUG_PLAYBOOK](docs/debug/DEBUG_PLAYBOOK.md) 分层定位，按 Evidence Pack 留证。**排错与已知限制** (CreateFileMapping, tooltips, 已知限制) → [docs/10-TROUBLESHOOTING-AND-LIMITATIONS.md](docs/10-TROUBLESHOOTING-AND-LIMITATIONS.md).  
**📚 For project lead / interviewer**: [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md) (tech stack, structure, run and verify, P0–P6 summary).  
**📚 P10 gate & release**: [RELEASE_CHECKLIST_P10.md](RELEASE_CHECKLIST_P10.md), [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §8、§9、§10.  
**📚 Local run and MetaMask**: [LOCAL_RUN.md](LOCAL_RUN.md). **📚 Project overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).  
**📚 What’s in this repo**: [docs/07-REPO-HYGIENE.md](docs/07-REPO-HYGIENE.md) Part D (tracked files + verification steps for reviewer).

- React + TypeScript + ethers v6 frontend on Hardhat local chain (31337)
- One-click deploys USD8/WETH/SimpleLending and exports ABI + addresses
- Frontend supports auto add/switch chain, and persists connection state
- Supports approve→supply and withdraw/borrow/repay as real on-chain transactions
- Refresh strategy: tx confirmed + contract event listeners (Mandatory)
- Optional fail-safe: 3s throttled `provider.on('block')` refresh (not the main logic)

## Repo structure

| Path | Description |
|------|-------------|
| [docs/01-README.md](docs/01-README.md) | **Doc index** (by role and purpose) |
| [docs/00-INDEX.md](docs/00-INDEX.md) | **Sole index** (by role / P0–P10 / run command) |
| [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md) | Tech stack, runbook, P0–P6 summary（原 Technical_Overview 已合并） |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution and code/doc conventions |

*This delivery repo does not include `learning/` or `slides/`; see [docs/REPO-FOR-PROJECT-PARTY.md](docs/REPO-FOR-PROJECT-PARTY.md) for scope.*

## Scope & Non-Goals

**v1.0 scope (P0–P10 Local-Only) — 已实现：**
- Proxy and upgradeability; reserve and rate modules; access control and pause; multi-asset configuration; aToken/debtToken; oracle and risk controls; liquidation and Treasury; governance and emergency; local final gate (including Playwright UI E2E) and verifiable Evidence Pack.
- Smart contract integration; frontend transaction lifecycle (Dashboard, Governance, Pause/Unpause); reliability and reproducibility.

**唯一验收标准（v1.0）**：端口 8545 空闲下执行 `npm run p10:gate` 至 **exit 0**；输出含 EVIDENCE-PACK-MANIFEST-SHA256 及 COMMIT_SHA/NODE_VERSION/NPM_VERSION/OS（与 evidence-pack/evidence-summary.json 一致）。未满足则门禁失败。

**Out of scope for this release:**
- Mainnet/testnet production deployment (local-only deliverable).
- Production monitoring, SLA, or third-party mainnet audit commitment.

## Engineering notes (why this design)

- Design tradeoffs, non-goals, and intentional choices: see [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md) Part 3.

## Production hardening (optional)

Scope: v1.0 is Local-Only; mainnet/testnet deployment is out of scope. See [SECURITY.md](SECURITY.md) for reporting and scope.

Deployment headers (recommended): for any real hosting of the frontend, set a baseline Content Security Policy (CSP) and disable framing (e.g., `frame-ancestors 'none'` / `X-Frame-Options: DENY`) to reduce injection and clickjacking risks.

## Enterprise hardening (in-scope, quick spot check)

- Amount safety: strict decimal schema + bigint end-to-end (no number round-trip) — see [frontend/src/utils/amount.ts](frontend/src/utils/amount.ts) and UI in [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx) / [frontend/src/components/actions/](frontend/src/components/actions/)
- Conservative Max actions: “Max (safe)” uses maxBorrow/maxWithdraw minus 1 wei — see Dashboard action cards and [frontend/src/hooks/useActions.ts](frontend/src/hooks/useActions.ts)
- Approve safety: exact vs infinite toggle + USDT-style fallback approve(0)→approve(amount) — see [frontend/src/hooks/useActions.ts](frontend/src/hooks/useActions.ts) and preflight in Dashboard
- Pre-wallet transaction summary (intent clarity): before any wallet prompt, the UI presents **Action / Token / Spender / Amount** and approval step — see preflight modal and action flow in [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)
- Address display safety (checksum + full reveal): addresses from [frontend/src/contracts/deployments.json](frontend/src/contracts/deployments.json); rendered in Layout/Dashboard — see [frontend/src/components/layout/Layout.tsx](frontend/src/components/layout/Layout.tsx) and contract addresses section
- Final consistency: confirmations + pending-tx restore + event backfill (queryFilter) — see [frontend/src/state/tx.ts](frontend/src/state/tx.ts), [frontend/src/state/txStore.ts](frontend/src/state/txStore.ts), [frontend/src/hooks/useDashboard.ts](frontend/src/hooks/useDashboard.ts)

Pending txs are timeout-protected; users can re-check status or clear “stuck” local entries to handle dropped/replaced transactions on real RPCs.

Scope boundary: these measures focus on frontend-level safety and correctness. Protocol-level risks (oracle integrity, liquidation design, MEV) are documented in [docs/](docs/) and [project-upgrade/](project-upgrade/).

### Single acceptance entry (Local-Only · zero-trust)

**Unique verification for v1.0 Local-Only release:** one command from a clean environment (port 8545 free):

```bash
npm run p10:gate
```

- **Meaning**: Port check → start local chain → **eth_chainId** 0x7a69 → **p10:ci** (deploy → governance steps → e2e:ui Playwright [or skip with `SKIP_E2E_UI=1`]) → evidence-pack → output `EVIDENCE-PACK-MANIFEST-SHA256`. Any step failure → **exit 1** (gate blocked).
- **Path A (one-click demo)**: Terminal 1 `npm run demo:chain`; Terminal 2 `npm run demo:frontend` (actual command: `cd frontend && npm run dev`; for RPC env use `node scripts/demo/start-frontend.mjs`). Optional: `npm run e2e:ui` when chain is already running.

See [RELEASE_CHECKLIST_P10.md](RELEASE_CHECKLIST_P10.md) and [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §8.

### Post-state verification (best-effort)

After a transaction is confirmed, the app performs a short post-state check by re-reading relevant on-chain views to verify that the intended state change is observable.

Because RPC reads are eventually consistent, a missing update is **not treated as a failure**.  
Instead, the transaction is marked as **“unverified”**, and the user is prompted to refresh the state manually.

This avoids false negatives while still providing a clear and deterministic user experience under real-world RPC behavior.

Additional checks (optional; p10:gate already includes deploy + E2E):
- Contracts: `npm run compile && npm test`
- Frontend: `cd frontend && npm run lint && npm run build`
- Scripted E2E (with node running): `npm run smoke:e2e`

## Release & Mainnet-Launch-Ready

**v1.0 Full GO (sealed)**：端口 8545 空闲下执行 `npm run p10:gate` 至 **exit 0**；evidence-pack 生成且控制台含 EVIDENCE-PACK-MANIFEST-SHA256 与四锚点 = **v1.0 Full GO（Gate-Complete + Release-Signable）**。**Authoritative Release Evidence**（封板 SHA256 + 四锚点）：[docs/04-AUTHORITATIVE-RELEASE-EVIDENCE.md](docs/04-AUTHORITATIVE-RELEASE-EVIDENCE.md)。See [RELEASE_CHECKLIST_P10.md](RELEASE_CHECKLIST_P10.md)、[docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §9（v1.0 发布记录与宣言）。

**Portfolio (international Web3 Protocol roles)**：English one-pager、architecture summary、10-minute script、product portfolio 已合并为 [docs/14-EN-PORTFOLIO.md](docs/14-EN-PORTFOLIO.md)。Full index: [docs/00-INDEX.md](docs/00-INDEX.md) § 六.

**Mainnet/testnet path (optional):** For future mainnet/L2 launch, run `npm run ci:local:release` (with `npx hardhat node` in another terminal): Deploy → Smoke → Test → C3a deviation test → Security Gate; any failure → exit 1. See [docs/archive/](docs/archive/)（过程文档，已归档）；主网/多链以 [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §10 为准。

## Scripted E2E smoke (optional)

- Runs: start local node (if needed) → deploy + export → perform a full approve→supply→borrow→repay→withdraw flow using the exported frontend ABIs.
- Command: `npm run smoke:e2e`

Run the same checks as CI:

```bash
# contracts
npm ci
npm run compile
npm test
# Optional: invariant tests, fuzz, liquidation bot (see docs/03-08-deployment-runbook.md §10.3)
# npm run test:invariant && npm run test:fuzz && npm run liquidation-bot

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

### A) Single acceptance entry (v1.0 Local-Only)

Ensure port 8545 is free, then:

```bash
npm ci
npm run p10:gate
```

Exit 0 且控制台含 `EVIDENCE-PACK-MANIFEST-SHA256` 与四锚点（COMMIT_SHA/NODE_VERSION/NPM_VERSION/OS）= 通过。Optional: `npx playwright install chromium` if not already installed.

### B) Alternative: manual chain + deploy + frontend

Terminal 1 (start local chain):

```bash
npx hardhat node
```

Terminal 2 (deploy + seed + export):

```bash
npm run deploy:localhost
```

Terminal 3 (start frontend dev server):

```bash
cd frontend
npm ci
npm run dev
```

Optional: seed your own MetaMask address (instead of importing Hardhat Account #0):

```bash
SEED_ADDRESS=0xYourMetaMaskAddress npm run deploy:localhost
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
npm run deploy:localhost
```

3. Configure MetaMask (for local demo only):
- Add network: RPC `http://127.0.0.1:8545`, chainId `31337`
- Import Hardhat Account #0 private key (from `hardhat node` output)

4. Start frontend (after step 2):
```bash
cd frontend && npm run dev
```

Importing the key is not required by the project; it ensures the connected account matches the seeded one so balances are non-zero for approve/supply.

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
npm run deploy:localhost
```

This still satisfies“seed test account”requirement; you only need to provide the target address.

## 4) Deploy + seed + export
In a second terminal:
```bash
npm run deploy:localhost
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

This repository reflects a production-minded implementation of the project.
Optional hardening steps (tests, audit, CI) are included for completeness but are not required by the original task.
