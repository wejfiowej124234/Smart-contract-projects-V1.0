# 企业级审计与排错执行报告（单次运行留证）

**执行日期**：2026-02-19（UTC）  
**依据**：[09-本地链标准与地址.md](../09-本地链标准与地址.md)（SSOT）、[DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) A–E、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md)。  
**用途**：门禁化判定（GATE 五项）+ 一致性校验 + 合约单测 + 已知问题（抵押确认后不跳转钱包）根因与修复留证，便于可复现、可回归、可审计。

---

## 一、执行摘要

| 项 | 结果 | 说明 |
|----|------|------|
| **GATE 五项** | ✅ 全部通过 | 节点已起、chainId 31337、deployments 与前端同步、链上有 code、sentinel 读合约通过 |
| **verify:consistency** | ✅ CONSISTENT | 节点 chainId + genesis、deploy 地址、frontend deployments、链上 code 对齐 |
| **合约单测** | ✅ 75 passing | 含 SimpleLending 集成、Fuzz、Invariants、Oracle、RiskEngine、FlashLoan、Governance 等 |
| **sentinel:read** | ✅ SENTINEL_PASSED | getCode/balanceOf/getPoolInfo/getUserPosition/getPrice 等均 OK |
| **抵押确认后不跳转钱包** | ✅ 已定位并加固 | 根因：writesDisabledByMismatch；UI 已禁用确认并提示；排错文档已补 §2 |

---

## 二、GATE 五项门禁结果

| GATE 项 | 含义 | 本次结果 | 验收依据 |
|---------|------|----------|----------|
| **CHAIN_ID_OK** | 链 ID 一致 | ✅ | 节点 chainId 31337；verify 输出 `chainId: 31337` |
| **RPC_OK** | RPC 可达 | ✅ | `npx hardhat node` 已起，`http://127.0.0.1:8545` 可连 |
| **DEPLOYMENTS_SYNC_OK** | 部署与前端同步 | ✅ | `verify:consistency`：frontend 31337 present, addresses match root |
| **READ_CONTRACT_OK** | 至少能读一个 view | ✅ | `sentinel:read`：getPoolInfo、getUserPosition、getPrice 等 OK |
| **HEALTHY_LOCAL** | 健康本地态 | ✅* | 节点+部署+一致性已满足；*前端需用户本地启动并打开 /diagnostics 三项 Yes、Supply 跑通一次即完整满足 |

---

## 三、一致性校验输出（摘录）

```
--- Local chain consistency check ---
RPC: http://127.0.0.1:8545
Expected chainId: 31337

Node:
  chainId: 31337
  genesisHash: 0x4ac2417c1a92c634de07d0d96d4edb01e59ebcbf62c6035fb1e6a39baede2c4b

Deployments:
  root (deploy:localhost): .../deployments/31337.json
  simpleLendingAddress: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
  frontend: 31337 present, addresses match root

--- RESULT: CONSISTENT ---
Node chainId + genesis, deploy addresses, frontend deployments, and chain code are aligned.
MetaMask must use: RPC http://127.0.0.1:8545, chainId 31337.
```

---

## 四、合约单测结果（摘录）

- **通过数量**：75 passing（含 validate-evidence-summary 9 tests）
- **关键套件**：SimpleLending (integration)、Fuzz (P8)、Invariants (P8)、LinearRateStrategy、ReserveLogic、RiskEngine (P7)、Oracle (P6)、FlashLoan、Governance/Pause/Configurator 边界等
- **命令**：`npx hardhat test`

---

## 五、Sentinel 读链诊断（摘录）

```
[getCode] usd8 / weth / simpleLending / oracle: has code
[OK] usd8.symbol: USD8, balanceOf(account), getPoolInfo, getUserPosition, getPrice(USD8)
--- Summary ---
SENTINEL_PASSED: true
ROOT_CAUSE: NONE
```

---

## 六、已知问题：抵押/Supply 确认后不跳转钱包

### 6.1 根因（已确认）

- **现象**：预检弹窗点「确认」后，不弹出 MetaMask 等钱包。
- **根因**：`writesDisabledByMismatch === true` 时，`confirmPreflight` 会设置 `preflightError` 并 **直接 return**，**不会** 调用 `actions.supply(amountText)`，故不会触发钱包弹窗。
- **writesDisabledByMismatch 成立条件**（见 DashboardPage）：
  - **split.mismatch**：读链（127.0.0.1:8545）chainId ≠ 钱包 chainId（如 MetaMask 未切到 31337）；
  - **或** **!chainAddressMatch**：当前链上 simpleLending/usd8 地址无 code（链重置/未部署或前端旧地址）。

### 6.2 已做加固

1. **PreflightModal**：当 `writesDisabledByMismatch` 为 true 时**禁用「确认」按钮**，并**固定显示**网络/地址不一致提示（如：请将 MetaMask 切换到 RPC 127.0.0.1:8545、chainId 31337），避免用户误点后只报错不弹窗。
2. **10-TROUBLESHOOTING**：新增 **§2. 抵押/Supply 确认后不跳转钱包**：现象、根因、处理步骤（/diagnostics、09 最短闭环、MetaMask 31337）、代码位置。

### 6.3 用户侧排错步骤

1. 打开 **/diagnostics**，确认 Read chainId、Wallet chainId、Deployments 三项均为 **Yes**。
2. 若任一项为 No：按 [09-本地链标准与地址.md](../09-本地链标准与地址.md) 最短闭环：节点 → `deploy:localhost` → `deploy:p9` → **重启前端 dev** → MetaMask RPC `http://127.0.0.1:8545`、Chain ID **31337** → 强刷后再试。
3. 若预检弹窗内「确认」为禁用且出现网络/地址提示，按提示修正后再点确认即可正常弹出钱包。

---

## 七、Evidence Pack 最小集（本次运行）

| 证据项 | 内容/位置 |
|--------|-----------|
| **diagnostics** | 需用户本地启动前端后打开 `/diagnostics` 截图（三项 Yes） |
| **deployments** | `deployments/31337.json`（本次 simpleLendingAddress: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707） |
| **一致性结果** | 本文 §三 verify:consistency 输出 |
| **单测结果** | 本文 §四；命令 `npx hardhat test` |
| **sentinel** | 本文 §五；命令 `npm run sentinel:read` |
| **Hardhat node** | 已起于 127.0.0.1:8545；若需留证可保存启动日志片段 |

---

## 八、环境与约定

- **Shell**：Windows 下若使用 Git Bash 出现 CreateFileMapping Win32 error 5，改用 **PowerShell** 或 CMD 执行 npm/node 命令（见 [10-TROUBLESHOOTING](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) §1）。
- **节点**：本次审计前已执行 `npx hardhat node`（后台）、`npm run deploy:localhost`、`npm run deploy:p9`，再执行 `node scripts/verify-local-chain-consistency.mjs`、`npx hardhat test`、`npx hardhat run scripts/sentinel-read-diagnostic.ts --network localhost`。

---

**报告版本**：与 09、DEBUG_PLAYBOOK、10-TROUBLESHOOTING、ENTERPRISE-FRONTEND-BACKEND-CHECK 一致。后续复跑门禁可复用本文结构并更新 §三–§五 输出与 §七 证据。
