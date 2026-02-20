# Part 2 — Frontend (React + TypeScript + ethers v6)

This frontend connects to the local Hardhat chain (chainId `31337`) and interacts with:

- `USD8` (ERC20)
- `WETH` (display-only balance)
- `SimpleLending` (single-asset lending using USD8)

## Run

From repo root, start the local node and deploy/export ABIs:

```bash
npx hardhat node
npm run deploy:localhost
```

Then run the frontend:

```bash
cd frontend
npm ci
npm run dev
```

## MetaMask auto-switch / auto-add (demo-ready)

The app switches to the expected chainId from `frontend/src/contracts/deployments.json` (default: `31337`).

For a smooth local demo, this repo includes `frontend/.env.development` (no secrets) to enable one-click chain add when MetaMask doesn’t have the local Hardhat chain yet:
- `VITE_LOCAL_RPC_URL` (used only for `wallet_addEthereumChain`)
- `VITE_AUTO_ADD_CHAIN=true`
- optional `VITE_EXPECTED_CHAIN_NAME`

To override locally, create `frontend/.env.local`.

## Demo / interview notes

- **Wallet language:** The app UI is in English. Transaction and approval prompts (e.g. “Confirm”, “Expenditure limit”) are shown by the **wallet** (e.g. MetaMask). Their language follows the wallet or browser locale, not the app. For an English demo, set MetaMask (and/or the browser) to English.
- **Amount after confirm:** After a transaction is confirmed, the amount input for that action (Supply / Withdraw / Borrow / Repay) is cleared automatically.
- **Amount in wallet vs app:** The wallet may display a rounded amount (e.g. 11.11) while the app shows 11.111. The value sent on-chain is the exact amount entered; the difference is only how the wallet chooses to display it.
- **Browser translation:** The app is built in English. If you use the browser’s “Translate page” to Chinese, labels can be wrong (e.g. “USD8” → “8 美元”, “Withdrawing” → “戒断反应”). For a correct demo, use English or keep the page untranslated. Card titles now use `translate="no"` on the token symbol so “USD8” stays as-is.

## Commands

```bash
npm run lint
npm run build
```

## P10 gate (full stack验收)

From **repo root** (not `frontend/`), run:

```bash
npm run p10:gate
```

This starts the local chain, runs deploy + P9 governance steps + E2E (Playwright), then generates the evidence pack. Ensure port **8545** and **5173** are free. Frontend is exercised by E2E (connect wallet, Supply/Borrow/Repay/Withdraw, Governance page); selectors are documented in «E2E selectors» above and must not be removed.

**Before first run:** install Playwright browsers from repo root: `npx playwright install` (or `npx playwright install chromium`). Otherwise E2E will fail with “Executable doesn't exist”.

The gate uses **build + preview** for the frontend (not dev server), so the app is ready quickly. If E2E fails with `frontend did not become ready at http://127.0.0.1:5173`, check that no other process is using 5173 and re-run.

## Scope & assumptions

- `WETH` is display-only and does not participate in lending math.
- The protocol is intentionally simplified for this demo and is not intended for mainnet use.

## Architecture (refactor blueprint — Plan A)

- **Routes:** `/` Dashboard, `/markets` Markets, `/markets/:assetId` Asset detail, `/governance` Governance (user), `/activity` Activity (placeholder), `/settings` Settings (placeholder), `/admin` → `/admin/proposals`, `/admin/proposals/:id` Admin proposal detail.
- **Layout:** `Layout` (exported as `AppLayout`) with `Header` + main nav (Dashboard | Markets | Governance) + `<Outlet />`. Admin: `AdminLayout` with back link, Proposals nav, `<Outlet />`.
- **Components:** `components/layout/`, `components/dashboard/` (DashboardKpiBar, RiskParametersPanel, PoolOverview, UserPosition), `components/actions/`, `components/charts/PriceVolumeChart`, `components/governance/ProposalVotesBar`, `TimelockCountdown`, `components/markets/ReserveList`, `components/admin/` (AdminLayout, PauseUnpauseBar).
- **Data:** `src/contracts/`, `src/hooks/` (useWallet, useDashboard, usePoolInfo, useActions, …), `src/state/`, `src/utils/`.

## E2E selectors (Playwright)

Stable selectors used by repo-root `e2e/` tests; do not remove or change semantics:

- **App layout:** `[data-testid="app-layout"]`, `[data-testid="main-nav"]`.
- **Nav links:** `[data-testid="nav-dashboard"]`, `[data-testid="nav-markets"]`, `[data-testid="nav-governance"]` (link text "Governance" — `getByRole("link", { name: /governance/i })`).
- **Connect wallet:** `getByRole("button", { name: /connect wallet/i })`; after connect: `getByText(/connected/i)`.
- **Chain:** `getByText(/Hardhat Local|31337/i)`.
- **Action cards:** `#action-card-supply`, `#action-card-borrow`, `#action-card-repay`, `#action-card-withdraw` (must remain for lending flow).
- **Governance:** `getByRole("heading", { name: /governance/i })`, `getByText(/proposal|loading|connect wallet to view/i)`.
- **Pause:** `getByRole("region", { name: /pause control/i })` or `getByText(/Pool is (active|paused)/i)`.
- **Admin:** `[data-testid="admin-layout"]`, `[data-testid="admin-back-to-app"]`, `[data-testid="admin-nav-proposals"]`.
