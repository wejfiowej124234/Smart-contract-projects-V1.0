# Professional Audit Checklist (Vocabulary)

This document is a reusable, low-risk audit checklist you can apply to similar Web3 coding-test repos.
It focuses on **assignment acceptance + minimum risk**, not "production protocol completeness".

---

## 1) Reproducibility & Build Integrity（可复现性与构建完整性）

AI check keywords / points:
- Clean-room reproducibility: fresh clone + `npm ci` (root + frontend) runs 100%
- Deterministic builds: lockfiles exist (package-lock / pnpm-lock / yarn.lock) and are not drifting
- One-command verification: provide `ci:local` / verify script covering compile/test/lint/build
- Toolchain constraints: `engines.node` + CI Node version pinned (avoid “works on my machine”)
- No generated artifacts committed: `node_modules/`, `dist/`, `cache/` not tracked

Acceptance phrase:
- “Verify clean clone reproducibility and deterministic build pipeline. Confirm lockfile integrity and CI-equivalent local command.”

---

## 2) Requirements Coverage & Scope Control（需求覆盖与范围控制）

AI check keywords / points:
- Mandatory coverage: map each mandatory requirement to concrete files/functions
  - connect/switch chain
  - balances
  - allowance
  - pool stats
  - user position
  - tx flows
  - event-driven refresh
  - tx statuses
- Non-goals / out-of-scope explicitly stated (oracle, liquidation, interest accrual, mainnet, backend)
- Assumptions stated (e.g. WETH display-only; rates display-only; token decimals)
- No scope creep: no additional protocol features introduced

Acceptance phrase:
- “Map each mandatory requirement to concrete files/functions; confirm explicit scope boundaries and assumptions; ensure no additional protocol features were introduced.”

---

## 3) Web3 Integration Correctness（Web3 集成正确性）

AI check keywords / points:
- EIP-1193 provider usage: `BrowserProvider(window.ethereum)` (ethers v6)
- Signer/Contract wiring: read/write separation (read-only vs signer-connected write)
- Chain switching: `wallet_switchEthereumChain` + 4902 → `wallet_addEthereumChain`
- Account/network reactivity: `accountsChanged` / `chainChanged` triggers refresh/re-init
- Allowance model: `allowance(owner, spender)` + approve-if-needed
- Event subscription hygiene: `on` + `off` cleanup; avoid duplicate listeners/leaks

Acceptance phrase:
- “Audit EIP-1193 integration, ethers v6 best practices, chain switch/add flow, reactive handling for account/network changes, and event listener lifecycle management.”

---

## 4) Transaction Lifecycle & UX Resilience（交易生命周期与体验韧性）

AI check keywords / points:
- Tx state machine: idle → signing → pending → confirmed/failed (or equivalent)
- User rejection handling: MetaMask code 4001 has a clear user-facing message
- Error surfacing: all errors (including validation / not connected) go into unified UI error (no unhandled promise rejection)
- Loading & button disabling: disable while pending/signing; prevent double-submit
- Post-confirm refresh: refresh after `tx.wait()`; event-trigger refresh also works
- UI consistency: `formatUnits` + units; percent fields include `%`

Acceptance phrase:
- “Confirm robust tx lifecycle, consistent loading/disable semantics, no unhandled promise rejections, and user-readable error mapping (including 4001). Ensure confirmed+event refresh and formatted display units.”

---

## 5) Data Consistency & Read Model Strategy（数据一致性与读模型策略）

AI check keywords / points:
- Source of truth: explicitly define what comes from on-chain views
- Refresh triggers: confirmed + events + optional throttled block listener fail-safe
- Avoid redundant RPC calls: cache network/chainId where practical; debounce/throttle strategy
- Staleness bounds: document how quickly UI converges (e.g. 3s block fallback)

Acceptance phrase:
- “Review read-model source of truth and refresh triggers; verify debounced/throttled update strategy and absence of redundant RPC calls; define and document staleness bounds.”

