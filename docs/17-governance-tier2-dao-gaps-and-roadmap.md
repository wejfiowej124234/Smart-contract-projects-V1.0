# Governance Tier-2: DAO Gaps & Roadmap (Top-Tier Requirements)

This document captures the **next layer** of governance concerns that **top-tier / institutional DAOs** address beyond the baseline in [16-institutional-dao-governance.md](16-institutional-dao-governance.md). It is a **gap analysis and design roadmap**, not a commitment to implement everything in code immediately.

---

## 1. 治理升级路径的「不可锁死风险」（Critical）

**Audit question**: If Governor or Timelock is upgraded to a broken implementation, can the DAO recover?

### Current state

- Governor self-upgrade of parameters (voting delay/period, threshold, quorum) via proposals.
- Timelock as sole executor; no separate “upgrade timelock” or break-glass path.
- **EmergencyModule**: single **guardian** (immutable) can call `emergencyPause(pool)` only; no power to change Governor/Timelock.

### Risk

- **Permanent lock**: A bad Governor/Timelock upgrade could make all future proposals unexecutable → DAO cannot recover through normal governance.

### Target (top-tier)

| Requirement | Description |
|-------------|-------------|
| **Break-glass path** | A defined emergency recovery path that does **not** depend on the current Governor/Timelock (e.g. multi-sig can replace Timelock admin or restore a known-good implementation). |
| **Multi-sig temporary guardian** | Guardian used **only for disaster recovery** (e.g. emergency pause); ideally a multi-sig, not a single EOA. |
| **Upgrade timelock ≥ normal timelock** | Governor/Timelock upgrades (or critical parameter changes) use a **longer** delay than ordinary parameter proposals, so the community has more time to react. |

### Design options

1. **Separate Upgrade Timelock**: A second Timelock with `minDelay` strictly greater than the governance Timelock; only upgrade proposals use it. Requires a Governor extension that routes “upgrade” proposals to the long timelock.
2. **Timelock admin as multi-sig**: TimelockController has an optional admin; that admin can cancel operations or (if designed) recover. Keep admin as a multi-sig, not the Governor.
3. **Break-glass in docs and ops**: Document that “recovery = multi-sig (e.g. foundation) uses Timelock admin or ProxyAdmin owner to restore a known-good implementation”; implement only the minimal contracts (e.g. current Guardian for pause), rest in runbooks and legal/ops.
4. **Guardian = multi-sig**: Deploy EmergencyModule with `guardian = multisig`; scope remains only `emergencyPause(pool)` (no Governor/Timelock change). Already supported by current contract.

### Current implementation

- **Break-glass (narrow)**: Guardian can call `EmergencyModule.emergencyPause(pool)` → pool pauses; supply/borrow/withdraw/repay revert until unpause. Unpause remains with Pool PAUSER (e.g. deployer or later transferred to Timelock). This does **not** recover a broken Governor/Timelock.
- **Upgrade timelock hierarchy**: Not implemented. Profile has a single `timelockMinDelaySeconds` (e.g. 60 local, 86400 mainnet). Recommendation: for mainnet, use a **longer** delay for any proposal that changes Governor/Timelock (e.g. via policy: such proposals use a separate, longer-delay timelock or a higher `minDelay` in a dedicated Timelock).

**Action**: Document in runbook that (1) Guardian is for **pool emergency pause only**; (2) Governor/Timelock recovery is via Timelock admin or ProxyAdmin owner (multi-sig); (3) upgrade timelock ≥ normal timelock is a policy/design requirement for mainnet.

### Break-glass and recovery runbook (short)

| Scenario | Who | Action |
|----------|-----|--------|
| Oracle anomaly / exploit in progress | Guardian (single EOA or multi-sig) | Call `EmergencyModule.emergencyPause(pool)` to pause the pool. |
| Pool paused, need to resume | PAUSER (e.g. deployer or Timelock) | Call `LendingPoolImpl.unpause()`. |
| Governor or Timelock upgraded to broken impl | Timelock admin or ProxyAdmin owner (must be multi-sig in prod) | Use admin/owner to cancel bad ops, or upgrade proxy to known-good implementation; document in legal/ops. |
| Upgrade of Governor/Timelock (planned) | DAO | Prefer a **longer** timelock delay for that proposal (separate timelock or policy). |

