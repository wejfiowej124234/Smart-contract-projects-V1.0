---
marp: true
paginate: false
size: 16:9
theme: gaia
footer: "SimpleLending | Product Roadshow Deck | 2026-02-10"
title: "SimpleLending - Product & Technical Roadshow (English)"
author: "Smart Contract Projects"
keywords: "Web3, DeFi, Smart Contracts, Hardhat, React, TypeScript, Lending Protocol"
description: "Roadshow-ready deck: a reproducible, verifiable lending dApp MVP"
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
    padding: 56px 72px 112px 72px;
    display: flex;
    flex-direction: column;
    position: relative;
    font-size: 28px;
    font-family: "Inter", "SF Pro Display", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.45;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Bottom pixel safety strip: override Marp pagination (::after) to avoid edge clipping */
  section::after {
    content: "" !important;
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    height: 2px !important;
    padding: 0 !important;
    background: var(--bg) !important;
    z-index: 9999 !important;
    pointer-events: none !important;
  }
  h1, h2, h3, h4, h5, h6 { 
    color: var(--fg); 
    font-weight: 600;
  }
  h1 { 
    font-size: 60px; 
    letter-spacing: -0.5px; 
    line-height: 1.2;
    margin-bottom: 20px;
  }
  h2 { 
    font-size: 40px; 
    letter-spacing: -0.3px; 
    line-height: 1.3;
    margin-bottom: 16px;
  }
  h3 { 
    font-size: 30px; 
    letter-spacing: -0.2px;
    line-height: 1.4;
    margin-bottom: 14px;
  }
  h4 {
    font-size: 26px;
    letter-spacing: -0.1px;
    line-height: 1.4;
    margin-bottom: 10px;
    font-weight: 600;
  }
  h5 {
    font-size: 24px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 8px;
    font-weight: 500;
  }
  h6 {
    font-size: 22px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 6px;
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
    margin: 0 0 12px 0;
    line-height: 1.55;
  }
  
  ul, ol {
    line-height: 1.55;
    margin: 10px 0;
  }
  
  blockquote {
    border-left: 4px solid var(--accent);
    padding-left: 20px;
    margin: 16px 0;
    font-style: italic;
    color: var(--muted);
    font-size: 25px;
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
    font-size: 64px;
    margin-top: 72px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .divider-sub {
    margin-top: 12px;
    font-size: 28px;
    color: var(--muted);
    font-weight: 400;
  }

  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px 30px;
    min-width: 0;
    font-size: 24px;
    line-height: 1.45;
  }

  /* Per-slide compact mode for dense pages */
  section.compact { font-size: 26px; }
  section.compact h1 { font-size: 56px; }
  section.compact h2 { font-size: 36px; margin-bottom: 16px; }
  section.compact h3 { font-size: 28px; margin-bottom: 14px; }
  section.compact .card { font-size: 23px; padding: 22px 30px; }
  section.compact .tight ul, section.compact .tight ol { margin: 4px 0 0 20px; }
  section.compact .tight li { margin: 4px 0; line-height: 1.5; }

  /* Per-slide dense mode (more aggressive than compact) */
  section.dense { font-size: 24px; }
  section.dense h1 { font-size: 52px; }
  section.dense h2 { font-size: 34px; margin-bottom: 14px; }
  section.dense h3 { font-size: 26px; margin-bottom: 12px; }
  section.dense .card { font-size: 21px; padding: 18px 24px; }
  section.dense .tight ul, section.dense .tight ol { margin: 2px 0 0 18px; }
  section.dense .tight li { margin: 2px 0; line-height: 1.4; }
  section.dense pre { font-size: 20px; padding: 16px 18px; margin: 12px 0; }
  section.dense img { max-height: 58vh; }
  section.dense footer { font-size: 12px; margin-bottom: 20px; }
  section.dense .evidence { font-size: 12px; padding: 8px 12px; }

  /* Ultra-dense mode for slides that still overflow */
  section.ultra { font-size: 22px; }
  section.ultra h1 { font-size: 48px; }
  section.ultra h2 { font-size: 32px; margin-bottom: 12px; }
  section.ultra h3 { font-size: 24px; margin-bottom: 10px; }
  section.ultra .card { font-size: 19px; padding: 14px 20px; }
  section.ultra .tight ul, section.ultra .tight ol { margin: 2px 0 0 16px; }
  section.ultra .tight li { margin: 2px 0; line-height: 1.35; }
  section.ultra pre { font-size: 18px; padding: 12px 14px; margin: 10px 0; }
  section.ultra img { max-height: 54vh; }
  section.ultra footer { font-size: 11px; margin-bottom: 18px; }
  section.ultra .evidence { font-size: 11px; padding: 6px 10px; }

  /* Extra safety for PDF viewers that clip bottom pixels */
  section.safefooter { padding-bottom: 176px; }
  section.safefooter footer { margin-bottom: 34px; }
  section.safefooter .card { font-size: 17px; line-height: 1.35; }
  section.safefooter code { font-size: 18px; }
  section.safefooter img { max-height: 18vh !important; }

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
    white-space: normal;
    font-size: 21px;
    font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", monospace;
    background: rgba(22, 27, 34, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1.5;
  }

  .tight ul, .tight ol { margin: 4px 0 0 22px; }
  .tight li { margin: 4px 0; line-height: 1.5; }

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
    padding: 18px 22px;
    overflow-x: auto;
    font-size: 23px;
    line-height: 1.55;
    margin: 12px 0;
  }
  
  pre code {
    background: transparent;
    padding: 0;
    font-size: 24px;
    color: var(--fg);
  }

  .evidence {
    position: static;
    order: 98;
    margin-top: auto;
    align-self: flex-start;
    padding: 10px 16px;
    font-size: 14px;
    color: rgba(201, 209, 217, 0.9); /* Improved contrast */
    background: var(--panel-strong);
    border: 1px solid rgba(110, 118, 129, 0.5);
    border-radius: 12px;
    backdrop-filter: blur(4px);
    font-weight: 400;
    line-height: 1.4;
    max-width: 100%;
    word-break: break-word;
  }

  .evidence + footer {
    margin-top: 12px;
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

  /* Some slides place diagrams low on the canvas; avoid shadow pixels touching the bottom edge. */
  section.safefooter img {
    box-shadow: none;
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

  /* Footer as a bottom row (never overlaps content) */
  section footer {
    order: 99;
    margin-top: auto;
    position: static !important;
    inset: auto !important;
    height: auto !important;
    line-height: 1.3 !important;
    padding: 0 !important;
    font-size: 14px;
    color: rgba(201, 209, 217, 0.65);
    text-align: left;
    font-weight: 400;
    margin-bottom: 28px;
  }
---

# SimpleLending
## Reproducible Lending MVP (End-to-End)

<div class="subtitle">Reproducible · Verifiable · Security baseline · End-to-end flow</div>

<div class="card tight" style="margin-top: 32px; margin-bottom: 24px;">

- **Audience**: investors / partners / technical decision-makers / architects
- **Capability**: collateral deposit → borrow → repay → withdraw (end-to-end)
- **Delivery**: contracts + frontend + one-click deploy/export + automated verification

</div>

---

## Agenda

<div class="topkicker">OVERVIEW</div>

<div class="cols" style="margin-top: 32px;">

<div class="card tight">

### Part A
1) Product value & scope
2) Architecture (end-to-end)
3) Key design decisions (tradeoffs)
4) Reliability & UX (Tx lifecycle, refresh strategy)

