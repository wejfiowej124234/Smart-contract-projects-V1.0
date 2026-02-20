# Incident Response Runbook (End-State DAO)

This runbook supports **End-State DAO** operational resilience. See [19-governance-endstate-dao.md](../19-governance-endstate-dao.md) for context.

## Severity levels

| Level | Definition | Example |
|-------|------------|---------|
| **P0** | Active exploit or oracle failure affecting user funds | Oracle returns wrong price → liquidations; contract exploit draining pool |
| **P1** | Serious bug or risk; funds may be at risk if not acted on | Critical bug found in audit; oracle feed deprecated |
| **P2** | Operational issue; no immediate fund risk | Frontend down; RPC degraded |
| **P3** | Low; cosmetic or non-urgent | Docs typo; minor UI issue |

## Response matrix

| Severity | Immediate action | Decision owner | Follow-up |
|----------|------------------|----------------|-----------|
| **P0** | Guardian calls `EmergencyModule.emergencyPause(pool)` if pool is at risk. Activate comms (status + incident channel). | Guardian (multi-sig in prod) | Root cause, post-mortem, governance proposal to fix/upgrade if needed |
| **P1** | Assess within 24–48 h. If funds at risk → Guardian pause. Else → governance proposal (short timelock if policy allows). | Ops + multi-sig | Post-mortem; governance for fix |
| **P2** | Normal ops; no pause. Fix via deployment or governance as appropriate. | Ops | Optional post-mortem |
| **P3** | Backlog; no emergency. | Ops / community | — |

## Communication

- **Status**: Publish “Investigating” → “Identified” → “Mitigated” / “Resolved” on status page or pinned message.
- **Incident channel**: Dedicated channel (e.g. Discord/Telegram) for real-time updates; restrict write to ops/guardian.
- **Post-mortem**: After P0/P1, publish a short post-mortem (what happened, cause, mitigation, prevention). Template: see `docs/debug/INCIDENT_TEMPLATE.md` if present.

## Who can pause

- Only **Guardian** (EmergencyModule) can call `emergencyPause(pool)`.
- Unpause: **PAUSER** (e.g. Timelock or deployer). Do not unpause until root cause is addressed or risk is accepted by governance.

## References

- Recovery paths: [18-governance-protocol-level-dao.md](../18-governance-protocol-level-dao.md) §1.
- Break-glass: [17-governance-tier2-dao-gaps-and-roadmap.md](../17-governance-tier2-dao-gaps-and-roadmap.md) §1.
