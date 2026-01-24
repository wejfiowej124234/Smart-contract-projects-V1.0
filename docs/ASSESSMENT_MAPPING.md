# Assessment Requirement Mapping

This document maps the assignment requirements to the actual implementation in this repository.

## 1) Smart Contract Deployment (Mandatory)

| Requirement | Status | Evidence |
|---|---:|---|
| Deploy USD8 & WETH | ✅ | scripts/deploy.ts, contracts/TestToken.sol |
| Deploy SimpleLending | ✅ | scripts/deploy.ts, contracts/SimpleLending.sol |
| Seed test accounts | ✅ | scripts/deploy.ts (seed logic) |
| Export ABI & addresses for frontend | ✅ | scripts/_lib/export/*, deployments/31337.json, frontend/src/contracts/deployments.json, frontend/src/abis/*.json |

## 2) Web3 Integration (ethers v6)

| Requirement | Status | Evidence |
|---|---:|---|
| MetaMask connection (EIP-1193) | ✅ | frontend/src/hooks/useWallet.ts |
| Auto network switch/add (31337) | ✅ | frontend/src/hooks/useWallet.ts (`wallet_switchEthereumChain` + 4902 → `wallet_addEthereumChain`) |
| Persist connection state | ✅ | frontend/src/hooks/useWallet.ts (localStorage) |
| ethers v6 usage | ✅ | frontend/src/hooks/useWallet.ts, frontend/src/contracts/contracts.ts, frontend/src/contracts/write.ts |
| Read/write separation (provider vs signer) | ✅ | frontend/src/contracts/contracts.ts (read), frontend/src/contracts/write.ts + frontend/src/hooks/useActions.ts (write) |

## 3) Dashboard & Protocol Interaction (Mandatory UI)

| Requirement | Status | Evidence |
|---|---:|---|
| Show USD8/WETH balances | ✅ | frontend/src/hooks/useDashboard.ts, frontend/src/App.tsx |
| Show pool info (supply/borrow/utilization/rates) | ✅ | frontend/src/hooks/useDashboard.ts, contracts/SimpleLending.sol (`getPoolInfo`) |
| Show user position (supplied/borrowed/collateral/healthFactor) | ✅ | frontend/src/hooks/useDashboard.ts, contracts/SimpleLending.sol (`getUserPosition`) |
| Health factor color coding | ✅ | frontend/src/utils/format.ts, frontend/src/App.tsx |
| Allowance check (owner/spender) | ✅ | frontend/src/hooks/useAllowance.ts |
| Approve-if-needed before Supply | ✅ | frontend/src/hooks/useActions.ts |
| Supply / Withdraw / Borrow / Repay | ✅ | frontend/src/hooks/useActions.ts, frontend/src/contracts/write.ts |

## 4) Transaction Lifecycle (Mandatory)

| Requirement | Status | Evidence |
|---|---:|---|
| Tx state: pending / confirmed / failed | ✅ | frontend/src/state/tx.ts, frontend/src/App.tsx |
| Error handling surfaced in UI (incl. validation/not connected) | ✅ | frontend/src/hooks/useActions.ts |
| User rejection handling (MetaMask 4001) | ✅ | frontend/src/state/errors.ts, frontend/src/hooks/useActions.ts |
| Post-confirm refresh (`tx.wait()` then refresh) | ✅ | frontend/src/state/tx.ts, frontend/src/hooks/useActions.ts (onConfirmed) |
| Event-driven refresh (mandatory) | ✅ | frontend/src/hooks/useDashboard.ts |
| Event listener cleanup (no leaks) | ✅ | frontend/src/hooks/useDashboard.ts (on/off in effect cleanup) |

## 5) Reliability & UX Hardening (Within Scope)

| Item | Status | Notes |
|---|---:|---|
| No unhandled promise rejection for action errors | ✅ | Frontend actions capture errors and set tx to failed |
| Numeric formatting + units | ✅ | frontend/src/App.tsx (`formatUnits`, `%`) |
| Liquidity pre-check for Withdraw | ✅ | frontend-only guard in frontend/src/hooks/useActions.ts (does not change contract behavior) |
| Auto tx reset | ✅ | frontend/src/App.tsx (auto-clear confirmed state) |
| Prevent double-submit during signing/pending | ✅ | frontend/src/App.tsx (buttons disabled while signing/pending) |

## 6) Testing & Quality

| Item | Status | Evidence |
|---|---:|---|
| Hardhat integration tests | ✅ | test/SimpleLending.integration.ts |
| Revert cases covered | ✅ | test/SimpleLending.integration.ts |
| Lint + build pass | ✅ | frontend/package.json scripts |
| CI-equivalent local command | ✅ | package.json (`ci:local`) |

## 7) Reproducibility & Build Integrity

| Item | Status | Evidence |
|---|---:|---|
| Clean-room reproducibility (fresh clone + `npm ci`) | ✅ | package-lock.json, frontend/package-lock.json |
| Deterministic installs via lockfiles | ✅ | package-lock.json, frontend/package-lock.json |
| Toolchain constraints (Node >= 18) | ✅ | package.json + frontend/package.json (`engines.node`) |
| No generated artifacts tracked | ✅ | .gitignore, frontend/.gitignore |

## 8) Scope & Non-Goals

Explicitly out of scope (by design):
- Price oracle
- Liquidation engine
- Interest accrual
- Mainnet deployment
- Backend services

See: README.md, SECURITY.md

## 9) Final Notes

This project intentionally focuses on:
- Correct Web3 integration (ethers v6)
- Transaction lifecycle robustness
- Clean separation of read/write logic
- Reproducible local execution

It does not attempt to implement a production lending protocol.
