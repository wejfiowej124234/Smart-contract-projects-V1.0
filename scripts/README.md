# Scripts

| Script | Purpose |
|--------|---------|
| **deploy.ts** | Deploy contracts (USD8, WETH, SimpleLending) + seed accounts + export `deployments/31337.json`, `frontend/src/contracts/deployments.json`, and ABIs. Run: `npx hardhat run scripts/deploy.ts --network localhost` (after `npx hardhat node`). |
| **_lib/** | Helpers for deploy (export.ts, fs.ts). |
| **smoke-e2e.mjs** | E2E smoke: deploy + full approve→supply→borrow→repay→withdraw. `npm run smoke:e2e`. |

Daily use: **deploy.ts** (deploy and export), **smoke-e2e.mjs** (E2E verification).
