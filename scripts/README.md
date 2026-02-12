# Scripts

| 脚本 | 用途 |
|------|------|
| **deploy.ts** | 部署合约（USD8、WETH、SimpleLending）+ seed 账户 + 导出 `deployments/31337.json` 与 `frontend/src/contracts/deployments.json` 及 ABIs。运行：`npx hardhat run scripts/deploy.ts --network localhost`（需先 `npx hardhat node`）。 |
| **_lib/** | deploy 使用的工具（export.ts、fs.ts）。 |
| **move-docs-to-archive.cjs** | 将 docs 下 7 个旧稿移入 `docs/archive/`。运行：`node scripts/move-docs-to-archive.cjs`。 |
| **smoke-e2e.mjs** | E2E 冒烟（部署 + 完整 approve→supply→borrow→repay→withdraw）。`npm run smoke:e2e`。 |
| **generate-pdf.mjs / generate-pdf.ps1** | 幻灯片 PDF 生成。 |
| **clean-slides-dist.mjs** | 清理 slides 输出目录。 |
| **seed-solc-cache.cjs** | Solidity 编译缓存（若项目使用）。 |

核心日常使用：**deploy.ts**（部署）、**move-docs-to-archive.cjs**（文档归档）。
