# Protocol-Level DAO Governance (Real Capital Scale)

This document defines the **protocol-level** governance layer that sits on top of the [Institutional-grade baseline](16-institutional-dao-governance.md) and the [Tier-2 gap roadmap](17-governance-tier2-dao-gaps-and-roadmap.md). Together they target **Protocol-level DAO Governance** capable of carrying **real capital** and passing top-tier audits.

---

## Governance maturity model

| Layer | Doc | Scope |
|-------|-----|--------|
| **Baseline** | [16](16-institutional-dao-governance.md) | Self-governed params, full lifecycle verification, snapshot security, execution isolation, audit evidence. |
| **Tier-2** | [17](17-governance-tier2-dao-gaps-and-roadmap.md) | Gap analysis: break-glass, Gas/queue, game theory, param risk, oracle, legal, sustainability. |
| **Protocol-level** | This doc (18) | Formal unrecoverable-upgrade protection, gas/queue resilience, dynamic博弈防御, risk simulation pipeline, oracle–liquidation tiered control, cross-chain/multi-domain consistency, governance economics & legal sustainability. |

---

## 1. 不可恢复升级的正式防护与多层恢复路径

### 1.1 Formal protection

- **On-chain**: Governor enforces **max actions per proposal** (`MAX_PROPOSAL_ACTIONS`) so that a single malicious or buggy proposal cannot unboundedly extend execution or queue.
- **Policy**: Any upgrade of Governor, Timelock, or core governance contracts MUST use a **longer** timelock than normal parameter proposals (separate timelock or profile with higher `minDelay`). Documented in runbook; enforced by deployment/ops.
- **Recovery paths** (multi-layer, not dependent on a single point of failure):

| Layer | Owner / Actor | Scope | Use only for |
|-------|----------------|-------|----------------|
| **L1** | Guardian (EmergencyModule) | Pool pause | Oracle anomaly, exploit in progress; does **not** touch Governor/Timelock. |
| **L2** | Timelock admin (optional) | Cancel scheduled ops, or (if designed) recover executor | Disaster recovery when Governor/Timelock is broken. **Must be multi-sig in production.** |
| **L3** | ProxyAdmin owner | Upgrade implementation of proxies (e.g. Governor, Pool) | Restore known-good implementation. **Must be multi-sig in production.** |
| **L4** | Upgrade timelock | Longer delay for Governor/Timelock upgrade proposals | Gives community time to react; reduces one-shot upgrade risk. |

### 1.2 Verification

- Run **recovery path verification** periodically (e.g. pre-mainnet, after any governance deploy): script checks that Guardian is set, Timelock admin (if any) and ProxyAdmin owner are non-zero and (in ops) multi-sig. See `scripts/governance/verify-recovery-paths.ts`.

### 1.3 Runbook (concise)

- **Emergency (pool)**: Guardian → `EmergencyModule.emergencyPause(pool)`.
- **Unpause**: PAUSER → `LendingPoolImpl.unpause()`.
- **Governor/Timelock broken**: Timelock admin or ProxyAdmin owner (multi-sig) → cancel bad ops or upgrade proxy to known-good implementation.
- **Planned Governor/Timelock upgrade**: Use long-delay timelock or policy-mandated longer delay.

---

## 2. 提案与执行的气体/队列拥塞容错机制

### 2.1 Formal limits

- **Max actions per proposal**: `GovernorP9` enforces `targets.length <= MAX_PROPOSAL_ACTIONS` (e.g. 10). Proposals exceeding this revert at `propose()`. This bounds execute gas and complexity.
- **Queue congestion**: Use TimelockController’s existing `cancel(bytes32 id)` (by proposer/canceller) to cancel expired or obsolete scheduled operations so the queue does not grow unbounded.

### 2.2 Operational resilience

- **Pre-queue simulation**: Before queueing, run `governor.execute(...)` via static call (or fork) to assert no revert and acceptable gas. Can be done in CI or by a bot; optional script or integration in proposal UI.
- **Batching policy**: For large parameter changes (e.g. many reserves), split into multiple proposals (e.g. one per reserve or per function) rather than one oversized proposal.

### 2.3 Documentation

- Runbook: “Max N actions per proposal (see Governor constant); prefer multiple proposals for large changes; cancel expired Timelock ops when needed.”

---

## 3. 基于参与率与代币集中度的动态博弈防御

### 3.1 Design targets

- **Participation**: Avoid “low participation = easy pass” by tying quorum or pass threshold to participation (e.g. quorum floor that increases when participation is low, or minimum turnout).
- **Concentration**: Mitigate “whale borrow-to-vote” and “delegation oligarchy” via (a) voting delay (already in place), (b) optional vote escrow / lock, (c) monitoring of top-N share and delegation concentration (off-chain or view).

