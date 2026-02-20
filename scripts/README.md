# Scripts

**约定**：以 **docs/09-本地链标准与地址.md**、**docs/03-08-deployment-runbook.md** 为准。RPC 统一 `http://127.0.0.1:8545`，Chain ID `31337`；部署入口为 `scripts/deploy/deploy.ts`（禁止使用已废弃的根目录 `scripts/deploy.ts`）。

| Script / 目录 | Purpose |
|---------------|---------|
| **deploy/deploy.ts** | 部署合约（USD8、WETH、SimpleLending 等）+ seed + 写入 `deployments/31337.json`，并由 _lib/export 同步到 `frontend/src/contracts/deployments.json` 与 ABI。运行：`npm run deploy:localhost`（需先 `npx hardhat node`）。 |
| **deploy/deploy-p9.ts** | P9 治理部署。运行：`npm run deploy:p9`（依赖 deploy:localhost 产物）。 |
| **_lib/export.ts** | 部署脚本调用的导出：从 `deployments/<chainId>.json` 生成前端 `frontend/src/contracts/deployments.json` 及 ABI 文件。 |
| **config/loadProfile.ts** | 链下配置唯一定义：`loadProfile(chainId)`，profile 来自 `configs/profiles/<mode>/profile.json`；储备路径 `profile.reservesConfigPath` 或回退 `scripts/config/reserves.<chainId>.json`。 |
| **demo/run-local-prereq.mjs** | 本地前置：deploy:localhost + deploy:p9。`npm run local:prereq`。 |
| **demo/start-local-chain.mjs** | 启动本地链。`npm run demo:chain`。 |
| **demo/start-frontend.mjs** | 启动前端（注入 RPC）。`npm run demo:frontend`。 |
| **local-restart.ps1** | 一键：杀 8545/5173 → 起节点 → deploy → 起前端。`npm run local:restart`（Windows 下可 `scripts\local-restart.bat`）。 |
| **verify-local-chain-consistency.mjs** | 校验节点 chainId、deployments、前端地址一致。`npm run verify:consistency`。 |
| **smoke-e2e.mjs** | E2E 冒烟：deploy + approve→supply→borrow→repay→withdraw。`npm run smoke:e2e`。 |

Daily use: **npm run deploy:localhost**（及 **npm run deploy:p9**）、**npm run verify:consistency**、**npm run smoke:e2e**。
