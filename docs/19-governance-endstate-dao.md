# End-State DAO Governance (Long-Term Operation & Financing)

This document defines the **end-state** governance layer that sits on top of [Protocol-level DAO](18-governance-protocol-level-dao.md). It adds **operational** and **long-term sustainability** so the system is not only technically complete but **capable of stable long-term operation and financing**—the final maturity stage: **End-State DAO Governance**.

---

## Governance maturity model (full stack)

| Layer | Doc | Scope |
|-------|-----|--------|
| **Baseline** | [16](16-institutional-dao-governance.md) | Self-governed params, lifecycle verification, snapshot security, audit evidence. |
| **Tier-2** | [17](17-governance-tier2-dao-gaps-and-roadmap.md) | Break-glass, Gas/queue, game theory, param risk, oracle, legal, sustainability gaps. |
| **Protocol-level** | [18](18-governance-protocol-level-dao.md) | Recovery paths, gas/queue resilience, risk simulation, oracle–liquidation tiers, cross-chain, economics & legal. |
| **End-state** | This doc (19) | Dual approval & incident response, MEV & gradual activation, treasury & budget, minimal consensus & immutable path, cross-cycle incentives & delegates. |

---

## 1. 链上/链下双重审批与事故响应机制

### 1.1 Dual approval (on-chain + off-chain)

- **Off-chain first**: For material or contentious changes, run a **temperature check** or **Snapshot-style vote** (off-chain, gas-free) before submitting an on-chain proposal. Outcome is not binding but informs whether to proceed and with what parameters.
- **On-chain binding**: Only the **on-chain** proposal (Governor propose → vote → queue → execute) is binding. Off-chain is advisory and reduces risk of on-chain failure or community split.
- **Dual-gate for critical path**: For **critical** changes (Governor/Timelock upgrade, oracle upgrade, large treasury allocation), require both (1) off-chain consensus (e.g. Snapshot pass + minimum discussion period) and (2) on-chain proposal with **longer timelock** (see [18](18-governance-protocol-level-dao.md)). Document in governance policy.

### 1.2 Incident response

- **Severity levels**: Define **P0 (critical)** / **P1 (high)** / **P2 (medium)** / **P3 (low)**. P0 = active exploit or oracle failure affecting user funds; P1 = serious bug or risk; P2/P3 = operational or non-urgent.
- **Response matrix**:
  - **P0**: Guardian **immediately** can `emergencyPause(pool)`. Post-incident: root cause, post-mortem, and (if needed) governance proposal to fix or upgrade. Multi-sig and DAO comms activated.
  - **P1**: Time-bound decision (e.g. 24–48 h): either Guardian pause (if risk to funds) or governance proposal with short timelock if policy allows. Document in runbook.
  - **P2/P3**: Normal governance or ops; no emergency pause unless escalated.
- **Communication**: Public incident channel (e.g. Discord/Telegram) and status page; post-mortem published after P0/P1. No code in repo; runbook and ops ownership.

### 1.3 Runbook

- **Dual approval**: “Critical proposals: Snapshot (or equivalent) first → pass + discussion period → on-chain proposal with long timelock.”
- **Incident**: See [runbooks/incident-response.md](runbooks/incident-response.md): severity definitions, who can pause, who decides, comms template, post-mortem template.

---

## 2. MEV 与真实资金规模下的参数渐进生效与执行保护

### 2.1 MEV and execution protection

- **Execution visibility**: Timelock execution is public (anyone can call `execute` after ETA). At scale, this can attract **MEV** (e.g. front-running the execution with positions that benefit from the parameter change). Mitigations:
  - **Execution window**: Execute in a narrow window (e.g. low-activity hour) or use **private RPC / MEV-protected** submission so the executor is not front-run. Policy and ops; no mandatory code.
  - **Parameter delay**: New parameters do **not** take effect in the same block as execution; they take effect after a **grace period** (e.g. N blocks or M seconds). Reduces “execute then immediately trade” MEV. Requires configurator or pool to support “effective block” or “effective time”; document as design option.
- **Real capital scale**: At large TVL, (1) **pre-execution simulation** (already in [18](18-governance-protocol-level-dao.md)), (2) **gradual activation** (see below), (3) **rate limits or caps** on single-proposal impact if needed (e.g. max change in LTV per proposal). Latter can be policy or future contract constant.

