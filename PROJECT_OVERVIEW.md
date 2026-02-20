# Project overview (v1.0 P0–P10)

This document gives a single pass over the repo: **requirements source, tech stack, folder structure, contracts, frontend, scripts, tests, docs**, so any later change or walkthrough uses the same picture. **Aligned with v1.0 P0–P10 Local-Only upgrade.**

---

## 1. Purpose and source

- **Type**: Web3 full-stack demo project (portfolio for technical roles); **v1.0 P0–P10 Engineering-Complete (Local-Only)**.
- **Requirements**: Summarized in [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md) Part 3 and [docs/01-README.md](docs/01-README.md).
- **v1.0 scope (summary)**: Upgradeable lending protocol (proxy, reserves, rate, oracle, risk, liquidation, Treasury), access control and emergency pause, Governor + Timelock governance; React frontend (Dashboard, Governance, Markets, Pause/Unpause); single-command verification `npm run p10:gate` (deploy → governance → E2E → evidence-pack).
- **This repo**: Implements the above with enterprise hardening (tx state machine, refresh strategy, safety components, reproducible pipeline) for interview demo and recording.

---

## 2. Tech stack

| Layer   | Tech | Notes |
|---------|------|-------|
| Chain   | Hardhat local | chainId 31337, RPC `http://127.0.0.1:8545` |
| Contracts | Solidity 0.8.19 | `contracts/core/`, `oracle/`, `tokens/`, `governance/`, OpenZeppelin (proxy, Governor, Timelock) |
| Deploy  | Hardhat + TypeScript | `scripts/deploy/deploy.ts` (P0–P8), `scripts/deploy/deploy-p9.ts` (governance), `scripts/_lib/export.ts` |
| Frontend | React + TypeScript + Vite | `frontend/`, ethers v6; Dashboard, Governance, Markets, Activity |
| Test    | Hardhat + Mocha/Chai + Playwright | `test/unit/`, `test/integration/`, `test/invariants/`, `test/fuzz/`; E2E `e2e/` |
| Verification | p10:gate | `npm run p10:gate` → deploy → deploy:p9 → E2E → evidence-pack |

---

## 3. Folder structure (main)

```
Smart contract projects/
├── contracts/           # core/ (LendingPoolImpl, ReserveLogic, RiskEngine, Liquidation, PoolConfigurator, Treasury, …), oracle/, tokens/, governance/, libs/, mocks/; ImportProxy.sol, SimpleLending.sol
├── scripts/             # deploy/deploy.ts, deploy/deploy-p9.ts, _lib/export.ts, governance/, ci/, demo/, config/, release/
├── deployments/         # 31337.json (chainId → addresses)
├── frontend/src/        # abis/, config/, contracts/, hooks/, state/, utils/, components/, pages/ (Dashboard, Governance, Markets, Activity), App.tsx
├── test/                # integration/, unit/, invariants/, fuzz/
├── e2e/                 # Playwright UI E2E
├── docs/                # 00-INDEX（唯一条目）, 01-README, 02-PROJECT-LEAD-ENTRY, 03-08-deployment-runbook, … 15–21 治理; release/, debug/, runbooks/
├── learning/            # 学习与面试材料。**权威入口**：learning/项目总览架构.md（已与 v1.0 P0–P10 对齐；0–29 已参照总览更新）。当前栈见 docs/02、03-08、09、12-PROTOCOL-DESIGN、15 及根 README。
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## 4. Contracts (v1.0)

- **Core**: LendingPoolImpl (via proxy), PoolConfigurator, ReserveLogic, RiskEngine, Liquidation, Treasury, FlashLoan, LinearRateStrategy, UserConfiguration; aToken, variableDebtToken.
- **Oracle**: OracleRouter, ChainlinkAdapter, PriceBoundGuard (see [docs/12-PROTOCOL-DESIGN.md](docs/12-PROTOCOL-DESIGN.md) §04).
- **Governance**: Governor (OpenZeppelin), Timelock, GovToken; EmergencyModule / PAUSER.
- **Deploy**: USD8/WETH (TestToken), proxy + implementation, P9 Governor + Timelock + GovToken; addresses and ABIs exported to `frontend/src/contracts/` and `deployments/`.

---

## 5. Frontend

- **Data**: `deployments.json` + ABIs (SimpleLending, GovToken, GovernorP9, TestToken); `getContracts(chainId)`; no hardcoded addresses.
- **Pages**: Dashboard (supply/withdraw/borrow/repay, pool overview, user position), Governance (proposals, voting), Markets (reserve list), Activity (tx history); Pause/Unpause bar when PAUSER.
- **Flow**: useWallet → useDashboard → useActions → usePreflight; tx state in txStore; refresh on confirm + event backfill. Governance: useGovernanceOverview, proposal creation/voting.

---

## 6. Scripts and test

- **deploy.ts**: Deploy P0–P8 (USD8, WETH, pool proxy + implementation, oracle, configurator, treasury, etc.); seed; export to `deployments/` and `frontend/src/contracts/` and ABIs.
- **deploy-p9.ts**: Deploy Governor, Timelock, GovToken; wire roles and permissions.
- **p10:gate**: Port check → start node → deploy → deploy:p9 → E2E (core or full) → evidence-pack; exit 0 = v1.0 gate pass.
- **Tests**: Unit (ReserveLogic, RateStrategy, RiskEngine, Oracle, …), integration (SimpleLending flow), invariants, fuzz; Playwright E2E for UI.

---

## 7. Docs and handoff

- **Entry**: [docs/01-README.md](docs/01-README.md), [docs/00-INDEX.md](docs/00-INDEX.md).
- **Lead**: [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md).
- **Architecture / protocol**: [docs/12-PROTOCOL-DESIGN.md](docs/12-PROTOCOL-DESIGN.md) (merged 00–09).
- **Local run / demo**: [LOCAL_RUN.md](LOCAL_RUN.md), [docs/08-DEMO-RUNBOOK-LOCAL.md](docs/08-DEMO-RUNBOOK-LOCAL.md), [docs/09-本地链标准与地址.md](docs/09-本地链标准与地址.md).
- **Learning materials**: `learning/` 若存在，**权威入口**为 **learning/项目总览架构.md**（已与 v1.0 P0–P10 对齐；0–29 已参照总览更新）。当前栈见：本 overview、docs/02、03-08、09、12-PROTOCOL-DESIGN、[docs/15-governance-create-proposal-example.md](docs/15-governance-create-proposal-example.md)、根 README。

For changes (e.g. slides, contract comments, one UI button), you can say “based on PROJECT_OVERVIEW.md section X” to scope the edit.