---

## 2. 提案执行的 Gas DoS / Queue 堵塞风险

**Real-world issue**: Proposals too large → execute runs out of gas; timelock queue piles up → governance stalls.

### Current state

- OZ default: no limit on number of actions per proposal; no explicit batch size or queue cleanup.
- Execution via `TimelockController.executeBatch()`; one revert reverts all.

### Target (large-protocol grade)

| Requirement | Description |
|-------------|-------------|
| **Max actions per proposal** | Cap the number of `targets`/`calldatas` (e.g. ≤ 10) to bound execute gas and complexity. |
| **Batch execution strategy** | For very large changes, split into multiple proposals (e.g. by reserve or by function) instead of one huge proposal. |
| **Expired queue cleanup** | Ability to cancel or mark as expired operations that passed ETA but were never executed (e.g. to unclutter queue). |

### Design options

1. **Governor wrapper or modifier**: Override `propose()` to require `targets.length <= MAX_ACTIONS` (e.g. 10); revert otherwise.
2. **Governance policy**: No code change; document “max N actions per proposal” and rely on proposal templates / frontend validation.
3. **Timelock cancel**: OZ TimelockController already has `cancel(bytes32 id)` for proposers/cancellers; document that expired-but-not-executed operations can be cancelled to free queue.
4. **Simulation before queue**: Run `execute` as staticCall (or fork) before queueing; reject if gas or revert risk is too high (off-chain or bot).

### Current implementation

- No on-chain cap on proposal size. Recommendation: add a constant and a check in a custom Governor extension, or enforce in UI and runbook.

**Action**: (1) Document “max actions per proposal” and “prefer multiple proposals over one huge one”; (2) optionally add `MAX_PROPOSAL_ACTIONS` in a Governor extension and revert in `propose` when `targets.length > MAX_PROPOSAL_ACTIONS`.

---

## 3. 投票机制的博弈攻击（Game Theory）

**Institutional DAO focus**: Low participation, whale borrow-to-vote, delegation centralization → governance capture or instability.

### Current state

- ERC20Votes + snapshot at proposal creation; `votingDelay >= 1` to mitigate same-block flash loan.
- Fixed quorum (e.g. 4%); no vote escrow, no lock, no dynamic quorum.

### Target (game-theoretic robustness)

| Requirement | Description |
|-------------|-------------|
| **Dynamic quorum** | Quorum that depends on participation (e.g. OpenZeppelin GovernorVotesQuorumFraction with time-based or participation-based overrides) to avoid “low participation = easy pass”. |
| **Vote escrow / staking lock** | Voting power from locked/staked tokens (e.g. ve-token) to reduce “borrow, vote, return” and align with long-term interest. |
| **Vote delay unlock** | After voting, some cooldown before tokens can be moved again (harder with plain ERC20; natural with escrow). |

### Design options

1. **Dynamic quorum extension**: Use or implement a quorum that increases with time or with past participation (e.g. OZ GovernorVotesQuorumFraction is fixed; custom extension for “quorum = max(base, f(participation))”).
2. **ve-token / lock**: Replace or wrap governance token with a “vote-escrow” token (lock period → voting power); requires new token/contract design.
3. **Delegation and caps**: Document risks of delegation concentration; consider (off-chain) delegate diversity and caps in governance policy.

### Current implementation

- Fixed quorum; no escrow or lock. **Technical security** (snapshot, delay) is in place; **game-theoretic / economic** hardening is a protocol-level design choice.

**Action**: Document in “Governance risks” that (1) low participation can pass proposals; (2) whale can borrow tokens for snapshot then return (mitigated by delay but not by lock); (3) delegation concentration is a policy/community concern. Optionally add dynamic quorum in a future Governor extension.

---

## 4. 参数变更的系统性风险传播

**Audit question**: After a parameter change, is the **whole lending system** still safe (liquidation, rates, stress)?

### Current state

