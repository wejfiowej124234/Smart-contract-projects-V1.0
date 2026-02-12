# Project overview

This document gives a single pass over the repo: **assignment source, tech stack, folder structure, contracts, frontend, scripts, tests, docs, and interview materials**, so any later change or walkthrough uses the same picture.

---

## 1. Purpose and source

- **Type**: Web3 full-stack coding test (assignment from interviewer).
- **Assignment**: Root `Coding Test Assignment - Web3 engineer.pdf` or `docs/archive/CODING_TEST_ASSIGNMENT.txt`.
- **Requirements (summary)**:
  - **Part 1 (required)**: Hardhat project; deploy USD8/WETH/SimpleLending; seed test accounts; export ABI and addresses for the frontend.
  - **Part 2 (required)**: React + TypeScript + ethers v6 frontend; MetaMask connect; auto switch to chain 31337; show balance/pool/user position; Supply/Withdraw/Borrow/Repay and Approval; tx status (pending/confirmed/failed); event listeners and UI update.
  - **Part 3 (bonus)**: At least 2 integration tests; error handling (balance/allowance/health factor/network); async loading states.
- **This repo**: Implements the above and adds enterprise hardening (tx state machine, three-layer refresh, safety components, reproducible pipeline) for interview demo and recording.

---

## 2. Tech stack

| Layer   | Tech | Notes |
|---------|------|-------|
| Chain   | Hardhat local | chainId 31337, RPC `http://127.0.0.1:8545` |
| Contracts | Solidity 0.8.19 | `contracts/`, OpenZeppelin |
| Deploy  | Hardhat + TypeScript | `scripts/deploy.ts`, `scripts/_lib/export.ts` |
| Frontend | React + TypeScript + Vite | `frontend/`, ethers v6 |
| Test    | Hardhat + Mocha/Chai | `test/SimpleLending.integration.ts` |
| Slides  | Marp (Markdown → HTML/PDF) | `slides/` |

---

## 3. Folder structure (main)

```
Smart contract projects/
├── contracts/           # SimpleLending.sol, TestToken.sol
├── scripts/             # deploy.ts, _lib/export.ts, smoke-e2e.mjs
├── deployments/         # 31337.json (chainId → addresses)
├── frontend/src/        # abis/, config/, contracts/, hooks/, state/, utils/, components/, App.tsx
├── test/                # SimpleLending.integration.ts
├── docs/                # README.md index, PROJECT_LEAD_REVIEW, Technical_Overview_and_Entry, P0_P6_Summary, P6_Completion_Assessment, archive/
├── learning/            # Study materials (local only; not in repo)
├── slides/              # INTERVIEW_DECK.*.md, assets/*.svg
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## 4. Contracts

- **TestToken.sol**: Minimal ERC20 for USD8/WETH; 18 decimals; mint in deploy.
- **SimpleLending.sol**: Single-asset lending (USD8); LTV 75%; events Supplied/Withdrawn/Borrowed/Repaid; supply/withdraw/borrow/repay with health check and utilization rates.

---

## 5. Frontend

- **Data**: `deployments.json` + ABIs from deploy script; `getContracts(chainId)`; no hardcoded addresses.
- **Flow**: useWallet → useDashboard → useTokenMetadata → useAllowance → useActions → useDashboardForm; tx state in txStore; refresh on confirm + event backfill.
- **UI**: Header, DataStatusBar, DashboardGrid (PoolOverview, UserPosition), ActionCardsGrid (Supply/Withdraw/Borrow/Repay), TxStatus, PreflightModal; design tokens and config/ui only.

---

## 6. Scripts and test

- **deploy.ts**: Deploy USD8, WETH, SimpleLending; seed; export to `deployments/` and `frontend/src/contracts/` and `frontend/src/abis/`.
- **smoke-e2e.mjs**: Start node → deploy → run full approve→supply→borrow→repay→withdraw.
- **SimpleLending.integration.ts**: Full flow, over-borrow revert, unhealthy withdraw revert.

---

## 7. Docs and handoff

- **Entry**: [docs/README.md](docs/README.md).
- **Lead**: [docs/PROJECT_LEAD_REVIEW.md](docs/PROJECT_LEAD_REVIEW.md), [docs/Technical_Overview_and_Entry.md](docs/Technical_Overview_and_Entry.md).
- **Design/acceptance**: [docs/P0_P6_Summary.md](docs/P0_P6_Summary.md), [docs/P6_Completion_Assessment.md](docs/P6_Completion_Assessment.md).
- **Local run**: [LOCAL_RUN.md](LOCAL_RUN.md).

For changes (e.g. slides, contract comments, one UI button), you can say “based on PROJECT_OVERVIEW.md section X” to scope the edit.
