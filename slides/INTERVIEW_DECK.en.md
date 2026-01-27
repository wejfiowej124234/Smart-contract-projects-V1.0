---
marp: true
paginate: true
size: 16:9
theme: gaia
footer: "Smart-contract-projects | Web3 Engineer Coding Test | 2026-01-27"
title: "Web3 Engineer Coding Test - Technical Presentation (English)"
author: "Smart Contract Projects"
keywords: "Web3, DeFi, Smart Contracts, Hardhat, React, TypeScript, Lending Protocol"
description: "Enterprise-grade technical presentation: Reproducible DeFi lending protocol implementation"
style: |
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg: #0b1020;
    --panel: rgba(22, 27, 34, 0.65);
    --panel-strong: rgba(22, 27, 34, 0.85);
    --border: rgba(110, 118, 129, 0.25);
    --fg: #e6edf3;
    --muted: rgba(201, 209, 217, 0.85); /* Improved contrast for WCAG AA */
    --muted2: rgba(201, 209, 217, 0.70); /* Improved contrast */
    --accent: #7ee787;
    --link: #58a6ff;
  }

  section {
    background: var(--bg);
    color: var(--fg);
    padding: 56px 72px 120px 72px;
    font-size: 30px;
    font-family: "Inter", "SF Pro Display", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  h1, h2, h3, h4, h5, h6 { 
    color: var(--fg); 
    font-weight: 600;
  }
  h1 { 
    font-size: 64px; 
    letter-spacing: -0.5px; 
    line-height: 1.2;
    margin-bottom: 24px;
  }
  h2 { 
    font-size: 42px; 
    letter-spacing: -0.3px; 
    line-height: 1.3;
    margin-bottom: 20px;
  }
  h3 { 
    font-size: 32px; 
    letter-spacing: -0.2px;
    line-height: 1.4;
    margin-bottom: 16px;
  }
  h4 {
    font-size: 28px;
    letter-spacing: -0.1px;
    line-height: 1.4;
    margin-bottom: 12px;
    font-weight: 600;
  }
  h5 {
    font-size: 26px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 10px;
    font-weight: 500;
  }
  h6 {
    font-size: 24px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 8px;
    font-weight: 500;
  }
  strong { 
    color: var(--accent); 
    font-weight: 600;
  }
  a { 
    color: var(--link); 
    text-decoration: none;
    border-bottom: 1px solid rgba(88, 166, 255, 0.3);
    transition: border-color 0.2s;
  }
  a:hover {
    border-bottom-color: var(--link);
  }
  
  /* Enhanced readability for financial presentations */
  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
  }
  
  ul, ol {
    line-height: 1.6;
    margin: 12px 0;
  }
  
  blockquote {
    border-left: 4px solid var(--accent);
    padding-left: 20px;
    margin: 20px 0;
    font-style: italic;
    color: var(--muted);
    font-size: 28px;
    line-height: 1.5;
  }

  section::before {
    content: "";
    position: absolute;
    left: 72px;
    right: 72px;
    top: 56px;
    height: 2px;
    background: linear-gradient(90deg, rgba(110,118,129,0.0), rgba(110,118,129,0.45), rgba(110,118,129,0.0));
    opacity: 0.6;
  }

  .kicker {
    font-size: 20px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(201, 209, 217, 0.7);
    font-weight: 500;
  }

  .topkicker {
    position: absolute;
    left: 72px;
    top: 24px;
    font-size: 15px;
    letter-spacing: 2.0px;
    text-transform: uppercase;
    color: var(--muted2);
    font-weight: 500;
  }
  
  /* Additional utility classes for enterprise presentations */
  .highlight {
    background: rgba(126, 231, 135, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent);
  }
  
  .warning {
    background: rgba(255, 193, 7, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: #ffc107;
  }
  
  .note {
    background: rgba(88, 166, 255, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--link);
  }
  
  /* First slide layout optimization */
  section:first-of-type {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  section:first-of-type h1 {
    margin-bottom: 16px;
  }
  
  section:first-of-type h2 {
    margin-bottom: 12px;
  }
  
  section:first-of-type .subtitle {
    margin-bottom: 24px;
  }

  .divider-title {
    font-size: 68px;
    margin-top: 80px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .divider-sub {
    margin-top: 16px;
    font-size: 28px;
    color: var(--muted);
    font-weight: 400;
  }

  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px 28px;
    min-width: 0;
    font-size: 28px;
    line-height: 1.5;
  }

  .card h3, .card h4 {
    margin-top: 0;
    margin-bottom: 8px;
  }

  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  
  /* Three column layout support */
  .cols-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    align-items: start;
  }

  .card, .card * {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  code {
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 26px;
    font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", monospace;
    background: rgba(22, 27, 34, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1.5;
  }

  .tight ul { margin: 8px 0 0 24px; }
  .tight li { margin: 8px 0; line-height: 1.6; }

  .subtitle {
    margin-top: 12px;
    font-size: 24px;
    color: var(--muted);
    font-weight: 400;
    line-height: 1.5;
  }
  
  /* Enhanced code block styling */
  pre {
    background: rgba(22, 27, 34, 0.9);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    overflow-x: auto;
    font-size: 24px;
    line-height: 1.6;
    margin: 16px 0;
  }
  
  pre code {
    background: transparent;
    padding: 0;
    font-size: 24px;
    color: var(--fg);
  }

  .evidence {
    position: absolute;
    left: 40px;
    bottom: 80px;
    padding: 10px 16px;
    font-size: 16px;
    color: rgba(201, 209, 217, 0.9); /* Improved contrast */
    background: var(--panel-strong);
    border: 1px solid rgba(110, 118, 129, 0.5);
    border-radius: 12px;
    backdrop-filter: blur(4px);
    font-weight: 400;
    line-height: 1.4;
  }

  .evidence strong { 
    color: rgba(201, 209, 217, 0.95); 
    font-weight: 600;
  }

  section img {
    max-height: 66vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* Table styles for enterprise presentations */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 28px;
  }
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    background: var(--panel);
    color: var(--fg);
    font-weight: 600;
  }
  tr:hover {
    background: rgba(22, 27, 34, 0.4);
  }
  
  /* Print-friendly styles */
  @media print {
    section {
      page-break-after: always;
    }
    section:last-child {
      page-break-after: auto;
    }
  }

  /* Keep footer & page number inside the PDF safe area */
  section footer {
    position: absolute;
    left: 72px;
    right: 140px;
    bottom: 36px;
    font-size: 16px;
    color: rgba(201, 209, 217, 0.65);
    text-align: left;
    font-weight: 400;
  }

  section::after {
    right: 48px !important;
    bottom: 32px !important;
    font-size: 16px !important;
    color: rgba(201, 209, 217, 0.65) !important;
    font-weight: 400 !important;
  }
---

# Smart-contract-projects
## Web3 Engineer Coding Test — Interview Deck

<div class="subtitle">Reproducible · Verifiable · Demo-safe (enterprise handoff style)</div>

<div class="card tight" style="margin-top: 32px; margin-bottom: 24px;">

- **Stack**: Hardhat + Solidity + React/TS + ethers v6
- **Network**: Hardhat local chain (31337)
- **End-to-end demo**: approve → supply → borrow → repay → withdraw

</div>

<!-- _notes: |
  15s intro. Set expectations: reproducible local demo + engineering reliability.
-->

---

## Agenda

<div class="topkicker">OVERVIEW</div>

<div class="cols" style="margin-top: 32px;">

<div class="card tight">

### Part A
1) Problem statement & scope
2) Architecture (end-to-end)
3) Key design decisions (tradeoffs)
4) Reliability & UX (tx lifecycle, refresh strategy)