---

## 6) Security Posture（安全姿态：合约 + 前端）

Frontend:
- No secrets in repo: no private keys / mnemonics / API keys
- Input validation: string → `parseUnits`; reject empty; avoid unsafe Number math
- Bigint-only arithmetic for on-chain values
- Approve compatibility note: some ERC20 require `approve(0)` then `approve(new)`

Contracts:
- Baseline guards: ReentrancyGuard / Pausable / Ownable / SafeERC20
- Revert reasons are readable
- No misleading constants: unused constants removed or explicitly explained
- Not for mainnet: SECURITY/README says not audited / assignment-only

Acceptance phrase:
- “Perform security posture review (no secrets, safe number handling, validation, error hygiene). For contracts, confirm baseline guards and clear disclaimers that it is not audited / not intended for mainnet.”

---

## 7) Testing Strategy（测试策略与覆盖）

AI check keywords / points:
- Hardhat integration tests cover:
  - happy path
  - key reverts
  - pause/unpause (admin controls)
- Matcher correctness: hardhat-chai-matchers (`emit`, `revertedWith`)
- Negative tests: insufficient liquidity / exceeds borrow limit / unhealthy withdraw
- Frontend tests: optional; lint/build as gate is acceptable

Acceptance phrase:
- “Validate test suite covers happy path + key reverts + administrative controls, and tests are deterministic under local Hardhat chain.”

---

## 8) Documentation Quality（文档质量）

AI check keywords / points:
- Runbook clarity: multi-terminal steps + expected outputs
- Submission readiness: packaging/email strategy if needed
- Demo checklist: demo order + what to expect
- Scope & non-goals: explicit
- Windows compatibility: PowerShell/cmd examples

Acceptance phrase:
- “Assess documentation for interview-grade reproducibility, demo runbook clarity, explicit scope/non-goals, and platform compatibility notes.”

---

## 9) Repository Hygiene & Compliance（仓库卫生与合规）

AI check keywords / points:
- Public-safe policy: `.gitignore` excludes pdf/docx/zip/_translation_work/jd/assignment
- No copyrighted attachments committed
- Minimal artifacts: no logs, pid, cache tracked
- Release hygiene: version tag / changelog if requested

Acceptance phrase:
- “Check repository hygiene and compliance: no copyrighted attachments, no sensitive files tracked, and public-safe ignore rules.”

---

## Repo Mapping (this project)

This section ties the audit vocabulary to concrete files in this repo.

- Reproducibility / one-command CI-equivalent: [package.json](package.json) (`ci:local`)
- Toolchain constraints: [package.json](package.json) + [frontend/package.json](frontend/package.json) (`engines.node`)
- Wallet (EIP-1193 + chain switch/add + reactivity): [frontend/src/hooks/useWallet.ts](frontend/src/hooks/useWallet.ts)
- Read model + refresh (confirmed + events + optional block fallback):
  - [frontend/src/hooks/useDashboard.ts](frontend/src/hooks/useDashboard.ts)
  - [frontend/src/App.tsx](frontend/src/App.tsx)
- Write model (approve-if-needed + tx states):
  - [frontend/src/hooks/useActions.ts](frontend/src/hooks/useActions.ts)
  - [frontend/src/state/tx.ts](frontend/src/state/tx.ts)
- Read/write contract wiring: [frontend/src/contracts/contracts.ts](frontend/src/contracts/contracts.ts) + [frontend/src/contracts/write.ts](frontend/src/contracts/write.ts)
- Contracts baseline guards: [contracts/SimpleLending.sol](contracts/SimpleLending.sol)
- Tests: [test/SimpleLending.integration.ts](test/SimpleLending.integration.ts)
- Scope/non-goals + runbook: [README.md](README.md) + [README_CODING_TEST_CHECKLIST.md](README_CODING_TEST_CHECKLIST.md)
