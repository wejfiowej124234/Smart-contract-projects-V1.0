# Institutional-Grade DAO Governance (Mainnet-Ready)

This document describes the governance module to **Institutional-grade DAO Governance** standards: chain-upgradeable parameters, full lifecycle verification, voting snapshot security, execution failure handling, and audit evidence.

---

## 1. Governance Parameters: Chain-Upgradeable (Governor Self-Governed)

All critical governance parameters are **upgradeable on-chain only through passed proposals** (executor = Timelock). No admin key can change them unilaterally.

| Parameter | Contract / Extension | Setter | Restriction |
|-----------|---------------------|--------|-------------|
| Voting delay (blocks) | GovernorSettings | `setVotingDelay(uint256)` | `onlyGovernance` |
| Voting period (blocks) | GovernorSettings | `setVotingPeriod(uint256)` | `onlyGovernance` |
| Proposal threshold (votes) | GovernorSettings | `setProposalThreshold(uint256)` | `onlyGovernance` |
| Quorum numerator (%) | GovernorVotesQuorumFraction | `updateQuorumNumerator(uint256)` | `onlyGovernance` |
| Timelock | GovernorTimelockControl | `updateTimelock(TimelockController)` | `onlyGovernance` |

- **Executor**: `_executor()` returns the Timelock address. Only calls that go through a successful proposal execution are allowed to invoke these setters.
- **Example**: To change voting period to 500 blocks, create a proposal with `targets = [governor]`, `calldatas = [governor.interface.encodeFunctionData("setVotingPeriod", [500])]`, then vote, queue, and execute.

See script: `scripts/governance/proposal-upgrade-governance-params.ts` (and runbook below).

---

## 2. Full Proposal Lifecycle: Automated Verification

The lifecycle is:

1. **Propose** → proposal created, `proposalSnapshot` and `proposalDeadline` fixed.
2. **Voting delay** → mine blocks until `block.number > proposalSnapshot + votingDelay`.
3. **Vote** → `castVote(proposalId, support)`.
4. **Voting period** → mine blocks until `block.number > proposalDeadline`.
5. **Queue** → `queue(targets, values, calldatas, descriptionHash)`.
6. **Timelock** → wait `minDelay` seconds, then **Execute** → `execute(...)`.

**Automated verification**:

- **CI / local**: `npm run test -- --grep "Governance.*lifecycle"` runs `test/integration/governance-lifecycle.integration.ts`, which deploys a minimal Governor + Timelock + mock target and runs the full lifecycle, then asserts the target state changed.
- **Evidence pack**: `npm run governance:full-lifecycle-evidence` runs the real stack (deploy:p9 + transfer-admin prerequisite), produces `evidence-pack/governance-full-lifecycle.json` and `.sha256`, and optionally `governance-audit-log.json` for audit trail.

---

## 3. Voting Power: Snapshot & Anti–Flash-Loan Manipulation

- **Snapshot**: Voting power is taken at **proposal creation time**. `Governor.proposalSnapshot(proposalId)` returns the block number used for all `getVotes(account, snapshot)` checks.
- **ERC20Votes**: The governance token uses OpenZeppelin `ERC20Votes`; `getPastVotes(account, blockNumber)` returns the balance at that block (checkpointed). The Governor uses `getVotes(account, snapshot)` which delegates to the token’s past-votes at `snapshot`.
- **Voting delay**: `votingDelay()` (e.g. 1 block) ensures the snapshot block is **in the past** when voting opens. This prevents same-block flash-loan attacks: an attacker cannot borrow GOV in the same block as proposal creation and then vote with it, because voting only opens after `votingDelay` blocks, and the snapshot is already fixed at proposal creation.
- **Security checks** (see `scripts/governance/verify-voting-snapshot-safety.ts`):
  - `votingDelay() >= 1`.
  - Votes are computed with `getVotes(account, proposalSnapshot(proposalId))`, not current balance.

---

## 4. Execution Failure: Isolation & Rollback Strategy

- **Timelock behavior**: The Governor executes via `TimelockController.executeBatch()`. If **any** call in the batch reverts, the **entire** batch reverts (no partial application). State is left as before the execute tx.
- **Isolation**: There is no “partial success”; either all operations in the proposal are applied or none.
- **Rollback strategy**:
  1. **Execution reverts**: Fix the cause (e.g. calldata, target contract state, or dependency), then submit a **new proposal** with the corrected action(s). The previous proposal remains in a failed state (or can be canceled if still in queue).
  2. **No automatic retry**: The system does not auto-retry; operators or DAO must re-propose after diagnosis (using revert diagnostics and audit logs).

See test: `test/integration/governance-lifecycle.integration.ts` (execution failure scenario).

---

## 5. Audit Log & Reproducible Evidence

- **Evidence pack** (per run):
  - `evidence-pack/governance-full-lifecycle.json`: schema version, chainId, governor/token addresses, steps (delegate, propose, vote, queue, execute) with `txHash` and `blockNumber`, and post-execution state (e.g. reserve LTV).
  - `evidence-pack/governance-full-lifecycle.sha256`: SHA-256 of the JSON for integrity.