- We verify “proposal executes correctly” (e.g. LTV set to 76).
- We do **not** automatically run risk simulation or stress tests on the **economic** impact of parameter changes.

### Target (economic-system correctness)

| Requirement | Description |
|-------------|-------------|
| **Risk simulation** | Before or after parameter change: simulate liquidation thresholds, interest rate curves, utilization under stress. |
| **Stress tests** | Extreme market scenarios (e.g. price drop 50%, utilization 100%) to see impact of new LTV/LT/rates. |
| **Parameter diff approval** | Formal process: parameter diff (old vs new) + impact note + simulation/stress result before proposal goes live. |

### Design options

1. **Off-chain pipeline**: Script or CI that, given a parameter diff (e.g. LTV 75→76), runs a simulation (e.g. fork + setReserveData + run liquidation/rate logic) and outputs metrics; required before “blessing” a proposal.
2. **Invariant tests**: Extend Hardhat invariants to include “after setLTV/setLT, no user can be liquidated who wasn’t before at same collateral/debt” (or document exceptions).
3. **Governance checklist**: In docs, require “parameter change proposal” to attach (link) risk note and, if available, simulation hash.

### Current implementation

- Governance correctness (execute, revert, audit log) is covered; **economic** correctness is not automated.

**Action**: Add a “Parameter change risk” section in runbook: (1) recommend risk simulation (e.g. script or spreadsheet) for LTV/LT/rate changes; (2) recommend stress test scenarios; (3) optional: add `scripts/governance/risk-simulate-params.ts` that forks and runs basic liquidation/rate checks for a given param set.

---

## 5. 治理与预言机（Oracle）的联动风险

**Real-world pitfall**: DAO changes params → oracle misbehaves or is upgraded incorrectly → cascade liquidations or wrong pricing.

### Current state

- Pool uses oracle (e.g. Chainlink adapter / PriceBoundGuard) for pricing.
- Configurator (admin = Timelock) can change reserve params; oracle upgrade path may be separate (e.g. oracle owned by same or different admin).

### Target (oracle–governance linkage)

| Requirement | Description |
|-------------|-------------|
| **Oracle upgrade on separate / long timelock** | Oracle contract or feed changes go through a dedicated (preferably longer) timelock so they are not mixed with routine param changes. |
| **Price deviation protection** | Already partially present (PriceBoundGuard, bounds); ensure DAO cannot disable or bypass them in a single low-visibility proposal. |
| **Emergency pause on oracle anomaly** | If oracle returns stale or out-of-bounds price, protocol can pause (e.g. guardian emergency pause) or pause liquidations only until fixed. |

### Design options

1. **Oracle owned by Timelock with longer delay**: Separate Timelock for “oracle upgrade” with `minDelay` ≥ main governance timelock; only oracle-related proposals use it.
2. **Liquidation pause**: Add a “pause liquidations only” (reserve or global) so that in case of oracle issues, borrowing/supply can be paused but liquidations are blocked until oracle is fixed.
3. **Document linkage**: Runbook states that (1) oracle upgrade = critical path, use long timelock; (2) parameter proposals that affect liquidation (LTV, LT) should consider oracle robustness; (3) guardian can emergency pause pool (including liquidation) via existing EmergencyModule.

### Current implementation

- EmergencyModule.emergencyPause(pool) pauses the whole pool (supply/borrow/withdraw/repay and effectively liquidation path that uses pool state). Oracle upgrade path is deployment-specific.

**Action**: Document (1) oracle upgrade = critical, recommend separate/long timelock; (2) price bounds and guardian pause as mitigation for oracle anomaly; (3) any “pause liquidations only” as future enhancement if needed.

---

## 6. 法律与合规层的 DAO 结构

**Institutional reality**: Legal entity (foundation, LLC), multi-sig vs DAO permission split, audit disclosure.

### Current state

- On-chain: Governor + Timelock + Guardian; no legal layer in code.
- No formal “DAO legal entity” or “audit disclosure obligation” in repo.

### Target (real-world DAO)