### 2.2 Gradual parameter activation

- **Design**: Sensitive parameters (e.g. LTV, LT) can be changed in **stages** rather than one jump. Example: target LTV 80% is achieved by proposals 76% → 78% → 80% with a **cooldown** (e.g. 1 proposal per week for that param) or by **time-delayed effectiveness** (proposal sets “LTV = 80% effective at block X” where X is current + 1 week).
- **Implementation options**: (1) **Policy only**: Governance agrees to multi-proposal staging. (2) **Contract**: Configurator or pool supports `setLTVEffectiveAt(asset, value, effectiveBlock)` and reads “current LTV” as the value whose effectiveBlock ≤ block.number; execute sets a future effective block. (3) **Hybrid**: Policy staging + optional contract support in a future upgrade.
- **Documentation**: Runbook states that for large param changes at scale, prefer staged proposals or delayed effectiveness; MEV mitigation via execution window or private submission.

### 2.3 Runbook

- “At scale: pre-execution simulation; consider staged param changes or delayed effectiveness; execute via MEV-protected or private RPC when possible.”

---

## 3. 国库与预算治理制度

### 3.1 Treasury and budget governance

- **Treasury contract**: A **Treasury** (or multisig) holds protocol-owned assets (e.g. protocol fees, surplus). Governance decides **allocations** (grants, ops, buyback, insurance, etc.) via proposals that target the Treasury (e.g. `Treasury.transfer(token, to, amount)`). Treasury can be a simple contract (owner = Timelock) or a multisig (controlled by DAO via governance).
- **Budget framework**: Define **budget cycles** (e.g. quarterly). Each cycle:
  - **Approved budget**: Governance passes one or more proposals that authorize spending up to X per category (e.g. ops, grants, marketing). Proposals that exceed the approved budget for a category require a new budget proposal or amendment.
  - **Transparency**: All allocations are on-chain (tx) or recorded (e.g. proposal ID + amount + recipient). Optional: dashboard or report that aggregates by cycle and category.
- **Vesting and schedules**: For large allocations (e.g. grants, incentives), use **vesting** (linear or cliff) so that funds are released over time. Can be implemented in Treasury or a separate Vesting contract; governance approves the vesting schedule.

### 3.2 Implementation

- **Minimal code**: This repo can define an **interface** `ITreasury` (e.g. `transfer(address token, address to, uint256 amount)`) and a **simple Treasury** implementation (owner = Timelock, onlyOwner transfer). Full budget logic (categories, caps) can be policy or a future module.
- **Runbook**: “Treasury allocations require governance proposal. Budget cycle = N months; category caps documented; large grants use vesting.”

### 3.3 Documentation

- Add **Treasury governance** runbook: who can propose, how budget is approved, how to request a grant, vesting policy. See [runbooks/treasury-and-budget.md](runbooks/treasury-and-budget.md).

---

## 4. 社区共识最小化与最终不可升级路径设计

### 4.1 Minimal consensus

- **Critical path only on-chain**: Only decisions that **must** be trustless and on-chain (parameter changes, upgrades, treasury allocation, guardian change) go through the full Governor flow. Other decisions (e.g. working group mandates, content, partnerships) can be **off-chain** or **multisig** with a mandate from Snapshot or similar. This minimizes governance fatigue and keeps chain usage for what truly needs consensus.
- **Thresholds**: Critical vs non-critical can be defined in governance policy (e.g. “any change to LTV/LT/oracle/Governor = critical; rest = standard or off-chain”).

### 4.2 Final immutable path (no-upgrade option)

- **Design**: After a **maturity period** (e.g. 2+ years of mainnet, no critical bugs, community vote), the DAO can choose a **final state**:
  - **Option A**: Renounce upgradeability for core contracts (e.g. ProxyAdmin owner = zero address or burn, or deploy **non-upgradeable** clones and migrate state). Governance continues for **parameters only** (if the core exposes parameter setters owned by Governor/Timelock) but **no more implementation upgrades**.
  - **Option B**: Keep upgradeability but with **very long** timelock (e.g. 6–12 months) for any upgrade proposal, so that upgrades are possible but extremely slow and visible.