</div>

<div class="card tight">

### Part B
5) Security baseline
6) Testing & reproducibility
7) Demo flow + Q&A

</div>

</div>

---

## Key terms & interfaces

<div class="topkicker">OVERVIEW</div>

<div class="card">

Functions:
- **Supply**: `supply(amount)`
- **Borrow**: `borrow(amount)`
- **Repay**: `repay(amount)`
- **Withdraw**: `withdraw(amount)`

Local PoC defaults:
- **ChainId 31337** = Hardhat local chain (not a port)
- **RPC**: `http://127.0.0.1:8545` (Hardhat node default)
- **Frontend**: `http://localhost:5173` (Vite default)

</div>

---

## Executive Summary (Four Audiences)

<div class="topkicker">OVERVIEW</div>

- **Investors**: a demonstrable lending MVP with clear value and explicit boundaries
- **Partners**: exported ABIs + addresses (`frontend/src/contracts/deployments.json` + `frontend/src/abis/*.json`) + standardized events for integration
- **Technical decision-makers**: on-chain hard constraints + verifiable tests + explicit non-goals
- **Architects**: Tx lifecycle + refresh/backfill strategy + normalized errors

One-liner:
> “A reproducible, verifiable lending MVP: end-to-end flow, on-chain hard rules, and production-style delivery.”

---

## Product capabilities & evidence

<div class="topkicker">OVERVIEW</div>

![requirements](./assets/requirements-mapping.svg)

<div class="evidence">Evidence: <strong>docs/ASSESSMENT_MAPPING.md</strong> · <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

