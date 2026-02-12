# Project lead review — entire folder

**Purpose**: One place for the project lead to see the whole repo, structure, and enterprise standards.  
**Last updated**: After code-style audit, personified comments, and editing-discipline docs.

**Note for lead**: You only need **this file** and **[Technical_Overview_and_Entry.md](Technical_Overview_and_Entry.md)**. The rest of `docs/` (audits, security, UI/UX, demo, checklists) is for delivery/audit/dev — **no need to read** unless you want to dive deep.

---

## 1. Folder map (what lives where)

```
Smart contract projects/
├── .cursorrules              # AI/edit rules to avoid regressions (renames, CSS)
├── .github/workflows/ci.yml   # CI pipeline
├── contracts/                 # Solidity
│   ├── SimpleLending.sol      # Single-asset lending (supply/withdraw/borrow/repay)
│   └── TestToken.sol          # ERC20 for USD8/WETH
├── deployments/               # Deploy output (chainId → addresses)
│   └── 31337.json
├── docs/                      # All project documentation (see docs/README.md index)
│   ├── PROJECT_LEAD_REVIEW.md # ← this file
│   ├── CODE_STYLE_AND_NAMING_AUDIT.md
│   ├── CODE_COMMENTS_AUDIT.md
│   ├── EDITING_DISCIPLINE.md
│   └── … (assessment, security, UI/UX audits, etc.)
├── frontend/
│   ├── src/
│   │   ├── abis/              # Contract ABI JSON (SimpleLending, TestToken)
│   │   ├── components/        # React UI
│   │   │   ├── actions/       # ActionCard, ActionCardsGrid, ApproveToolbar
│   │   │   ├── dashboard/     # DashboardGrid, PoolOverview, UserPosition
│   │   │   ├── layout/        # Header, DataStatusBar
│   │   │   ├── tx/            # TxStatus
│   │   │   └── ui/            # AddressDisplay, PreflightModal
│   │   ├── config/            # network, runtime, ui copy (single source)
│   │   ├── contracts/         # abis, deployments, getContracts, write helpers
│   │   ├── hooks/             # useWallet, useDashboard, useActions, useDashboardForm, useAllowance, usePreflight, useTheme, useTokenMetadata, useTxDisplay
│   │   ├── state/             # tx, txStore, errors (normalizeError)
│   │   ├── styles/            # CSS: layout, cards-dashboard, forms-buttons, tx-modal
│   │   ├── types/             # dashboard (props, hook returns), ethereum (EIP-1193)
│   │   ├── utils/             # amount, format, assert
│   │   ├── App.tsx, main.tsx
│   │   ├── design-tokens.ts   # Theme variables (injected into index.css)
│   │   └── index.css          # :root + theme overrides
│   ├── vite.config.ts, tsconfig.*, eslint.config.js
│   └── package.json
├── learning/                  # Study/interview materials (Chinese)
├── scripts/
│   ├── deploy.ts              # Deploy contracts + seed; export to frontend
│   ├── _lib/                  # export, fs helpers
│   ├── smoke-e2e.mjs, demo-ui.mjs, …
│   └── README.md
├── slides/                    # Interview deck, speaker script, PDF generation
├── test/
│   └── SimpleLending.integration.ts
├── hardhat.config.ts
├── package.json, tsconfig.json
├── README.md, SECURITY.md, CONTRIBUTING.md, CHANGELOG.md
├── PUBLIC_RELEASE_CHECKLIST.md, README_CODING_TEST_CHECKLIST.md
└── PROJECT_OVERVIEW (project overview doc when present)
```

---

## 2. Enterprise standards — what’s in place

| Area | Status | Reference |
|------|--------|-----------|
| **Code comments** | English, personified where added (hooks, state, utils, config, contracts) | docs/CODE_COMMENTS_AUDIT.md |
| **Naming** | Unified: formatToken/formatPercent (no fmt* in public API); formatLocalTime | docs/CODE_STYLE_AND_NAMING_AUDIT.md |
| **Style** | Single convention: camelCase/PascalCase/SCREAMING_SNAKE as per audit | Same |
| **Editing discipline** | Rename + CSS rules documented; .cursorrules for AI/human | docs/EDITING_DISCIPLINE.md |
| **Structure** | Clear separation: contracts / frontend (config, hooks, state, components, styles, types, utils) / scripts / test / docs | — |
| **Security** | Root SECURITY.md | Full audit in docs/archive/ |
| **CI** | .github/workflows/ci.yml | — |
| **Single source for UI copy** | frontend/src/config/ui.ts (no hardcoded strings in components) | — |
| **Types** | Centralized in types/dashboard.ts, types/ethereum.ts | — |

---

## 3. Personified comments (where they were added)

- **Hooks**: useWallet, useActions, useDashboard, useDashboardForm, useAllowance, usePreflight, useTheme, useTokenMetadata, useTxDisplay — file-level or main-export JSDoc in English, “we/you” tone.
- **State**: tx.ts (runTxDetailed), txStore.ts (PersistedTx), errors.ts (RPC message rewrite).
- **Utils**: format.ts, amount.ts (sanitizeAmountInput, safeMaxWei), assert.ts.
- **Config**: network.ts, runtime.ts, ui.ts (file header).
- **Contracts (frontend)**: contracts.ts (getContracts), deployments.ts (Deployments, getDeployments).
- **Types**: ethereum.ts (Eip1193Provider).

---

## 4. What the lead should check (short checklist)

- [ ] **Run**: `npm install` (root), `cd frontend && npm install`, `npx hardhat run scripts/deploy.ts --network localhost`, `cd frontend && npm run dev` — app loads, connect wallet, one supply flow.
- [ ] **Build**: `cd frontend && npm run build` — no CSS/TS errors.
- [ ] **Tests**: `npm test` (if configured), `npx hardhat test` or integration test — pass.
- [ ] **Docs**: docs/README.md is the doc index; PROJECT_LEAD_REVIEW.md (this file) = whole-folder view.
- [ ] **Standards**: CODE_STYLE_AND_NAMING_AUDIT.md + EDITING_DISCIPLINE.md + .cursorrules = naming, comments, and “don’t repeat past mistakes.”

---

## 5. Doc index for the lead

| Need | Document |
|------|----------|
| **Whole folder + standards** | This file (PROJECT_LEAD_REVIEW.md) |
| **Technical entry** | docs/Technical_Overview_and_Entry.md |
| **Doc index** | docs/README.md |
| **P0–P6 overview** | docs/P0_P6_Summary.md |
| **P6 completion** | docs/P6_Completion_Assessment.md |
| **Security** | Root SECURITY.md |

Other docs (audits, security, UI/UX, code style) are in **docs/archive/** when needed.

---

**Summary**: The repo is structured for an enterprise-style review: contracts, frontend (with clear config/hooks/state/components/styles/types/utils), scripts, test, and docs. Comments are English and personified where added; naming is unified; editing discipline and .cursorrules reduce repeat regressions. The project lead can use this file as the single “whole folder” view and the checklist above for a quick verification pass.
