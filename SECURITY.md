# Security Policy / 安全说明

This repository is a coding assignment / demo project. The goal of this document is **clear communication** (how to report, what’s in scope, what to expect). It is **not** a company SLA, not a bug bounty, and not a promise of response time.

This project has not undergone third-party security audit and is not intended for mainnet use.

It is not designed to safeguard real funds; use it only in local/test/demo environments.

本仓库是编程作业/演示项目。本文档用于**清晰沟通**（如何上报、范围边界、预期），**不**代表公司级 SLA、**不**提供漏洞赏金、**不**承诺响应时限。

---

## Reporting a vulnerability / 漏洞上报

If you believe you found a security issue:
- Prefer a **minimal** report with reproduction steps, affected component, and impact.
- If the issue is sensitive, **avoid** publishing full exploit details in a public issue.

如果你认为发现了安全问题：
- 建议提供**最小可复现**信息：复现步骤、影响组件、潜在影响。
- 若属于敏感问题，**避免**在公开 Issue 中直接披露完整利用细节。

Recommended channel / 推荐渠道：
- If GitHub Security Advisories is enabled: use it.
- Otherwise: open a GitHub Issue titled **[SECURITY] ...** with redacted details, and we can continue privately as needed.

---

## Scope & expectations / 范围与预期

### In scope / 在范围内
- Smart contracts in `contracts/` (e.g., access control, reentrancy, unsafe token transfer patterns).
- Frontend code in `frontend/` (e.g., unsafe transaction construction, leaking secrets).
- CI/build scripts that could cause supply-chain risk within this repo.

### Out of scope / 不在范围内
- Issues that require a full protocol redesign to be “real DeFi production”, such as:
  - Price oracles, liquidation engine, interest accrual, multi-asset collateral.
- Third-party systems (wallet providers, RPC endpoints, MetaMask itself).

### Response / 响应方式
- This repo does not provide a guaranteed SLA. Best-effort triage and fixes.
- Valid reports may be fixed with minimal, targeted patches consistent with the assignment scope.

---

## Dependency audit posture / 依赖审计口径

This repo separates **production runtime** and **dev toolchain** dependencies:
- Production-only audit (recommended): `npm run audit:prod`
- Full audit (includes dev tools like Hardhat): `npm run audit:all`

Rationale / 原因：
- `npm audit --omit=dev` reflects the *runtime* security posture.
- Full `npm audit` often flags transitive vulnerabilities in dev tooling. Fixes frequently require **breaking upgrades** (`npm audit fix --force`), which we avoid in an assignment repo unless there is a strong reason.

### Current audit results (snapshot) / 当前审计结果（快照）

This section documents what we actually observed in this repository at the time of writing.

- Production runtime deps: `npm run audit:prod` reports **0 vulnerabilities**.
- Full graph (`npm run audit:all`) may still report **low-severity** findings originating from the **dev toolchain** (Hardhat / legacy crypto deps). These do not ship to the frontend runtime bundle.

Mitigations applied (non-breaking) / 已应用的非破坏性缓解：
- We use `npm overrides` in `package.json` to patch selected transitive dependencies (e.g., `cookie`, `tmp`, `undici`) without changing the assignment toolchain surface.
- We validate toolchain stability by re-running `npm run ci:local` after any override changes.

Known limitation / 已知限制：
- Some low-severity advisories (e.g., `elliptic` in old dependency paths) can have **no fix available** without a breaking upgrade of the Hardhat ecosystem. We treat this as **out of scope for the assignment** unless the toolchain vendor provides a compatible fix.

---

## Smart contract notes / 合约安全说明

Baseline hardening applied (assignment-scope):
- `Ownable` admin controls
- `Pausable` emergency stop
- `ReentrancyGuard` on state-changing functions
- `SafeERC20` for token transfers

Important boundary / 关键边界：
- The protocol is intentionally **single-asset** for the assignment. It does not implement oracle/liquidation/interest accrual.

---

## Coordinated disclosure / 协调披露

Please allow time for maintainers to triage and patch before any public disclosure.

请给予维护者时间进行确认与修复，再进行公开披露。