<!-- _class: compact -->

## 60-Second Overview (Value + Credibility)

<div class="topkicker">OVERVIEW</div>

- End-to-end lending MVP with **full-stack integration**
- Contract hard rules: USD8, **LTV=75%**, borrow/withdraw revert on violation
- Reliability: Tx lifecycle + post-confirmation refresh (`onConfirmed()` after `TX_CONFIRMATIONS`) + events + bounded backfill (`EVENT_BACKFILL_MAX_BLOCKS = 2000`)
- Delivery: one-click deploy/seed/export (ABIs + addresses) + integration tests

---

<!-- _class: compact -->

<div class="topkicker">ARCHITECTURE</div>

<div class="divider-title">Architecture</div>
<div class="divider-sub">End-to-end system & integration evidence</div>

---

<!-- _class: compact -->

## Architecture (End-to-End)

<div class="topkicker">ARCHITECTURE</div>

![architecture](./assets/architecture.svg)

<div class="evidence">Evidence: <strong>scripts/_lib/export.ts</strong> · <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>


---

<!-- _class: compact -->

<div class="topkicker">CONTRACT</div>

<div class="divider-title">Contract</div>
<div class="divider-sub">Hard rules enforced on-chain</div>

---

<!-- _class: compact dense ultra -->

## Contract: Core Rules

<div class="topkicker">CONTRACT</div>

- Single asset: USD8 is used for both collateral and borrowing
- WETH: frontend balance display only (not used in protocol)
- LTV = 75%
  - `maxBorrow = supplied * 75%`
- Hard constraints:
  - `borrow()` reverts if it exceeds maxBorrow
  - `withdraw()` reverts if it makes position unhealthy

---

<!-- _class: compact -->

## LTV Constraints (Hard Rules)

<div class="topkicker">CONTRACT</div>

![ltv](./assets/ltv-constraints.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> (LTV_RATIO, borrow(), withdraw(), calculateMaxBorrow(), calculateMaxWithdraw())</div>

---

<!-- _class: compact dense -->

## Frontend: Read/Write Separation

<div class="topkicker">FRONTEND</div>

- Read model (provider): balances, pool stats, position, maxBorrow/maxWithdraw
- Write model (signer): approve-if-needed + Tx lifecycle + post-state checks (verifying/verified/unverified, bounded)

Why it matters:
- Reads are parallelized via `Promise.all` and guarded by `refreshSeq` to prevent stale overwrites
- Writes are inherently uncertain (reject, replace, timeout)

---

<div class="topkicker">RELIABILITY</div>

<div class="divider-title">Reliability</div>
<div class="divider-sub">Tx lifecycle + refresh strategy</div>

---

## Reliability: Tx Lifecycle State Machine

<div class="topkicker">RELIABILITY</div>

- `idle → signing → pending → confirmed / failed / stuck`
- Handles real-world cases:
  - user rejection
  - long pending txs
  - replacement (speed up)
  - pending timeout (`TX_PENDING_TIMEOUT_MS`) + RPC eventual consistency

---

## Tx State Machine (Reliability Core)

<div class="topkicker">RELIABILITY</div>

![tx](./assets/tx-state-machine.svg)

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong> · <strong>frontend/src/state/txStore.ts</strong></div>

---

## Reliability: Refresh Strategy

<div class="topkicker">RELIABILITY</div>

Three layers (in order):
1) After tx confirmation: force refresh
2) Contract events: Supplied/Withdrawn/Borrowed/Repaid (primary path)
3) Fail-safe fallback: throttled block listener (~3s) + small-range backfill (best-effort)

---

<!-- _class: compact dense ultra safefooter -->

## Refresh strategy (3 layers)

<div class="topkicker">RELIABILITY</div>

<div class="card tight" style="margin-bottom: 8px;">

**Three-layer refresh mechanism** (by priority):
1) **Force refresh after tx confirmed**: after confirmation (`tx.wait(TX_CONFIRMATIONS)` / `provider.waitForTransaction`), invoke `onConfirmed()` to refresh read-models
2) **Contract event listeners** (primary path): `Supplied` / `Withdrawn` / `Borrowed` / `Repaid`
3) **Fail-safe fallback**: throttled block listener + small-range backfill (`EVENT_BACKFILL_MAX_BLOCKS = 2000`)

Auditable budgets:
- Throttle: `scheduleRefresh` ~250ms; block fail-safe disabled during `signing/pending/stuck` and while dashboard is loading
- Backfill (best-effort): `queryFilter(from..to)`; if any log then refresh; cursor=`to+1`; errors retry later
- Post-state: budget `POST_STATE_MAX_WAIT_MS` (poll 500ms; timeout → `unverified` with note)

