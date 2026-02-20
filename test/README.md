# 测试目录（以 docs/06-AUDIT-SUITE、docs/09-本地链标准与地址 为准）

**约定**：本仓测试目录名为 **test/**（非 tests/）。RPC/Chain ID 以 docs/09、configs/localChain.mjs、e2e/fixtures.ts 为准（RPC `http://127.0.0.1:8545`，Chain ID `31337`）。合约地址来源：部署脚本写 `deployments/31337.json`，前端读 `frontend/src/contracts/deployments.json`（由 export 同步）。

| 子目录 | 内容 | 命令 |
|--------|------|------|
| **unit/** | 单元测试（RiskEngine、ReserveLogic、LinearRateStrategy 等） | `npm test` 或 `npx hardhat test` |
| **integration/** | 集成测试（SimpleLending 全流程，in-process 部署） | 同上 |
| **invariants/** | 不变量测试（aToken/debt 与池子一致性） | `npx hardhat test --grep "Invariants"` |
| **fuzz/** | 模糊测试（随机 supply/withdraw/borrow/repay） | `npx hardhat test --grep "Fuzz"` 或 `FUZZ_ITERATIONS=n npm test` |

从项目根运行：**`npm test`** 或 **`npx hardhat test`**（递归执行 test/ 下用例）。E2E 见 e2e/、`npm run smoke:e2e`、`npm run e2e:ui`。
