# SimpleLending — English Portfolio (merged)

**约定**：本文档由原 **ONE-PAGER.en.md**、**ARCHITECTURE-WHITEPAPER-SUMMARY.en.md**、**SPEAKER_SCRIPT_10MIN.en.md**、**PORTFOLIO-PRODUCT-FINISH-EN.md** 合并而成，为对外 Web3 Protocol / DeFi 技术面试与作品集**单一英文入口**。

---

# §1 One-Pager

**SimpleLending** is a **DeFi lending protocol** (supply, borrow, repay, withdraw) with **upgradeable proxies**, **governance (Timelock + Governor)**, **oracle-driven risk (LTV/LT)**, **liquidation & Treasury**, and **emergency pause**. **v1.0.0 Enterprise-Grade (Local-Only)** — one command verifies the full stack: `npm run p10:gate` → exit 0 → **evidence-pack** with **SHA256 + four anchors** (commit, node, npm, OS). **Scope** P0–P10: proxy, reserve/rate, access control, multi-asset, oracle, liquidation, governance, **Playwright UI E2E** gate. **Tech**: Solidity 0.8.19, OpenZeppelin, Hardhat, ethers v6; React, TypeScript, Vite, ethers v6; Playwright. **Authoritative evidence**: [04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md).

---

# §2 Architecture & Whitepaper Summary

- **Overview**: Single-asset DeFi lending on **Hardhat 31337**; Pool (proxy), PoolConfigurator (LTV/LT, admin → Timelock), OracleRouter, RiskEngine, Liquidation, Treasury, aToken/variableDebtToken, Governor + Timelock, EmergencyModule (Guardian/PAUSER).
- **Risk**: LTV / Liquidation Threshold set by governance; HF = (collateral × LT) / debt (scale 100); HF < 100 → liquidatable; utilization-based rates; reserve factor to Treasury.
- **Security & upgrade**: Pool owner and configurator admin → Timelock after P9; implementation upgradeable via Timelock; v1.0 Local-Only, no mainnet.
- **Verification**: `npm run p10:gate` → chain → deploy (P0–P8) → governance (P9) → Playwright E2E → evidence-pack; see [04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md).

---

# §3 10-Minute Presentation Script

| Block | Topic | Key line |
|-------|--------|----------|
| 0:00–1:30 | Intro + problem | "One command proves the whole pipeline: `npm run p10:gate` → exit 0, evidence-pack with SHA256 and four anchors." |
| 1:30–4:00 | Architecture + stack | "Proxy pool, configurator and oracle, liquidation and treasury, full on-chain governance with Guardian — all verified in one gate including UI E2E." |
| 4:00–6:00 | Gate + evidence | "One command, exit 0, sealed evidence-pack with SHA256 and four anchors — no extra steps." |
| 6:00–8:00 | Highlights | "Governance and risk production-style; frontend preflight, exact/infinite approval, tx lifecycle." |
| 8:00–10:00 | Summary + Q&A | "Single-command verification, sealed evidence, docs ready for Web3 Protocol roles." |

**Cheat sheet**: Why local-only? v1.0 scope is engineering-complete local; mainnet later. Upgrade? New impl → Governor proposal → vote → queue → execute → Timelock upgrades. Pause? Guardian (EmergencyModule) has PAUSER. HF? (collateral × LT) / debt; < 100 liquidatable.

---

# §4 Product-Finish Portfolio (Interview)

- **Executive summary**: Production-grade Web3 frontend for DeFi lending + governance; full loop Connect → Supply → Borrow → Repay → Governance (view/vote); design tokens, themes (Light/Dark/Navy), value-update animations, tx state machine, preflight modal. **Release proof**: `npm run e2e:ui` and `npm run p10:gate` pass; evidence-pack and E2E evidence.
- **Frontend structure**: config/, contracts/, hooks/ (useWallet, useDashboard, useActions, useGovernanceOverview), state/ (tx, txStore, txHistory, errors), components/, pages/ (Dashboard, Markets, Governance, Activity, Settings, Admin), utils/, styles/.
- **Integration**: Lending (supply, withdraw, borrow, repay, getUserPosition, getPoolInfo); Governor (proposals, castVote, propose, queue, execute); addresses from deployments.json by chainId.
- **Interaction**: Supply/Borrow/Repay/Withdraw with Preflight → sign → pending → confirmed; Governance list + Vote/Queue/Execute; Activity history; "Data from chain" / "Simulated data" labels; prefers-reduced-motion respected.
- **Run & demo**: `npx hardhat node` → `npm run deploy:localhost` → `cd frontend && npm run dev`; then Connect → Supply → Borrow → Repay → Governance (Vote) → Activity. Full gate: `npm run p10:gate` (8545 free) → exit 0.

**Doc index**: [00-INDEX.md](00-INDEX.md) (full doc index); [04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md) (sealed evidence); root README, RELEASE_CHECKLIST_P10.
