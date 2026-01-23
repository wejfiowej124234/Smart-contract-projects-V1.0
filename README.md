# Smart Contract Coding Test — Summary

Version: v0.1.0 (assignment release)

This project fully implements all mandatory requirements of the coding assignment.

Optional learning docs (CN/EN): see `docs/WALKTHROUGH.zh-en.md`.
Optional demo runbook (CN/EN): see `docs/DEMO_CHECKLIST.zh-en.md`.

- React + TypeScript + ethers v6 frontend on Hardhat local chain (31337)
- One-click deploys USD8/WETH/SimpleLending and exports ABI + addresses
- Frontend supports auto add/switch chain, and persists connection state
- Supports approve→supply and withdraw/borrow/repay as real on-chain transactions
- Refresh strategy: tx confirmed + contract event listeners (Mandatory)
- Optional fail-safe: 3s throttled `provider.on('block')` refresh (not the main logic)

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

## Production hardening (optional)

Roadmap and scope boundaries: see `docs/PRODUCTION_GRADE_ROADMAP.md`.
Security communication policy: see `SECURITY.md`.

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

## README：写死的复现步骤（建议直接照做）

### ✅ 快速启动（默认 A：导入 Hardhat Account #0）

启动本地链：
```bash
npx hardhat node
```

部署合约并 seed：
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

配置 MetaMask（只为本地演示/开发，非题目功能）：
- 添加网络：RPC `http://127.0.0.1:8545`，chainId `31337`
- 导入 Hardhat Account #0 私钥（来自 `hardhat node` 输出）

启动前端（Part 2 完成后执行）：
```bash
cd frontend && npm run dev
```

说明：导入私钥不是题面要求，是为了保证连接账户与 seed 账户一致，避免余额为 0 导致无法演示 approve/supply。

### ✅ 备选方案（B：不导入私钥，用你自己的 MetaMask 地址）

在部署前设置环境变量（示例）：
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

然后运行 deploy 脚本，脚本会向该地址发放 USD8/WETH：
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

说明：此方案同样符合“seed 测试账户”要求，只是需要你提供一个目标地址。

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