</div>

<div class="card tight">

### Part B
5) Security baseline
6) Testing & reproducibility
7) Live demo plan + Q&A

</div>

</div>

---

## Cheat sheet (talk track)

<div class="topkicker">OVERVIEW</div>

<div class="card">

Functions:
- **Supply**: `supply(amount)`
- **Borrow**: `borrow(amount)`
- **Repay**: `repay(amount)`
- **Withdraw**: `withdraw(amount)`

Local env:
- **ChainId 31337** = Hardhat local chain (not a port)
- **RPC**: `http://127.0.0.1:8545` (Hardhat node default)
- **Frontend**: `http://localhost:5173` (Vite default)

</div>

---

## Executive summary (financial enterprise framing)

<div class="topkicker">OVERVIEW</div>

- **Complete deliverables**: contracts + frontend + deploy/seed/export scripts + integration tests
- **Hard constraints**: LTV=75%, borrow/withdraw enforced on-chain (revert)
- **Reliability-first UX**: tx state machine + post-confirm refresh + mandatory events + backfill fail-safe
- **Security baseline**: nonReentrant / SafeERC20 / Pausable + frontend network & amount parsing guards

One-liner:
> “This is a coding test deliverable, organized like a production-grade handoff: reproducible, testable, and explicit about risk boundaries.”