- **Audit log** (optional, for forensics):
  - `evidence-pack/governance-audit-log.json`: chainId, block range, ordered list of steps with `step`, `txHash`, `blockNumber`, `contract`, `method`, and final governance parameters (votingDelay, votingPeriod, quorumNumerator, etc.). Enables full-chain audit and reproducible verification.
- **Reproducibility**: Given the same chain (e.g. local Hardhat 31337) and the same deploy + transfer-admin + lifecycle script, the evidence pack and audit log can be regenerated and compared (e.g. by SHA-256) for compliance and audits.

**Commands**:

- Full lifecycle + evidence: `npm run governance:full-lifecycle-evidence`
- Audit log only (after lifecycle): `npm run governance:audit-log`
- Verify snapshot safety: `npm run governance:verify-snapshot-safety`
- Propose upgrade of governance params: `npm run governance:proposal-upgrade-params`

---

## Runbook Summary

| Goal | Command / Step |
|------|-----------------|
| Deploy governance (P9) | `npm run deploy:p9` |
| Transfer admin to Timelock | `npm run governance:transfer-admin` |
| One-shot: transfer-admin + first proposal | `npm run governance:ensure-and-run` |
| Full lifecycle + evidence pack | `npm run governance:full-lifecycle-evidence` |
| Generate audit log (after lifecycle) | `npm run governance:audit-log` |
| Verify voting snapshot safety | `npm run governance:verify-snapshot-safety` |
| Create proposal to upgrade params | `npm run governance:proposal-upgrade-params` (env: `GOV_PARAM=period`, `NEW_VALUE=500`) |
| Automated lifecycle test | `npm run test -- test/integration/governance-lifecycle.integration.ts` |
| Verify recovery paths (L1–L3) | `npm run governance:verify-recovery-paths` |
| Risk simulation (param change) | `npm run governance:risk-simulate-params` |
| Incident response (P0–P3) | See [runbooks/incident-response.md](runbooks/incident-response.md) |
| Treasury & budget governance | See [runbooks/treasury-and-budget.md](runbooks/treasury-and-budget.md) |

These elements together bring the governance module to **mainnet-ready, institutional-grade DAO** level: parameters are self-governed, lifecycle is automated and verified, voting is snapshot-based with flash-loan resistance, execution failures are isolated and handled by re-proposal, and full audit logs and evidence support reproducibility and compliance.

---

## 6. Upgrade path & recovery (no permanent lock)

Top-tier audits require that the DAO **cannot be permanently locked** if Governor or Timelock is upgraded to a bad implementation.

- **Break-glass (current)**: The **EmergencyModule** guardian can call `emergencyPause(pool)` only. This pauses the lending pool (supply/borrow/withdraw/repay revert) but does **not** change Governor or Timelock. Scope is disaster containment (e.g. oracle anomaly), not governance recovery.
- **Recovery**: Governor/Timelock recovery must rely on **who controls Timelock admin or ProxyAdmin owner** (e.g. a multi-sig). Document that this multi-sig is the break-glass for “restore known-good implementation”; keep Guardian for **pool pause only**.
- **Upgrade timelock ≥ normal timelock**: For mainnet, any proposal that upgrades Governor or Timelock (or critical governance contracts) should use a **longer** delay than ordinary parameter proposals (e.g. separate Timelock with larger `minDelay`, or policy that such proposals are queued only on the long-delay timelock). This repo uses a single timelock delay per profile; the requirement is a **design/policy** one for production.

Full gap analysis (break-glass, Gas DoS, voting game theory, parameter risk, oracle linkage, legal, sustainability) is in **[17-governance-tier2-dao-gaps-and-roadmap.md](17-governance-tier2-dao-gaps-and-roadmap.md)**. **Protocol-level** design (formal recovery paths, gas/queue resilience, risk simulation, oracle–liquidation tiers, cross-chain, economics & legal) is in **[18-governance-protocol-level-dao.md](18-governance-protocol-level-dao.md)**. **End-state** (dual approval, incident response, MEV & gradual activation, treasury & budget, immutable path, incentives & delegates) is in **[19-governance-endstate-dao.md](19-governance-endstate-dao.md)**. **Ultra-Endgame** (post-immutable risk & succession, sovereignty, entropy, civilization-scale, governance extinction) is in **[20-governance-ultra-endgame.md](20-governance-ultra-endgame.md)**—philosophical layer, not runbooks. The **Ultimate Unresolved List** (12 open questions: dignified sunset, fork war, security paradox, oligarchy, late-stage manipulation, code vs sovereign, treasury vs cost, zero-value token, AI governance, DAO federation, beyond-blockchain survival, DAO as transitional form) is in **[21-governance-ultimate-unresolved.md](21-governance-ultimate-unresolved.md)**—no resolution claimed.
