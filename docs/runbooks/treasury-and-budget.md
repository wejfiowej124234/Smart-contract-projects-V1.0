# Treasury and Budget Governance Runbook (End-State DAO)

This runbook defines **treasury and budget** governance for **End-State DAO**. See [19-governance-endstate-dao.md](../19-governance-endstate-dao.md) §3.

## Principles

- **Treasury** holds protocol-owned assets (fees, surplus). Owner = Timelock (or multisig mandated by governance). In this repo, the `Treasury` contract (`withdraw(token, to, amount)` onlyOwner) can be used: set its owner to the Timelock so that allocations require a governance proposal that executes Timelock → Treasury.withdraw(...).
- **Allocations** (grants, ops, buyback, insurance, etc.) require an **on-chain governance proposal** that targets the Treasury (e.g. `Treasury.transfer(token, to, amount)`).
- **Budget cycles**: Define a cycle (e.g. quarterly). Within a cycle, category caps (ops, grants, marketing) can be set by a budget proposal; spending proposals should stay within approved caps or require a new budget vote.

## Budget cycle

1. **Budget proposal**: Governance approves total and per-category caps for the cycle (e.g. Q1: ops 100k, grants 200k).
2. **Spending proposals**: Individual proposals (e.g. “Grant 50k to Project X”) are voted on; total per category must not exceed the approved budget unless a budget amendment is passed.
3. **Transparency**: All transfers are on-chain; optional dashboard or report aggregates by cycle and category.

## Vesting

- For **large allocations** (e.g. grants, incentives), use **vesting** (linear or cliff) so funds are released over time. Governance approves the vesting schedule; implementation can be a Vesting contract or Treasury with schedule support.

## Requesting an allocation

1. **Proposal**: Create a governance proposal (target = Treasury, calldata = transfer or vesting schedule). Attach rationale and (if applicable) link to budget category.
2. **Vote**: Standard Governor vote and timelock.
3. **Execution**: After timelock, proposal is executed; Treasury sends funds or creates vesting.

## Optional code

- **ITreasury**: Interface `transfer(token, to, amount)` (and optionally `vesting`). Simple implementation: owner = Timelock, onlyOwner for transfers.
- **Categories/caps**: Can be enforced in a future Treasury module or by policy (proposals that exceed cap are rejected by community vote).

## References

- Protocol-level economics: [18-governance-protocol-level-dao.md](../18-governance-protocol-level-dao.md) §7.
- End-state checklist: [19-governance-endstate-dao.md](../19-governance-endstate-dao.md) Summary.
