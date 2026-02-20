# 排错与已知限制（企业技术文档）

**用途**：环境排错与产品已知限制的统一口径，供审计/面试/交付说明使用。与 [11-FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.2 的 Known limitations 摘要保持一致。

---

## 一、排错（Troubleshooting）

### 1. CreateFileMapping 错误（Windows Git Bash）

**现象**：在 **Windows Git Bash** 下执行 `npm run build`、`npx tsc` 或其它 Node/npm 脚本时报：

```
fatal error - CreateFileMapping ... Win32 error 5. Terminating.
```

**原因**：Git Bash 在 Windows 下的环境限制（内存映射/权限），非本仓库代码问题。

**处理**：改用 **PowerShell**、**CMD** 或 **WSL** 执行相同命令即可。

### 2. 抵押/Supply 确认后不跳转钱包

**现象**：在 Dashboard 点 Supply（抵押）→ 预检弹窗点「确认」后，没有弹出 MetaMask 等钱包确认交易。

**原因**：预检逻辑在「写链与读链不一致」或「当前链上合约地址无 code」时会禁止发交易，点确认只会报错并 **不会** 调用 `actions.supply()`，因此不会出现钱包弹窗。对应条件为 `writesDisabledByMismatch`：

- **读链 ≠ 钱包链**（如前端读的是 127.0.0.1:8545 的 31337，而 MetaMask 未切到 31337）；
- **或** 当前链上 `simpleLending`/`usd8` 地址没有 code（链重置/未部署或前端用的旧部署）。

**处理**：

1. 打开前端的 **/diagnostics** 页，确认「Read chainId」与「Wallet chainId」均为 **Yes**，且「Chain & contract addresses」一致。
2. 若为 No：按 [09-本地链标准与地址.md](09-本地链标准与地址.md) 最短闭环操作：节点 → `deploy:localhost`（及 `deploy:p9` 等）→ **必须重启前端** → MetaMask 添加/切换为 RPC `http://127.0.0.1:8545`、Chain ID **31337** → 刷新页面后再试。
3. 当存在网络/地址不一致时，预检弹窗会**禁用「确认」按钮**并显示提示（如：请将 MetaMask 切换到 RPC 127.0.0.1:8545、chainId 31337）。按提示修正后再点确认即可正常弹出钱包。

**代码位置**：`frontend/src/hooks/usePreflight.ts`（`confirmPreflight` 内对 `writesDisabledByMismatch` 的 early return）、`frontend/src/pages/DashboardPage.tsx`（`writesDisabledByMismatch` 的取值与传入 `usePreflight` / `PreflightModal`）。

### 3. Tooltip（无障碍与边界）

- 全站使用原生 HTML `title` 作为 tooltip（清算价、健康因子、利用率等）。
- **浏览器缩放 125%/150%**：原生 tooltip 位置由浏览器决定，可能被裁切。
- **顶部 KPI 悬停**：小视口下 tooltip 可能出屏。
- **Tab 聚焦**：仅 **可聚焦** 元素（按钮、链接）在键盘聚焦时显示 tooltip；仅带 `title` 的 `<span>` 在多数浏览器下聚焦不显示。
- **移动/触摸**：无 hover；长按可能显示或不可用。重要内容仍通过标签与文案呈现。
- 桌面与审计演示可接受；若需键盘/触摸全覆盖可后续替换为自定义 tooltip 组件。

---

## 二、已知限制与非目标（Known Limitations）

### 1. Multi-collateral 文案（当前单抵押）

- **现状**：产品为**单抵押**模型（当前仅 USD8 抵押/借贷）。
- **UI**：Liquidation price 等 tooltip 使用协议级表述（"multi-collateral uses the earliest liquidation threshold"）；当前实现为单抵押，该文案为协议扩展口径。见 `frontend/src/config/ui.ts` 中 `riskLiquidationPriceTooltip` 注释。

### 2. Total liquidity USD（当前为 token 量 1:1 代理）

- **现状**：Markets 页「Total liquidity (USD)」在单资产 USD8 场景下用 `pool.totalSupply` 经格式化展示，按 1:1 视为 USD。
- **说明**：主网需依赖 price oracle 换算；当前 local/mock 为 USD8 数量直显。见 `MarketsPage.tsx` 注释及 [11-FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) 14.1。

### 4. Activity 表：Desktop-first 与窄屏

- **现状**：Activity 表头完整，desktop-first；窄屏通过 CSS 媒体查询切换为卡片布局。
- **说明**：主网可考虑将 Gas/Block/Link 收起到行内展开或二次页；当前无行内展开。见 [11-FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) 8.x / 14.5。

### 5. Error reporting 与可追溯

- **现状**：错误上报为 **local-only**（控制台、UI InlineError/DataStatusBar、TxStatus 与 debug context）；无 Sentry 或远程错误收集。
- **说明**：可追溯依赖 **sessionEvidence**（Diagnostics 页 Session evidence、Download、Copy debug bundle）；生产可集成 Sentry。  
- **口径**：*"Error reporting is local-only; production can integrate Sentry."*

### 6. 占位符与只读模式

- **占位符**：未知/不可用用「—」；数值为 0 用「0」；未连接钱包用明确提示。见 `config/ui.ts` 中 `emptyPlaceholder` 注释。
- **主网只读**：`VITE_READ_ONLY_MAINNET=true` 且连接主网时，Dashboard 显示 Read-only 横幅，所有写操作禁用。

---

---

## 三、本地 Gas 与「卡住」排查

**结论**：本地链（31337）不需要、也不会消耗真实 ETH 作为 Gas。Hardhat 默认为前 20 个账户各预置 10,000 测试 ETH。前端发交易前会先做 **estimateGas**；若报错，多为合约 revert（地址错、储备暂停、未批准），不是「缺 Gas」。

**「卡住」常见原因**：① 链/地址未对齐（链重启后未重新部署或前端未强刷、MetaMask 非 31337）；② 储备/池子被暂停；③ 需先 Approve 再 Supply，Approve 的 estimateGas 失败则不会弹钱包。处理：按 [09-本地链标准与地址.md](09-本地链标准与地址.md) Part 1 起链 → `deploy:localhost` → `deploy:p9` → `verify:consistency` → MetaMask RPC http://127.0.0.1:8545、Chain ID 31337 → 强刷前端；Supply 仍失败可执行 `npm run ops:fix-supply-revert` 并确认先 Approve 再 Supply。自检清单见 [09-本地链标准与地址.md](09-本地链标准与地址.md) Part 2 §5。

**文档版本**：与当前代码注释及 FULL-LINK-TEST-CHECKLIST §0.2 一致。新增限制时请同步本页与 FULL-LINK §0.2 的 Known limitations 摘要。