### 3.2 Implementation options

- **Dynamic quorum**: Custom Governor extension that overrides `quorum(blockNumber)` to return `max(baseQuorum, f(participation))` (e.g. based on prior proposal turnout). Requires historical data or snapshot of current proposal votes.
- **Concentration metrics**: Off-chain script or view that computes (1) share of supply held by top 10 addresses, (2) share of voting power delegated to top 5 delegates. Used for alerts and governance policy (e.g. “no critical upgrade if concentration &gt; X”).
- **Vote escrow / lock**: Protocol-level (ve-token or staking); not in baseline Governor. Document as optional future upgrade for stronger game-theoretic guarantees.

### 3.3 Policy

- Document in governance policy: (1) low participation and high concentration increase capture risk; (2) critical proposals (e.g. Governor/Timelock upgrade) should meet a higher effective bar (e.g. longer timelock + minimum discussion period); (3) delegate diversity and caps are community/ops concerns.

---

## 4. 参数变更前的系统性风险仿真与压力测试

### 4.1 Pipeline

- **Before** a parameter-change proposal (LTV, LT, rate params, etc.) is considered passed:
  1. **Parameter diff**: Old vs new values documented (e.g. in proposal or appendix).
  2. **Risk simulation**: Run simulation (fork or standalone script) that applies the new params and computes (e.g.) liquidation thresholds, rate curves, utilization under normal and stressed scenarios. Output: metrics (e.g. “users at risk”, max utilization).
  3. **Stress test**: Apply extreme scenarios (e.g. price −50%, utilization 100%, rate spike) and assert invariants (e.g. no unjust liquidation, protocol solvency).
  4. **Approval**: Proposal should reference or attach simulation/stress result (or hash). Governance checklist enforces “parameter change → simulation + stress” before execution.

### 4.2 Tooling

- **Script**: `scripts/governance/risk-simulate-params.ts` (or equivalent): given a param set (e.g. LTV, LT), fork at latest block, apply params, run a set of scenarios (e.g. liquidate at risk positions, compute rates), output report. Can be extended with more scenarios over time.
- **CI**: Optional gate that runs simulation for any change to risk-related config (e.g. profile LTV/LT) and fails if invariants break.

### 4.3 Documentation

- Runbook: “Parameter change proposals must have parameter diff, risk simulation result, and stress test pass (or explicit waiver with rationale).”

---

## 5. Oracle 与清算联动的分级隔离控制

### 5.1 Tiered control

| Level | Control | Owner | When |
|-------|---------|--------|------|
| **L1** | Price bounds / deviation guard | Configurator (Timelock) or oracle config | Always; reject out-of-bounds or stale prices. |
| **L2** | Pool pause (full) | Guardian | Oracle anomaly or exploit in progress; stops supply/borrow/withdraw/repay and effectively liquidation. |
| **L3** | Liquidation-only pause (optional) | Configurator or Guardian | Oracle issue but allow repay/supply; only disable liquidation until oracle fixed. Future enhancement if needed. |
| **L4** | Oracle upgrade | Separate long-delay timelock | Oracle contract or feed change; never same short timelock as routine param changes. |

### 5.2 Design rules

- **Oracle upgrade**: Use a dedicated timelock with `minDelay >= main governance timelock` (e.g. 2×). Only oracle-related proposals use it. Document in deployment and runbook.
- **Liquidation ↔ oracle**: Proposals that change LTV/LT or liquidation params must consider oracle robustness (e.g. simulation under price shock). Emergency: Guardian can full-pause pool (L2); “liquidation-only pause” (L3) is an optional future feature.

### 5.3 Documentation

- Runbook: “Oracle upgrade = critical path, long timelock only. Parameter proposals affecting liquidation must consider oracle and stress. Guardian can full-pause pool on oracle anomaly.”

---

## 6. 跨链治理与多域执行一致性

### 6.1 Scope

- **Single-chain first**: Baseline and Tier-2 assume one chain (e.g. mainnet). Governor, Timelock, and execution are on that chain.
- **Multi-chain / multi-domain**: When the protocol deploys on multiple chains or has multiple “domains” (e.g. L1 + L2, or multiple pools), two concerns arise: (1) **governance message format** (what is being decided), (2) **execution consistency** (same decision applied correctly on each domain).

### 6.2 Design (protocol-level)

