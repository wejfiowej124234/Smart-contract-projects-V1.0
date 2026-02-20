# Repository self-description (仓库自述)

**Use this text for the repository “About” or description on Git hosting platforms (e.g. GitHub). Keep it short, neutral, and free of forbidden or sensitive wording to avoid account or repository issues. Aligned with v1.0 P0–P10 Local-Only upgrade.**

---

## Short (for platform “About” field)

```
v1.0 lending protocol demo: Hardhat + React. Proxy, oracle, liquidation, governance (OpenZeppelin Governor). Local-only (31337). Educational. Not financial or legal advice.
```

---

## Medium (one paragraph)

This repository is the **v1.0 P0–P10 Local-Only** release of a Web3 lending stack: Solidity contracts (proxy, reserves, oracle, liquidation, Treasury), OpenZeppelin Governor + Timelock, React + TypeScript frontend (Dashboard, Governance, Pause/Unpause), and scripts for local deploy and verification (`npm run p10:gate`). It is for **local development and educational use only**. It does not constitute financial, legal, or investment advice. DeFi involves risk; use only what you can afford to lose. No guaranteed returns or SLA.

---

## Full (for README or docs)

- **What it is:** v1.0 **P0–P10 Engineering-Complete (Local-Only)** demo: upgradeable lending protocol (Solidity), proxy and reserve/rate modules, oracle and risk params, liquidation and Treasury, access control and emergency pause, Governor + Timelock governance (proposals, voting). React frontend: supply/borrow/repay/withdraw, governance UI, pause/unpause. Runs on Hardhat local chain (chainId 31337). Single-command verification: `npm run p10:gate` (deploy → governance → E2E → evidence-pack).
- **Purpose:** Portfolio and interview demo; local verification and learning. Not for production deployment without further audit and hardening.
- **Disclaimer:** This project is for **educational and local demonstration only**. It is **not** financial, legal, or investment advice. DeFi involves risk; you may lose funds. The authors do not guarantee any returns or fitness for a particular use. Use at your own risk.
- **No forbidden content:** No investment recommendations, no guaranteed returns, no offensive or illegal content, no stored secrets (keys/mnemonics). User-facing UI includes risk disclaimers.

---

**Do not:** Add wording that promises returns, recommends buying or selling, or implies official endorsement. **Do:** Keep the description technical and neutral so the repository remains safe for public hosting.
