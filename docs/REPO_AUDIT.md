# Repository audit — what is in this repo

**Purpose**: Clear snapshot of what is tracked in Git and how to verify it. Suitable for project leads and interviewers.

**Scope**: This document describes only what exists in the repository (no local-only or ignored content).

---

## 1. Tracked structure

```
├── .github/workflows/ci.yml
├── .gitignore
├── .vscode/extensions.json
├── CONTRIBUTING.md
├── LOCAL_RUN.md
├── PROJECT_OVERVIEW.md
├── README.md
├── SECURITY.md
├── contracts/
│   ├── SimpleLending.sol
│   └── TestToken.sol
├── deployments/
│   └── 31337.json
├── docs/
│   ├── README.md
│   ├── PROJECT_LEAD_REVIEW.md
│   ├── Technical_Overview_and_Entry.md
│   ├── P0_P6_Summary.md
│   ├── P6_Completion_Assessment.md
│   └── REPO_AUDIT.md          ← this file
├── frontend/                   # React + TypeScript + Vite + ethers v6
│   ├── src/                    # components, hooks, state, config, contracts, utils, styles
│   ├── public/
│   ├── abis/, contracts/       # ABIs and deployments from deploy script
│   └── config (package.json, vite, tsconfig, eslint)
├── scripts/
│   ├── deploy.ts               # Deploy + seed + export to frontend
│   ├── _lib/ (export.ts, fs.ts)
│   ├── smoke-e2e.mjs           # E2E smoke flow
│   └── README.md
├── slides/
│   ├── INTERVIEW_DECK.en.md
│   ├── README.md
│   └── assets/*.svg (7 files)
├── test/
│   └── SimpleLending.integration.ts
├── hardhat.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## 2. Document index (all tracked)

| Document | Purpose |
|----------|---------|
| **README.md** | Main entry: summary, doc links, run steps, interviewer quick verify |
| **PROJECT_OVERVIEW.md** | Single pass: purpose, tech stack, folders, contracts, frontend, scripts, docs |
| **LOCAL_RUN.md** | Local run and MetaMask (fix “Contract read failed”, reset account) |
| **SECURITY.md** | Vulnerability reporting, scope, dependency audit, contract notes |
| **CONTRIBUTING.md** | Doc and code conventions, security and release |
| **docs/README.md** | Doc index by role (interviewer vs lead) |
| **docs/PROJECT_LEAD_REVIEW.md** | Full repo review and self-check |
| **docs/Technical_Overview_and_Entry.md** | Tech stack, run and verify, doc index |
| **docs/P0_P6_Summary.md** | P0–P6 design, implementation, acceptance |
| **docs/P6_Completion_Assessment.md** | P6 completion and tech-style assessment |
| **docs/REPO_AUDIT.md** | This file — what is in the repo |
| **scripts/README.md** | deploy.ts, _lib, smoke-e2e.mjs |
| **frontend/README.md** | Frontend run, scope, architecture |
| **frontend/FRONTEND_STYLE_GUIDE.md** | Style and domain constraints |
| **slides/README.md** | Slides (Marp) and export notes |

---

## 3. Scripts (tracked only)

| Script | Purpose |
|--------|---------|
| **scripts/deploy.ts** | Deploy USD8, WETH, SimpleLending; seed; export deployments + ABIs to frontend |
| **scripts/_lib/export.ts, fs.ts** | Helpers for deploy and file export |
| **scripts/smoke-e2e.mjs** | E2E smoke: deploy + approve→supply→borrow→repay→withdraw |

**npm scripts (relevant)**: `compile`, `node`, `deploy:localhost`, `test`, `smoke:e2e`, `ci:local`, `audit:prod`, `audit:all`, `slides:pdf`, `slides:html` (English deck only).

---

## 4. Contracts and tests

- **contracts/**: SimpleLending.sol (single-asset lending), TestToken.sol (ERC20 for USD8/WETH).
- **test/**: SimpleLending.integration.ts (full flow, over-borrow and unhealthy withdraw revert).

---

## 5. CI

- **.github/workflows/ci.yml**: On push/PR — contracts: `npm ci`, compile, test; frontend: `npm ci`, lint, build.
- No deploy or secrets in CI; Node 20, npm cache used.

---

## 6. Verification checklist (for reviewer)

1. **One-shot**: `npm ci` then `npm run ci:local` (compile, test, frontend lint and build).
2. **Run locally**: Terminal 1 `npx hardhat node`; Terminal 2 `npx hardhat run scripts/deploy.ts --network localhost`; Terminal 3 `cd frontend && npm ci && npm run dev`. Open app, connect MetaMask (chain 31337), run supply/withdraw/borrow/repay.
3. **Optional E2E**: `npm run smoke:e2e` (with node running; script deploys and runs full flow).
4. **Audit**: `npm run audit:prod` (production deps only).

---

## 7. Content policy (repo)

- No “assignment” / “coding test” / “exam” in tracked docs; wording uses “demo project” / “project”.
- No internal process docs (changelog, release checklist, coding-test checklist) in repo.
- No Chinese slides or internal slide reports in repo; only English deck and assets.
- No scripts that reference missing or internal-only files in package.json.

This repository is intended to be project-only and interviewer-ready.