---

## Problem statement vs implementation

<div class="topkicker">OVERVIEW</div>

![requirements](./assets/requirements-mapping.svg)

<div class="evidence">Evidence: <strong>docs/CODING_TEST_ASSIGNMENT.txt</strong> · <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

## 60-second pitch

<div class="topkicker">OVERVIEW</div>

- A reproducible DeFi lending demo with **full-stack integration**
- Contract: single-asset USD8, **LTV=75%**, hard checks on borrow/withdraw
- Frontend: MetaMask auto network switch + read/write separation
- Real-time updates: tx-confirmed refresh + **event listeners (mandatory)**
- Engineering: one-click deploy+seed+export ABI/addresses + integration tests

---

<div class="topkicker">ARCHITECTURE</div>

<div class="divider-title">Architecture</div>
<div class="divider-sub">End-to-end system & evidence pointers</div>

---

## Architecture (end-to-end)

<div class="topkicker">ARCHITECTURE</div>

![architecture](./assets/architecture.svg)

<div class="evidence">Evidence: <strong>scripts/_lib/export.ts</strong> · <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>

<!-- _notes: |
  Walk left to right: Hardhat workspace -> local chain -> frontend. Call out artifact export and the refresh strategy.
-->

---

<div class="topkicker">CONTRACT</div>

<div class="divider-title">Contract</div>
<div class="divider-sub">Hard rules enforced on-chain</div>

---

## Contract: core rules

<div class="topkicker">CONTRACT</div>

- Single asset: USD8 is used for both collateral and borrowing
- LTV = 75%
  - `maxBorrow = supplied * 75%`
- Hard constraints:
  - `borrow()` reverts if it exceeds maxBorrow
  - `withdraw()` reverts if it makes position unhealthy

---

## LTV constraints (hard rules)

<div class="topkicker">CONTRACT</div>

![ltv](./assets/ltv-constraints.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> (LTV_RATIO, borrow(), withdraw(), calculateMaxBorrow(), calculateMaxWithdraw())</div>

---

## Frontend: read/write separation

<div class="topkicker">FRONTEND</div>

- Read model (provider): balances, pool stats, position, maxBorrow/maxWithdraw
- Write model (signer): approve-if-needed + tx lifecycle + post-state checks

Why it matters:
- Keeps reads stable and parallelizable
- Writes are inherently uncertain (reject, replace, timeout)

---

<div class="topkicker">RELIABILITY</div>

<div class="divider-title">Reliability</div>
<div class="divider-sub">Tx lifecycle + refresh strategy (demo-safe)</div>

---

## Reliability: tx lifecycle state machine

<div class="topkicker">RELIABILITY</div>

- `idle → signing → pending → confirmed / failed / stuck`
- Handles real-world cases:
  - user rejection
  - long pending txs
  - replacement (speed up)
  - RPC eventual consistency

---

## Tx state machine (reliability core)

<div class="topkicker">RELIABILITY</div>

![tx](./assets/tx-state-machine.svg)

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong> · <strong>frontend/src/state/txStore.ts</strong></div>

---

## Reliability: refresh strategy

<div class="topkicker">RELIABILITY</div>

Three layers (in order):
1) After tx confirmation: force refresh
2) Contract events: Supplied/Withdrawn/Borrowed/Repaid (mandatory)
3) Optional fail-safe: throttled block listener + small-range backfill

---

## Refresh strategy (3 layers)

<div class="topkicker">RELIABILITY</div>

<div class="card tight" style="margin-bottom: 20px;">

