# Authoritative Release Evidence — v1.0 Full GO (Sealed)

**Status**: **v1.0 Full GO（Gate-Complete + Release-Signable）** — sealed on the basis of zero-trust gate evidence obtained on the authoring machine.

**Purpose**: This document is the **single source of truth** for the release evidence of v1.0.0 Enterprise-Grade (Local-Only). It shall not be overwritten by future gate runs; subsequent runs may append or reference new evidence in separate sections or documents.

---

## 1. Release status

| Item | Value |
|------|-------|
| **Version** | v1.0.0 (source: `package.json` → `"version": "1.0.0"`) |
| **Release type** | Enterprise-Grade (Local-Only), P0–P10 Engineering-Complete |
| **Gate status** | **Full GO（Gate-Complete + Release-Signable）** |
| **Seal date** | 2026-02-17 (ISO date of gate run used for sealing) |

---

## 2. Authoritative gate evidence (sealed)

The following values were produced by a single run of `npm run p10:gate` (no `SKIP_E2E_UI`) on the authoring machine, exit code **0**, and are **authoritative** for this release.

| Anchor | Value |
|--------|-------|
| **EVIDENCE-PACK-MANIFEST-SHA256** | `b9009c7342d51e3d389916a07789de84522b560860e13d783bf362ba0f589e45` |
| **COMMIT_SHA** | `9101e124660b6ec00947dec34a49e92c85c9445a` |
| **NODE_VERSION** | `v22.14.0` |
| **NPM_VERSION** | `10.9.2` |
| **OS** | `win32/10.0.26100` |

| Meta | Value |
|------|-------|
| **Gate run ID** | `p10-gate-1771292998125-4d9a1055` |
| **Evidence pack path** | `evidence-pack/` (manifest.json, evidence-summary.json, deployments-31337.json, p10-gate-output.txt) |

**Verification**: Gate stdout contained the above EVIDENCE-PACK-MANIFEST-SHA256 and four anchors; the four anchors match `evidence-pack/evidence-summary.json`; the manifest is bound to the gate run and includes file hashes.

---

## 3. Acceptance criterion

**Single acceptance command (v1.0 Local-Only):** From a clean environment (port 8545 free), run:

```bash
npm run p10:gate
```

- **Success**: exit **0**, evidence-pack/ generated, stdout shows **EVIDENCE-PACK-MANIFEST-SHA256** and **COMMIT_SHA / NODE_VERSION / NPM_VERSION / OS**.
- **Failure**: Any non-zero exit (port in use, deploy failure, test failure, E2E failure, or evidence-summary validation failure) blocks the gate.

---

## 4. References

- **Audit & test evidence**: [06-AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C §5.2, §6  
- **Full GO conclusion**: [ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md)  
- **Release declaration**: [03-08-deployment-runbook.md](03-08-deployment-runbook.md) §9（v1.0 发布记录与宣言）  
- **Checklist**: [RELEASE_CHECKLIST_P10.md](../RELEASE_CHECKLIST_P10.md)

---

*This document freezes the release evidence for v1.0.0. For reproducibility, re-run `npm run p10:gate` on any supported environment; new runs will produce new hashes and anchors, but this sealed evidence remains the authoritative record for this release.*
