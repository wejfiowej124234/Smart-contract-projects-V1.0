# Production-Grade Roadmap (Checklist → This Repo)

This repository started as a coding assignment (PoC). This document maps a real “production-grade” checklist into:

- **Already implemented** in this repo
- **Implementable now** (hardening without redesign)
- **Requires protocol redesign** (true DeFi production features)

The goal is to avoid over-engineering while still applying production engineering standards.

---

## 1) Current status (already implemented)

### Frontend (wallet + reliability)
- ChainId gating: wrong network blocks write actions
- Auto add/switch chain to 31337
- Connection persistence and account/network change handling
- Unified tx state machine: `idle → signing → pending → confirmed/failed`
- Allowance display + approve-if-needed flow
- Refresh strategy:
  - tx confirmed refresh
  - contract events refresh (with cleanup)
  - optional throttled block listener fail-safe

### Delivery / docs
- Root README: reproducible steps + strict self-check list
- `docs/` walkthrough and demo checklist

### CI / quality gates
- GitHub Actions: contracts compile + test; frontend lint + build
- Local CI-equivalent script: `npm run ci:local`

### Contracts (baseline security)
- `Ownable` admin controls
- `Pausable` (pause supply/withdraw/borrow/repay)
- `ReentrancyGuard` on state-changing functions
- `SafeERC20` transfers

### Tests
- Hardhat integration tests for the happy path + key revert/pause cases

### Dependency posture
- `npm audit --omit=dev` is **0 vulnerabilities** (production dependencies)
- Full `npm audit` may report **dev-toolchain** vulnerabilities (Hardhat/transitives). Fixing often requires breaking upgrades (e.g., Hardhat major bumps), so we do not apply `npm audit fix --force` in this assignment repo.

---

## 2) Implementable now (production hardening without redesign)

These items can be added while keeping the same public API and app behavior:

### Smart contracts (baseline security)
- `Ownable` / role-based access (admin functions only)
- `Pausable` (pause supply/withdraw/borrow/repay)
- `ReentrancyGuard` on state-changing functions
- Use `SafeERC20` for transfers

### Testing
- Hardhat integration tests for:
  - approve → supply → borrow → repay → withdraw
  - revert cases (insufficient supply, exceeds borrow limit, unhealthy withdraw)

### CI
- GitHub Actions running:
  - root: compile + test
  - frontend: build + lint

---

## 3) Requires protocol redesign (true DeFi production)

These are *not* incremental hardening tasks. They fundamentally change the protocol and are out of scope for the original assignment:

- **Oracles** (e.g., Chainlink) for collateral valuation across assets
- **Multi-asset collateral + liquidation** mechanics
- **Interest accrual** over time (index-based accounting)
- **Configurable risk params** with governance (timelock/multisig)
- **Fixed-point math** (wad/ray), rounding invariants, and economic audits

If the business goal is a real lending protocol, these should be built as a separate “protocol v2” milestone.

---

## 4) Recommendation

For a production-ready *engineering standard* on this assignment:

1) Add CI + tests
2) Add `Ownable + Pausable + ReentrancyGuard + SafeERC20`
3) Keep docs explicit about scope (single-asset toy protocol)