**Three-layer refresh mechanism** (by priority):
1) **Force refresh after tx confirmed**: immediate refresh after `tx.wait()` confirmation
2) **Contract event listeners** (primary path): `Supplied` / `Withdrawn` / `Borrowed` / `Repaid`
3) **Fail-safe fallback**: throttled block listener + small-range backfill (`EVENT_BACKFILL_MAX_BLOCKS = 2000`)

</div>

![refresh](./assets/refresh-strategy.svg)

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/config/runtime.ts</strong></div>

<!-- _notes: |
  Key message: not just polling; events are primary + small fail-safe to avoid demo flakiness.
-->

---

<div class="topkicker">SECURITY</div>

<div class="divider-title">Security</div>
<div class="divider-sub">Baseline hardening + explicit scope boundary</div>

---

## Security baseline (in-scope)

<div class="topkicker">SECURITY</div>

- `ReentrancyGuard`: nonReentrant on state-changing flows
- `Pausable` + `Ownable`: emergency stop
- `SafeERC20`: safer token interactions

Scope boundary:
- No oracle, liquidation, multi-asset (intentionally out of scope)

---

## Security & UX safety hardening

<div class="topkicker">SECURITY</div>

![security](./assets/security-hardening.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> · <strong>frontend/src/utils/amount.ts</strong> · <strong>frontend/src/hooks/useWallet.ts</strong></div>

---

<div class="topkicker">TESTING</div>

<div class="divider-title">Testing</div>
<div class="divider-sub">Reproducible verification (happy path + key reverts)</div>

---

## Testing & reproducibility

<div class="topkicker">TESTING</div>

<div class="cols">

<div class="card tight">

### Integration test (acceptance-level)
- approve → supply → borrow → repay → withdraw
- Key reverts:
  - borrow over LTV
  - withdraw unhealthy

</div>

<div class="card tight">

### Demo backup
- Scripted E2E smoke: `npm run smoke:e2e`

Why it matters:
- Reduces live-demo flakiness
- Provides a repeatable evidence trail

</div>

</div>

---

## Reproducible pipeline (copy/paste)

<div class="topkicker">REPRODUCIBILITY</div>

![pipeline](./assets/pipeline.svg)

<div class="evidence">Evidence: <strong>package.json</strong> scripts · <strong>scripts/deploy.ts</strong> · <strong>scripts/smoke-e2e.mjs</strong></div>

---

## Delivery & operational readiness (enterprise checklist)

<div class="topkicker">DELIVERY</div>

<div class="cols">

<div class="card tight">

### Reproducible / verifiable
- **Reproducible**: one-click scripts + exported artifacts (ABIs/addresses) + pinned deps (lockfile)
- **Verifiable**: integration tests cover the full loop + key safety boundaries

</div>

<div class="card tight">

### Demo-safe / scope boundary
- **Demo-safe**: `smoke:e2e` fallback reduces live uncertainty
- **Scope boundary**: explicit non-goals to avoid “fake production-ready” claims

</div>

</div>

---

<div class="topkicker">DEMO</div>

<div class="divider-title">Demo</div>
<div class="divider-sub">5-minute flow + fallback plan</div>

---

## Live demo plan (5 minutes)

<div class="topkicker">DEMO</div>

<div class="cols">

<div class="card tight">

### Flow (keep it fast)
1) Connect wallet (auto switch to 31337)
2) Supply (approve if needed)
3) Borrow (show LTV)
4) Repay (approve if needed)
5) Withdraw (health check)

</div>

<div class="card tight">

### What to highlight (close strong)
- On-chain hard constraints: LTV checks on borrow/withdraw
- Reliability: tx lifecycle + confirmed refresh + event-driven updates
- Evidence pointers: repo paths on slides

</div>

</div>

---

# Q&A

<div class="topkicker">APPENDIX</div>

<div class="cols">

<div class="card tight">

### Scope / non-goals
- No oracle, liquidation, interest accrual, multi-asset
- Reason: keep the deliverable aligned with the coding test and demo reproducibility

</div>

<div class="card tight">

### Common follow-ups
- Why `approve` is required (ERC20 allowance)
- Why refresh after confirmation (RPC eventual consistency)
- What if events are missed (fail-safe refresh/backfill)
- How to extend to production (oracle + liquidation + risk parameters)

</div>

</div>

---

# Q&A

Happy to dive into contracts or frontend.
