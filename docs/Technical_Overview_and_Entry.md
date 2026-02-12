# Technical Overview and Run Guide

One-page technical overview for **review and interview**: tech stack, repo structure, how to run and verify, where to find documentation.

---

## 1. Project scope

- **Smart Contract Demo Project** — full implementation: local Hardhat chain + frontend integration.
- Features: single-asset (USD8) lending dashboard; **Approve → Supply, Withdraw, Borrow, Repay**; MetaMask connect; auto add/switch chain and persistent connection; refresh on tx confirmation + contract events.
- Scope: single page, single pool, local-chain demo; no mainnet deployment, oracle, or liquidation logic.

---

## 2. Tech stack

| Layer      | Tech |
|-----------|------|
| Contracts | Solidity, Hardhat, ethers (deploy scripts) |
| Frontend  | React 18, TypeScript, Vite, ethers v6 |
| Local chain | Hardhat Node, chainId 31337 |
| Test      | Hardhat integration tests; optional E2E smoke |

---

## 3. Repo structure (main)

```
├── README.md                 # Project overview and reproduction steps (main entry)
├── LOCAL_RUN.md              # Local run steps (incl. MetaMask)
├── contracts/                # SimpleLending.sol, TestToken.sol
├── scripts/                  # deploy.ts (deploy + seed + export ABI/addresses)
├── frontend/                 # React app; reads deployments.json + ABIs
├── test/                     # SimpleLending integration tests
├── docs/                     # Documentation; index at docs/README.md
│   ├── README.md             # Doc index (by purpose / role)
│   ├── P0_P6_Summary.md      # Design / implementation / acceptance overview
│   └── REPO_AUDIT.md         # Tracked files + verification
├── deployments/              # Deployment output 31337.json
└── learning/                 # Learning materials (local only; not in repo)
```

---

## 4. How to run (three steps)

1. **Start local chain** (terminal 1): `npx hardhat node`
2. **Deploy and export** (terminal 2): `npx hardhat run scripts/deploy.ts --network localhost`
3. **Start frontend** (terminal 3): `cd frontend && npm ci && npm run dev`

Open the app in the browser; add RPC `http://127.0.0.1:8545`, chainId `31337` in MetaMask, then connect and use the app.  
For detailed steps and “MetaMask balance wrong after restart”, see root **LOCAL_RUN.md**.

---

## 5. How to verify (self-check / CI)

- **Contracts**: `npm run compile`, `npm test`
- **Frontend**: `cd frontend && npm run lint && npm run build`
- **One-shot**: `npm run ci:local` (compile + test + frontend lint/build)
- **E2E**: `npm run smoke:e2e` (optional; requires node running and deployed)

---

## 6. Documentation index

| Need | Document |
|------|----------|
| Quick reproduction, checklist | Root **README.md** |
| Local run and MetaMask | **LOCAL_RUN.md** |
| Full repo review + self-check (recommended) | **docs/PROJECT_LEAD_REVIEW.md** |
| Design / implementation / acceptance | **docs/P0_P6_Summary.md** |
| Find all docs by purpose | **docs/README.md** |
| Security and vulnerability reporting | **SECURITY.md** |

Full doc list and verification: **docs/REPO_AUDIT.md**.

---

## 7. Pre-handoff checklist

- `npm run ci:local` passes.
- Local flow works: Connect → Supply (incl. Approve) → Borrow → Repay → Withdraw.
- Docs read: root README, this overview, **docs/PROJECT_LEAD_REVIEW.md**.

---

This document is the **technical overview**; it complements root **README.md** (usage and reproduction). Full design rationale is in **docs/P0_P6_Summary.md**.
