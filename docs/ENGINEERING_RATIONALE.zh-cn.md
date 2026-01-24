# 工程化设计说明（企业级口径）

本项目以《Coding Test Assignment - Web3 engineer》为目标：在 **Hardhat 本地链（31337）** 上提供一个可复现的 DeFi lending dashboard（React + TypeScript + ethers v6），强调“真实交易流 + 可维护性 + 清晰边界”。

本文只回答三类“高级工程能力”问题：
1) 为什么这么设计（取舍）
2) 为什么没做某个功能（边界）
3) 看起来奇怪但有原因（反直觉点）

---

## 1) 设计选择 / 权衡（必须）

### 1.1 读写分离：provider（读） vs signer（写）

- **选择**：前端把读模型和写模型拆开。
  - 读：`getContracts(provider)` 返回只读合约实例，用于 `balanceOf/getPoolInfo/getUserPosition/...`
  - 写：`getWriteToken/getWriteLending` 接收 `signer`，只暴露需要的写入函数
- **原因**：
  - provider 和 signer 的生命周期不同；签名过程会失败/被拒绝，读模型不应该被写流程污染。
  - 便于统一管理交易状态（pending/confirmed/failed）并在 confirmed 后刷新读模型。
- **位置**：
  - `frontend/src/contracts/contracts.ts`
  - `frontend/src/contracts/write.ts`
  - `frontend/src/hooks/useDashboard.ts`
  - `frontend/src/hooks/useActions.ts`

### 1.2 事件驱动刷新为主，区块轮询为兜底

- **选择**：强制满足题面“Listen for contract events and update UI”，并额外加一个轻量 `block` 监听作为兜底。
- **原因**：
  - 事件监听是正确的“状态源”，但在本地链/钱包/浏览器环境下可能出现监听丢失、页面休眠、provider 重连等情况。
  - 兜底轮询被严格节流（例如 3s）并且在 tx pending 时关闭，避免无意义重渲染。
- **位置**：
  - 事件：`frontend/src/hooks/useDashboard.ts`
  - 兜底：`frontend/src/App.tsx`

### 1.3 Allowance 的一致性：以“链上事件 + confirmed 回调”保证 UI 不漂移

- **选择**：`useAllowance` 增加 `refresh()` 并监听 `Approval(owner, spender)` 事件；同时写模型在 approve confirmed 后触发刷新。
- **原因**：
  - 真实世界里 allowance 很容易“显示滞后”，导致用户重复 approve 或误以为卡住。
  - 单靠“点 Refresh”或“某个 state 变化”刷新不可控；事件+confirmed 是更稳定的同步点。
- **位置**：
  - `frontend/src/hooks/useAllowance.ts`
  - `frontend/src/hooks/useActions.ts`
  - `frontend/src/App.tsx`

### 1.4 部署脚本的可复现性：一键 deploy + export + seed

- **选择**：`scripts/deploy.ts` 负责：部署 USD8/WETH/SimpleLending → seed 本地账号 → 导出 ABI + deployments 给前端。
- **原因**：
  - 面试作业最重要的是“评审可一键复现”。部署/导出/seed 分散会增加 reviewer 的摩擦成本。
  - seed 默认给 Hardhat 本地账号，另支持 `SEED_ADDRESS` 给 MetaMask 地址（避免导入私钥的操作成本）。
- **位置**：
  - `scripts/deploy.ts`
  - `scripts/_lib/export.ts`

---

## 2) 为什么没有做某个功能（明确边界）

### 2.1 为什么没有做预言机 / 清算 / 利息计提

- **结论**：不做。
- **原因**：题目要求是“前端与合约交互 + 交易流 + 状态管理”，而预言机/清算/计息会把项目扩展成完整协议设计，超出 5–7 天作业的合理范围。
- **风险声明**：本项目不面向主网/真实资金场景；只用于演示与本地测试。
- **证据**：README 中明确 scope；SECURITY.md 中明确边界。

### 2.2 为什么不强制把 `npm audit`（dev toolchain）清零

- **结论**：只对“生产运行依赖”清零（`npm run audit:prod`），dev toolchain 只做非破坏性缓解。
- **原因**：
  - dev toolchain（Hardhat 生态）常见的审计告警需要 `--force` 大版本升级，反而破坏可复现性。
  - 企业实践中会把 runtime 风险与工具链风险分层管理；本作业优先保证 reviewer 可复现与功能正确。
- **措施**：使用 `package.json` 的 `overrides` 修补可安全修补的传递依赖，并复跑 `ci:local` 验证。
- **证据**：SECURITY.md 的 “Dependency audit posture / Current audit results”。

---

## 3) 看起来奇怪但有原因（反直觉代码）

### 3.1 前端里既有事件监听，又有 `provider.on('block')`

- **原因**：事件是主路径；`block` 监听是兜底。为了避免“事件偶发丢失/重连”导致 UI 永远不更新。
- **约束**：严格节流 + tx pending 时禁用，避免性能问题。

### 3.2 Hardhat 测试里用 `getFunction('supply')` 而不是 `contract.supply(...)`

- **原因**：Hardhat/ethers v6 在 TS 层常把合约实例推断成 `BaseContract`，直接调用会在编辑器里产生类型红线。
- **取舍**：用 `getFunction` 换取 **类型正确 + 与前端写模型一致** 的调用方式。
- **位置**：`test/SimpleLending.integration.ts`

---

## 附：提交标准

- “战略性注释”只写在会误导 reviewer 的关键点（取舍/边界/反直觉），避免注释噪音。
- 任何工具链/依赖调整必须通过 `npm run ci:local` 回归验证。