- **Documentation**: Runbook or ADR that describes (1) what “final immutable” means for this protocol, (2) under what conditions the DAO can vote to renounce upgrades or deploy immutable core, (3) what remains governable (e.g. params, treasury) after that. No mandatory code; this is a **policy and deployment choice**.

### 4.3 Runbook

- “Critical path = on-chain; rest can be off-chain or mandated multisig. Final immutable path: after maturity, DAO can vote to renounce upgrades or deploy immutable core; document in ADR.”

---

## 5. 跨周期治理激励与代表制度

### 5.1 Cross-cycle incentives

- **Voting incentives**: Optional **rewards** for participation (e.g. per-proposal reward in GOV or stablecoin for voters who voted with the majority or for delegates who met a minimum participation). Implemented off-chain (merkle drop) or via a staking/voting contract; design is protocol-level.
- **Delegation incentives**: **Delegates** (recognized representatives) may receive a **delegate compensation** (e.g. from treasury) for meeting criteria (participation, reporting). Amount and criteria are governance-decided.
- **Long-term alignment**: Incentives should align with **long-term** health (e.g. lock or vest GOV rewards so that short-term vote-selling is less attractive). Optional: ve-token or lock-up for rewards.

### 5.2 Representative / delegate system

- **Recognition**: DAO maintains a **list of recognized delegates** (e.g. via Snapshot or on-chain registry). Criteria: self-nomination, minimum stake, or governance approval. No mandatory code; can be a simple registry contract (address → metadata) owned by Governor.
- **Expectations**: Delegates are expected to (1) vote on proposals (or explain abstention), (2) publish short reasoning for major votes, (3) participate in discussion. Governance can set minimum participation (e.g. 80% of proposals) for compensation or renewal.
- **Term and renewal**: Optional **term limits** (e.g. 1 year) with renewal by governance or by re-delegation. Prevents permanent capture by a fixed set of delegates.

### 5.3 Documentation

- **Governance policy**: “Delegate program: recognition criteria, compensation (if any), participation expectations, term/renewal. Voting incentives: design and funding from treasury.” Implementation can be phased (first recognition list, then compensation proposals).

---

## Summary: End-state checklist

| # | Area | Operational / policy | Optional code / tooling |
|---|------|----------------------|--------------------------|
| 1 | Dual approval & incident response | Snapshot-first for critical; severity matrix; comms; post-mortem | Runbook: `incident-response.md` |
| 2 | MEV & gradual activation | Execution window; staged/delayed params; MEV-protected execution | Configurator: delayed effectiveness (future) |
| 3 | Treasury & budget | Budget cycles; category caps; vesting for large grants | `ITreasury` + simple Treasury; `treasury-and-budget.md` |
| 4 | Minimal consensus & immutable path | Critical = on-chain; rest off-chain; ADR for final immutable | None (deployment choice) |
| 5 | Cross-cycle incentives & delegates | Delegate list; compensation; participation expectations; term/renewal | Delegate registry (optional); incentive contracts (optional) |

---

## Runbook (end-state)

| Goal | Action |
|------|--------|
| Critical proposal | Off-chain temperature check / Snapshot → pass + discussion → on-chain with **long timelock**. |
| Incident P0/P1 | Guardian pause if funds at risk; activate comms; post-mortem after. |
| Execution at scale | Pre-execution simulation; staged or delayed params; execute via MEV-protected/private RPC when possible. |
| Treasury allocation | Governance proposal → Treasury transfer (or vesting); within budget cycle and category. |
| Final immutable | After maturity, governance can vote to renounce upgrades or deploy immutable core; document in ADR. |
| Delegates & incentives | Maintain delegate list; governance approves compensation and criteria; cross-cycle incentive design in policy. |

With [16](16-institutional-dao-governance.md) through [18](18-governance-protocol-level-dao.md) and this document, the **overall governance maturity** reaches **End-State DAO Governance**: technically complete, operationally robust, and **capable of long-term stable operation and financing**. The **Ultra-Endgame** layer (post-immutable risk & succession, sovereignty, entropy, civilization-scale, governance extinction) is **philosophical and strategic**, not an implementation checklist: see **[20-governance-ultra-endgame.md](20-governance-ultra-endgame.md)**.
