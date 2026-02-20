# 企业级前后端一致性检查报告

**依据**：[09-本地链标准与地址.md](../09-本地链标准与地址.md)（SSOT）、[DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) A–E 分层。**检查维度**：前后端一致、ABI 畅通、端口对齐、业务逻辑畅通。

---

## 一、前后端是否一致

| 检查项 | 结果 | 说明 |
|--------|------|------|
| **部署地址来源** | ✅ 一致 | 根目录 `deployments/31337.json` 与 `frontend/src/contracts/deployments.json` 中 `"31337"` 键的字段、地址完全一致（chainId、usd8Address、wethAddress、simpleLendingAddress、aToken、variableDebtToken、oracleRouter、proxyAdmin、configurator、mockAggregator、governanceToken、timelock、governor、emergencyModule） |
| **Deployments 类型** | ✅ 一致 | `frontend/src/contracts/deployments.ts` 的 `Deployments` 类型与 `scripts/_lib/export.ts` 的 `DeploymentsJson`、`deployments/31337.json` 键名一致；前端通过 `getDeployments(chainId)` 唯一定位地址 |
| **导出链路** | ✅ 畅通 | 部署脚本写 `deployments/<chainId>.json`，`exportArtifacts` 聚合多链并写入 `frontend/src/contracts/deployments.json`，同时写出 ABI（TestToken、SimpleLending、GovToken、GovernorP9） |
| **业务代码不读 deployments/ 目录** | ✅ 符合 | 前端仅读 `frontend/src/contracts/deployments.json` 与 `getDeployments(chainId)`，无直接读 `deployments/` 目录 |

---

## 二、ABI 是否畅通

| 检查项 | 结果 | 说明 |
|--------|------|------|
| **ABI 来源** | ✅ 单一 | `frontend/src/contracts/abis.ts` 统一导出 `ABIS.TestToken`、`ABIS.SimpleLending`、`ABIS.GovToken`、`ABIS.GovernorP9`；业务仅通过 abis.ts 引用 |
| **SimpleLending ABI** | ✅ 畅通 | `frontend/src/abis/SimpleLending.json` 来自合约 `LendingPoolImpl`（export 写 artifact）；含 **getPoolInfo**、**getUserPosition**、**supply**、**withdraw**、**borrow**、**repay**，与 `contracts/core/LendingPoolImpl.sol` 接口一致 |
| **TestToken (USD8/WETH)** | ✅ 畅通 | `ABIS.TestToken` 用于 usd8、weth 合约；前端调用 `approve`、`balanceOf`、`allowance` 等，与 ERC20 一致 |
| **Governance** | ✅ 畅通 | P9 部署后 export 写出 `GovernorP9.json`、`GovToken.json`；前端 `useGovernanceOverview` 使用 `ABIS.GovernorP9`、`ABIS.GovToken`（paused、delegates 等） |
| **合约实例构造** | ✅ 一致 | `getContracts(provider, chainId)` 用 `getDeployments(chainId)` + `ABIS.*` 构造 Contract，无硬编码地址或 ABI 路径 |

---

## 三、前后端端口是否对齐

| 检查项 | 结果 | 说明 |
|--------|------|------|
| **RPC / 链端口** | ✅ 对齐 | **hardhat.config.ts**：localhost `url: "http://127.0.0.1:8545"`, `chainId: 31337`；**frontend/src/config/network.ts**：`DEFAULT_LOCAL_RPC = "http://127.0.0.1:8545"`，`LOCAL_CHAIN_ID = 31337`；**configs/localChain.mjs**：`RPC_URL = "http://127.0.0.1:8545"`，`LOCAL_CHAIN_ID = 31337`；无 localhost:8545 歧义 |
| **前端 dev 端口** | ✅ 对齐 | **frontend/vite.config.ts**：`server: { host: "127.0.0.1", port: 5173 }`；**e2e/playwright.config.ts**：`baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173"`；E2E 与 09 约定一致，端口变化时通过 E2E_BASE_URL 覆盖 |
| **E2E RPC** | ✅ 对齐 | **e2e/fixtures.ts**：`E2E_RPC_URL = process.env.E2E_RPC_URL || "http://127.0.0.1:8545"`，chainId 31337；与 09、network.ts、localChain.mjs 一致 |
| **无业务硬编码** | ✅ 符合 | 前端业务代码无硬编码 127.0.0.1:8545 或 31337；均使用 `getRpcUrl(chainId)`、`LOCAL_CHAIN_ID`、`DEFAULT_LOCAL_RPC` 等 network 或 deployments 常量 |

---

## 四、业务逻辑是否畅通

| 检查项 | 结果 | 说明 |
|--------|------|------|
| **读链 / 读合约** | ✅ 畅通 | Dashboard：`getPoolInfo()`、`getUserPosition(account)`；Markets/AssetDetail 使用同一 getContracts + getPoolInfo；读 RPC 使用 127.0.0.1:8545（useSplitProvider / localReadProvider），与 09 约定一致 |
| **Supply 流程** | ✅ 畅通 | useActions：approve(spender=simpleLendingAddress) → supply(amount)；Preflight 校验 allowance、maxBorrow 等；合约 LendingPoolImpl.supply(amount) 存在且 ABI 含 supply |
| **Withdraw / Borrow / Repay** | ✅ 畅通 | useActions 调用 write.withdraw/borrow/repay；合约 LendingPoolImpl 实现 withdraw、borrow、repay；ABI 含对应方法；Preflight 与 postState 校验一致 |
| **Governance / Pause** | ✅ 畅通 | useGovernanceOverview 读 GovernorP9、GovToken、SimpleLending.paused；emergencyModule 等地址来自 getDeployments(chainId) |
| **错误与提示** | ✅ 对齐 | ui.ts 等处错误文案引用 DEFAULT_LOCAL_RPC、LOCAL_CHAIN_ID、deploy:localhost/deploy:p9，与 09 排错与最短修复一致 |

---

## 五、GATE 五项与证据包

| 项 | 检查方式 | 本报告对应 |
|----|----------|------------|
| CHAIN_ID_OK | Hardhat / MetaMask / 前端均为 31337 | §三 端口与 chainId 对齐 |
| RPC_OK | 127.0.0.1:8545 唯一约定 | §三 全仓无 localhost:8545 |
| DEPLOYMENTS_SYNC_OK | deployments/31337.json 与 frontend 一致 | §一 前后端一致 |
| READ_CONTRACT_OK | getPoolInfo / getUserPosition 可读 | §二 ABI、§四 业务读链 |
| HEALTHY_LOCAL | 三项 Yes + Supply happy path | 需运行时验收（/diagnostics + 一次 Supply） |

**Evidence Pack**：按 09 总纲留证（diagnostics 截图、deployments+SHA256、hardhat log、失败时 tx+revert）即可满足可复现、可回归、可审计。

---

## 六、结论与建议

- **结论**：当前代码与配置满足**企业级前后端一致性**：地址与类型一致、ABI 来源单一且与合约一致、RPC/端口/chainId 全仓 127.0.0.1:8545 与 31337、业务读/写链与 09/DEBUG_PLAYBOOK 约定一致。
- **建议**：每次部署或合约/ABI 变更后执行 **node → deploy →（必须）重启前端 → MetaMask 31337 → /diagnostics 三项 Yes**，再按 [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) B→C→D→E 做分层验证；遇问题先过 GATE 五项再改代码，并按 Evidence Pack 留证。

**检查完成时间**：可于执行 09 Part 4.1 打勾后、联调前复验本报告；若仓库结构或 export/ABI 有变更，需重新核对 §一、§二。