- **Canonical format**: Define a **proposal payload** format (e.g. chainId, contract, selector, args, nonce) so that a single “governance decision” can be hashed and reproduced across chains. Each chain runs its own Governor/Timelock but executes the same logical action (e.g. “setLTV(asset, 76)” on chain A and chain B).
- **Execution consistency**: (1) Per-chain execution scripts or bots that listen for “approved” proposal hash and execute the corresponding tx on their chain; (2) post-execution checks (e.g. same LTV on all chains) and alerts if mismatch.
- **No single point of failure**: No single cross-chain bridge or relayer that can unilaterally execute; execution on each chain is still gated by that chain’s Timelock/Governor or by a clearly defined multi-sig that only executes after governance has passed on the “home” chain.

### 6.3 Implementation

- Document the payload format and “multi-domain execution” process in a dedicated runbook or ADR. Code can be limited to (1) a shared schema (e.g. JSON) for proposal payloads, (2) optional script that compares post-execution state across chains (e.g. LTV per chain) and reports consistency.

---

## 7. 治理经济与法律结构的长期可持续设计

### 7.1 Governance economics

- **Revenue → governance**: Protocol revenue (interest spread, liquidation bonus, fees) can be routed to a **treasury**; governance decides allocation (buyback, dividend, grants, incentives). Design is protocol-level; this repo can define a minimal treasury interface or leave it to deployment.
- **Participation incentives**: Voting rewards, delegate compensation, or other incentives are economic design choices; document as options (e.g. “fee share to ve-GOV”, “delegate program”) without mandating code in the baseline.
- **Token value and zombification**: Long-term sustainability (participation rate, token value capture, DAO activity) depends on product and economics; document that (1) treasury + allocation is the main lever, (2) delegation and representative system are policy, (3) no code change required in baseline for “sustainability” beyond what is already deployable.

### 7.2 Legal structure

- **Entity**: Recommend a **legal entity** (foundation, LLC) that (1) holds multi-sig for Guardian / Timelock admin / ProxyAdmin owner where appropriate, (2) holds IP and pays audits, (3) interfaces with regulators if needed.
- **Separation of powers**: Clear split: **on-chain governance** (proposals, vote, Timelock execute) vs **operations** (multi-sig for treasury, recovery, guardian). Document who holds which role (e.g. “Foundation multi-sig = Guardian and Timelock admin”).
- **Audit and disclosure**: Public audit reports and a **disclosure policy** (what is disclosed, when, to whom). Repo remains technical; legal/compliance is documented and owned by the DAO/entity.

### 7.3 Documentation

- Add a short **“Governance economics & legal (out of scope of code)”** section: (1) treasury and fee flow as sustainability levers; (2) legal entity and multi-sig split; (3) audit disclosure policy; (4) this repo implements technical governance only; economics and legal are DAO/entity responsibility.

---

## Summary: Protocol-level checklist

| # | Area | Formal / code | Operational / policy |
|---|------|----------------|----------------------|
| 1 | Unrecoverable upgrade | MAX_PROPOSAL_ACTIONS; verify-recovery-paths script; L1–L4 runbook | Upgrade timelock ≥ normal; multi-sig for L2/L3 |
| 2 | Gas / queue | Governor cap on actions; cancel for queue cleanup | Pre-queue simulation; batching policy |
| 3 | Game theory | Optional dynamic quorum; concentration metrics (script/view) | Participation/concentration policy; optional ve-token later |
| 4 | Param risk | risk-simulate-params script; CI gate (optional) | Parameter diff + simulation + stress before change |
| 5 | Oracle–liquidation | Tiered control (bounds, full pause, optional liquidation pause); oracle long timelock | Runbook: oracle = critical; liquidation param proposals consider oracle |
| 6 | Cross-chain / multi-domain | Payload format; optional cross-chain consistency script | Per-domain execution; consistency checks |
| 7 | Economics & legal | Treasury interface (optional); no mandatory code | Entity, multi-sig split, disclosure; sustainability levers in docs |

With [16](16-institutional-dao-governance.md) (baseline), [17](17-governance-tier2-dao-gaps-and-roadmap.md) (Tier-2 gaps), and this document (protocol-level), the **overall governance maturity** reaches **Protocol-level DAO Governance** suitable for **real capital scale** and top-tier audits. For **end-state** (dual approval, incident response, MEV & gradual activation, treasury & budget, minimal consensus & immutable path, cross-cycle incentives & delegates), see **[19-governance-endstate-dao.md](19-governance-endstate-dao.md)**.

### Runbook (protocol-level commands)

| Goal | Command |
|------|---------|
| Verify L1–L3 recovery paths | `npm run governance:verify-recovery-paths` |
| Risk simulation before param change | `npm run governance:risk-simulate-params` |
| Governor cap (on-chain) | `GovernorP9.MAX_PROPOSAL_ACTIONS` (e.g. 10); proposals with more actions revert at `propose()`. |