</div>

<img src="./assets/refresh-strategy.svg" style="max-height: 24vh;" />

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/config/runtime.ts</strong></div>


---

<div class="topkicker">SECURITY</div>

<div class="divider-title">Security</div>
<div class="divider-sub">Baseline hardening + explicit scope boundary</div>

---

## Security Baseline (In-Scope)

<div class="topkicker">SECURITY</div>

- `ReentrancyGuard`: nonReentrant on state-changing flows
- `Pausable` + `Ownable`: emergency stop
- `SafeERC20`: safer token interactions

Scope boundary:
- No oracle, liquidation, multi-asset (intentionally out of scope)

---

<!-- _class: dense -->

## Security & UX safety hardening

<div class="topkicker">SECURITY</div>

![security](./assets/security-hardening.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> · <strong>frontend/src/utils/amount.ts</strong> · <strong>frontend/src/hooks/useWallet.ts</strong></div>

---

<div class="topkicker">TESTING</div>

<div class="divider-title">Testing</div>
<div class="divider-sub">Reproducible verification (happy path + key reverts)</div>

---

## Testing & Reproducibility

<div class="topkicker">TESTING</div>

<div class="cols">

<div class="card tight">

### Integration test (acceptance-level)
- approve → supply → borrow → repay → withdraw
- Key reverts:
  - borrow over LTV: revertedWith("Exceeds borrowing limit")
  - withdraw unhealthy: revertedWith("Withdrawal would make position unhealthy")

</div>

<div class="card tight">

### Automated verification
- Scripted E2E smoke: `npm run smoke:e2e`

Why it matters:
- Reduces integration uncertainty with a repeatable verification path

</div>

</div>

---

## Reproducible Pipeline (Copy/Paste)

<div class="topkicker">REPRODUCIBILITY</div>

![pipeline](./assets/pipeline.svg)

<div class="evidence">Evidence: <strong>package.json</strong> scripts · <strong>scripts/deploy.ts</strong> · <strong>scripts/smoke-e2e.mjs</strong></div>

---

## Delivery & Operational Readiness (Enterprise Checklist)

<div class="topkicker">DELIVERY</div>

<div class="cols">

<div class="card tight">

### Reproducible / Verifiable
- **Reproducible**: one-click scripts + exported artifacts (ABIs + addresses) + pinned deps
- **Verifiable**: integration tests cover the full loop + key safety boundaries

</div>

<div class="card tight">

### Operable / scope boundary
- **Operable**: `smoke:e2e` verification fallback reduces live uncertainty
- **Scope boundary**: explicit non-goals to avoid “fake production-ready” claims
- **Full-stack integration (design sketch; out of scope here)**: Next.js/Node BFF (REST) + JWT; Postgres for app state/indexed views; optional Kafka for event ingestion + async retries (best-effort)

</div>

</div>

---

<div class="topkicker">DEMO</div>

<div class="divider-title">Demo</div>
<div class="divider-sub">5-minute flow + verification fallback</div>

---

<!-- _class: compact -->

## Demo Flow (5 Minutes)

<div class="topkicker">DEMO</div>

<div class="cols">

<div class="card tight">

### Flow
1) Connect wallet (auto switch to 31337)
2) Supply (approve if needed)
3) Borrow (show LTV)
4) Repay (approve if needed)
5) Withdraw (health check)

</div>

<div class="card tight">

### What to highlight
- On-chain hard constraints: LTV checks on borrow/withdraw
- Reliability: Tx lifecycle + post-confirmation refresh + event-driven updates
- Evidence pointers: repo paths on slides

</div>

</div>

---

<!-- _class: dense -->

# Q&A (business + partner + technical)

<div class="topkicker">APPENDIX</div>

<div class="cols">

<div class="card tight">

### Scope / non-goals
- No oracle, liquidation, interest accrual, multi-asset
- Reason: keep MVP scope crisp while preserving reproducibility and verifiability

</div>

<div class="card tight">

### Common follow-ups
- Why `approve` is required (ERC20 allowance)
- Why refresh after confirmation (RPC eventual consistency)
- What if events are missed (fail-safe fallback refresh/backfill)
- How to extend to production (oracle + liquidation + risk parameters)
- Backend integration (design sketch): Next.js/REST/JWT + Postgres; optional Kafka for ingestion/retries (on-chain as source of truth)

</div>

</div>

---

# Thanks

Happy to dive into product value, integration, security, or architecture.