| Requirement | Description |
|-------------|-------------|
| **DAO legal entity** | Foundation or LLC that holds multi-sig, holds IP, pays audits, and interfaces with regulators where needed. |
| **Multi-sig vs DAO** | Clear split: what is “governance” (on-chain proposals) vs “operations” (multi-sig for treasury, upgrade recovery, guardian). |
| **Audit disclosure** | Public audit reports and disclosure policy (what is disclosed, when). |

### Design options

1. **Document only**: Runbook or separate “Legal & compliance” doc describing (1) foundation/LLC as operator; (2) multi-sig as guardian and/or Timelock admin; (3) audit disclosure policy.
2. **On-chain hints**: No code change; deployment table or docs list “Foundation multi-sig” as guardian or admin where applicable.

### Current implementation

- Purely technical DAO; legal structure is outside the codebase.

**Action**: Add a short “Legal & compliance (out of scope of code)” section in docs: (1) recommend DAO legal entity and multi-sig for guardian/recovery; (2) recommend clear governance vs operations split; (3) recommend audit disclosure policy; (4) state that this repo covers technical governance only.

---

## 7. 长期治理可持续性（最深层）

**Long-term concern**: Participation decline, governance token value capture, DAO zombification.

### Current state

- GOV token: ERC20Votes, used only for voting; no fee flow, no buyback, no staking reward in protocol.
- No formal delegation representative system beyond “delegate to self or other”.

### Target (sustainability)

| Requirement | Description |
|-------------|-------------|
| **Fees → buyback / dividend / staking** | Protocol revenue (e.g. interest spread, liquidation bonus) flows to treasury or to GOV stakers/vote-escrow holders. |
| **Governance incentives** | Incentives for participation (e.g. rewards for voting, for delegates). |
| **Delegate representative system** | Formalized delegates (e.g. “protocol delegates”) with expectations and possibly compensation. |

### Design options

1. **Treasury and revenue**: Route a share of protocol fees to a treasury contract; governance decides allocation (buyback, dividend, grants). Requires economic design and possibly new contracts.
2. **Staking / ve-token**: Lock GOV for ve-GOV; ve-GOV determines voting power and optionally receives fees. Protocol-level tokenomics.
3. **Document**: Governance sustainability is “protocol economics”, not just code; document that (1) fee → treasury/buyback and (2) delegation/representatives are design choices for the DAO.

### Current implementation

- No fee-to-GOV or staking in this repo. Purely “technical DAO”; sustainability is product/economic design.

**Action**: Add “Governance sustainability (protocol economics)” subsection: (1) state that long-term participation and token value are protocol-level; (2) list common levers (fees, buyback, staking, delegate program); (3) no code change in this baseline.

---

## Summary: Priority and Ownership

| # | Area | Criticality | Current | Suggested next step |
|---|------|-------------|--------|---------------------|
| 1 | Upgrade lock / break-glass | **Critical** | Guardian = emergency pause only; no Governor recovery | Document break-glass and upgrade timelock ≥ normal; consider multi-sig guardian |
| 2 | Gas DoS / queue | High | OZ default | Document max actions; optional Governor cap; document queue cancel |
| 3 | Voting game theory | High | Snapshot + delay only | Document risks; optional dynamic quorum / ve-token later |
| 4 | Param systemic risk | High | Not automated | Runbook: risk simulation + stress test; optional sim script |
| 5 | Oracle–governance | High | Guardian can pause pool | Document oracle timelock and liquidation-pause option |
| 6 | Legal / compliance | Medium | None in repo | Doc: legal entity, multi-sig vs DAO, audit disclosure |
| 7 | Sustainability | Protocol economics | No fee→GOV | Doc: sustainability levers; no code in baseline |

This document is the **Tier-2 governance gap and roadmap**. Implementations can be phased: first documentation and runbook updates (break-glass, timelock hierarchy, max actions, oracle linkage, legal, sustainability), then optional code (Governor action cap, dynamic quorum, risk simulation script) as the protocol targets mainnet and institutional use.

For **protocol-level** maturity (real capital scale, formal recovery paths, gas/queue resilience, risk simulation pipeline, oracle–liquidation tiered control, cross-chain consistency, governance economics & legal), see **[18-governance-protocol-level-dao.md](18-governance-protocol-level-dao.md)**.
