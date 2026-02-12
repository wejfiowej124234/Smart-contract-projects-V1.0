# Security Policy

This repository is a coding assignment / demo project. The goal of this document is **clear communication** (how to report, what's in scope, what to expect). It is **not** a company SLA, not a bug bounty, and not a promise of response time.

This project has not undergone third-party security audit and is not intended for mainnet use.

It is not designed to safeguard real funds; use it only in local/test/demo environments.

---

## Reporting a vulnerability

If you believe you found a security issue:
- Prefer a **minimal** report with reproduction steps, affected component, and impact.
- If the issue is sensitive, **avoid** publishing full exploit details in a public issue.

Recommended channel:
- If GitHub Security Advisories is enabled: use it.
- Otherwise: open a GitHub Issue titled **[SECURITY] ...** with redacted details, and we can continue privately as needed.

---

## Scope & expectations

### In scope
- Smart contracts in `contracts/` (e.g., access control, reentrancy, unsafe token transfer patterns).
- Frontend code in `frontend/` (e.g., unsafe transaction construction, leaking secrets).
- CI/build scripts that could cause supply-chain risk within this repo.

### Out of scope
- Issues that require a full protocol redesign to be "real DeFi production", such as:
  - Price oracles, liquidation engine, interest accrual, multi-asset collateral.
- Third-party systems (wallet providers, RPC endpoints, MetaMask itself).

### Response
- This repo does not provide a guaranteed SLA. Best-effort triage and fixes.
- Valid reports may be fixed with minimal, targeted patches consistent with the assignment scope.

---

## Dependency audit posture

This repo separates **production runtime** and **dev toolchain** dependencies:
- Production-only audit (recommended): `npm run audit:prod`
- Full audit (includes dev tools like Hardhat): `npm run audit:all`

Rationale:
- `npm audit --omit=dev` reflects the *runtime* security posture.
- Full `npm audit` often flags transitive vulnerabilities in dev tooling. Fixes frequently require **breaking upgrades** (`npm audit fix --force`), which we avoid in an assignment repo unless there is a strong reason.

### Current audit results (snapshot)

- Production runtime deps: `npm run audit:prod` reports **0 vulnerabilities**.
- Full graph (`npm run audit:all`) may still report **low-severity** findings from the **dev toolchain** (Hardhat / legacy crypto deps). These do not ship to the frontend runtime bundle.

Mitigations applied (non-breaking):
- We use `npm overrides` in `package.json` to patch selected transitive dependencies (e.g., `cookie`, `tmp`, `undici`) without changing the assignment toolchain surface.
- We validate toolchain stability by re-running `npm run ci:local` after any override changes.

Known limitation:
- Some low-severity advisories (e.g., `elliptic` in old dependency paths) can have **no fix available** without a breaking upgrade of the Hardhat ecosystem. We treat this as **out of scope for the assignment** unless the toolchain vendor provides a compatible fix.

---

## Smart contract notes

Baseline hardening applied (assignment-scope):
- `Ownable` admin controls
- `Pausable` emergency stop
- `ReentrancyGuard` on state-changing functions
- `SafeERC20` for token transfers

Important boundary:
- The protocol is intentionally **single-asset** for the assignment. It does not implement oracle/liquidation/interest accrual.

---

## Coordinated disclosure

Please allow time for maintainers to triage and patch before any public disclosure.
