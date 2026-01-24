# Enterprise-style audit report (assignment-bound) — 2026-01-24

Scope boundary: strictly based on `docs/CODING_TEST_ASSIGNMENT.txt` (React + TS + ethers v6 + local Hardhat 31337 + lending dashboard + tx lifecycle + event-driven updates). This is **not** a production protocol audit.

## Automated checks (passed)

- `npm run ci:local`:
  - Hardhat compile: OK
  - Hardhat tests: 4 passing
  - Frontend lint: OK
  - Frontend build: OK
- `npm run audit:prod`: **0 vulnerabilities**

## Automated checks (known limitation)

- `npm run audit:all` reports **low-severity** findings from the **dev toolchain** (Hardhat transitive deps, legacy crypto libs). The current npm output indicates **no fix available** without breaking toolchain upgrades.
- This is documented as out-of-scope for the assignment in `SECURITY.md`.

## Key findings & remediation (in-scope)

### 1) Wallet “persist connection” UX pitfall

- Finding: calling `eth_requestAccounts` automatically on page load can repeatedly prompt the user and is considered poor UX.
- Fix: rely on `eth_accounts` via `refresh()` to restore authorized sessions without prompting; only request accounts on explicit user action.
- Change: `frontend/src/hooks/useWallet.ts`

### 2) Provider block listener effect churn

- Finding: a React effect depending on the entire `dashboard` object can re-run every render, causing avoidable attach/detach of `provider.on('block')`.
- Fix: depend only on `dashboard.refresh` and `dashboard.loading`.
- Change: `frontend/src/App.tsx`

## Contract review (assignment-scope)

- `contracts/SimpleLending.sol`
  - Uses `Ownable`, `Pausable`, `ReentrancyGuard`, `SafeERC20`.
  - Enforces positive amounts and LTV-based constraints.
  - Emits required events for UI updates.
  - Note: this is intentionally a simplified single-asset demo; no oracle/liquidation/interest accrual.

- `contracts/TestToken.sol`
  - Minimal ERC20 subset for local testing; not intended for mainnet usage.

## Recommendation (out-of-scope, documented)

- To eliminate `audit:all` low findings you would likely need a Hardhat ecosystem upgrade path (potentially breaking). This is explicitly non-goal for the assignment and should be treated as roadmap work, not required for correctness.
