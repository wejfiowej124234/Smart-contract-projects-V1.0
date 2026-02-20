# 多维度深度检查与本地前端验证清单

**用途**：本地启动后在前端做**多维度、全流程**验证，确保功能可用、流程顺畅、业务逻辑正确。与 [09-本地链标准与地址.md](../09-本地链标准与地址.md)、[DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md)、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) 配套使用。

---

## 一、多维度检查维度概览

| 维度 | 检查要点 | 对应文档/代码 |
|------|----------|----------------|
| **环境与门禁** | GATE 五项、RPC、chainId、deployments 同步、读合约 | 09 Part 1–2；verify:consistency；/diagnostics |
| **配置** | 前端 RPC/chainId、READ_ONLY_MAINNET、VITE_*、无硬编码 | network.ts、runtime.ts、configs/localChain.mjs |
| **路由与页面** | 各页可访问、无白屏、占位与错误态明确 | App.tsx；各 Page |
| **Dashboard 流程** | 连接钱包→余额/仓位展示→Supply/Withdraw/Borrow/Repay 全流程 | useDashboard、useActions、usePreflight、ActionCardsGrid |
| **预检与交易** | 预检弹窗→确认→钱包弹窗→pending→confirmed/失败；网络不一致时禁用确认 | PreflightModal、usePreflight、tx.ts、useActions |
| **状态与刷新** | tx 确认后余额/仓位/Activity 更新；pending 恢复；块落后提示 | useDashboard refresh、onConfirmed、txHistory、DataStatusBar |
| **错误与边界** | 错误文案、revert 提示、用户拒绝、超时/卡住 | errors.ts、ui.ts、TxStatus、10-TROUBLESHOOTING |
| **Governance / Markets / Activity** | 治理页 KPI 与提案、Markets 池数据、Activity 历史与筛选 | GovernancePage、MarketsPage、ActivityPage、txHistory |
| **已知限制** | 主网只读、本地无区块浏览器、Tooltip/缩放、单抵押文案 | 10-TROUBLESHOOTING §2–§6 |

---

## 二、本地启动前置（必须先满足）

按 [09-本地链标准与地址.md](../09-本地链标准与地址.md) 最短闭环执行：

| 步骤 | 操作 | 验收 |
|------|------|------|
| 1 | 启动节点 | `npx hardhat node`，控制台出现 `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/` |
| 2 | 部署 | `npm run deploy:localhost` → `npm run deploy:p9`（新开终端，项目根目录） |
| 3 | 启动前端 | `cd frontend && npm run dev`；**若部署时前端已在跑，必须先停再重新启动** |
| 4 | 钱包 | MetaMask 添加/选择网络：RPC `http://127.0.0.1:8545`，Chain ID `31337` |
| 5 | 强刷 | 浏览器打开应用后 **Ctrl+Shift+R**（Mac Cmd+Shift+R） |
| 6 | 门禁 | 打开 **/diagnostics**，确认 **Read chainId**、**Wallet chainId**、**Deployments** 三项均为 **Yes** |

**注意**：Windows 下若使用 Git Bash 出现 CreateFileMapping 错误，改用 **PowerShell** 或 CMD 执行 npm/node 命令（见 [10-TROUBLESHOOTING](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) §1）。

---

## 三、本地前端检查清单（逐页、逐流程打勾）

### 3.1 诊断页 /diagnostics（先过门禁）

| # | 检查项 | Pass |
|---|--------|------|
| 1 | 页面可打开，无白屏 | ☐ |
| 2 | **Read chainId** 显示 Yes（读链 31337 正常） | ☐ |
| 3 | **Wallet chainId** 显示 Yes（MetaMask 在 31337） | ☐ |
| 4 | **Deployments** 显示 Yes（链与合约地址一致） | ☐ |
| 5 | RPC URL、Config fingerprint、Session evidence 等区域有内容 | ☐ |
| 6 | **Runtime risk (health enum)** 显示 Tier（low/medium/high）及 Reasons（Degraded 时有原因）；与状态栏健康枚举一致 | ☐ |
| 7 | 「Copy debug bundle」可复制；「Download session evidence」可下载 | ☐ |

三项均为 Yes 后再进行 Dashboard 写操作；否则会出现「确认后不跳转钱包」或红字（见 [10-TROUBLESHOOTING](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) §2）。修复后完整回归见 [ORACLE-LTV-UNITS-AND-REGRESSION.md](ORACLE-LTV-UNITS-AND-REGRESSION.md) §八。

---

### 3.2 布局与通用

| # | 检查项 | Pass |
|---|--------|------|
| 7 | 顶部 Header：连接钱包、切换网络、主题切换、导航（Dashboard / Markets / Governance / Activity / Settings） | ☐ |
| 8 | 未连接时：显示「Connect」等引导，无报错堆栈 | ☐ |
| 9 | 连接后：显示账户与 chainId（31337）、可断开 | ☐ |
| 10 | 若链/部署不一致：出现**链与合约地址不一致**或**网络不匹配**横幅，且写操作被禁用 | ☐ |
| 11 | 底部 DataStatusBar：刷新、Block、RPC 状态、自动刷新开关（若有） | ☐ |
| 12 | 无障碍：Skip to main content、焦点顺序合理 | ☐ |

---

### 3.3 Dashboard（核心业务流）

| # | 检查项 | Pass |
|---|--------|------|
| 13 | 连接钱包且 /diagnostics 三项 Yes 后，Dashboard 无长红字（Contract read failed / Pool read failed） | ☐ |
| 14 | **余额**：USD8 / WETH 可用余额正确显示（非 —） | ☐ |
| 15 | **池子**：Supply APY、Borrow APY、Total supply、Total borrow、Utilization 有数值或 0 | ☐ |
| 16 | **仓位**：Supplied、Borrowed、Health factor、Max withdraw、Max borrow 符合当前状态 | ☐ |
| 17 | 四大操作卡片：Supply、Withdraw、Borrow、Repay 输入框与「Max」按钮可用（在满足条件下） | ☐ |
| 18 | **Supply**：输入金额 → 点提交 → 弹出**预检弹窗**（含金额、链、账户、Approval 模式等） | ☐ |
| 19 | 预检弹窗点「确认」→ **弹出 MetaMask**（Approve 或 Supply 交易）；若网络/地址不一致则**确认按钮禁用**并显示提示，不弹钱包 | ☐ |
| 20 | 首次 Supply 需先 **Approve USD8**，再 Supply；两笔均可在 MetaMask 确认 | ☐ |
| 21 | 交易 pending 时：有「签名中/待确认」等状态，按钮或操作区有 loading/禁用 | ☐ |
| 22 | 交易 confirmed 后：**余额、仓位、池子数据自动更新**；TxStatus 显示成功并可跳转 Activity | ☐ |
| 23 | **Withdraw**：有抵押时输入金额 → 预检 → 确认 → 钱包 → 确认后余额与仓位更新 | ☐ |
| 24 | **Borrow**：有抵押且 maxBorrow > 0 时输入金额 → 预检 → 确认 → 钱包 → 债务与 HF 更新 | ☐ |
| 25 | **Repay**：有债务时输入金额；若需 Approve 先 Approve 再 Repay；确认后债务与余额更新 | ☐ |
| 26 | 输入非法金额（如字母、超上限）：提交禁用或预检/合约报错有明确提示 | ☐ |
| 27 | Withdraw/Borrow 无额度时（maxWithdraw/maxBorrow 为 0 或无债务）：对应按钮禁用并有原因提示 | ☐ |
| 28 | 预检中 **Simulation failed** 时：policy=block 则确认禁用；policy=warn_allow 则需勾选「我理解」后可继续 | ☐ |

---

### 3.4 Markets

| # | 检查项 | Pass |
|---|--------|------|
| 29 | 页面可打开，有池子总览（Total supply、Total borrow、Utilization、Supply APY、Borrow APY） | ☐ |
| 30 | 储备列表（当前为单资产 USD8）有数据；排序/筛选（若有）可用 | ☐ |
| 31 | 点击资产进入 **Asset detail**（/markets/:assetId）可打开，数据与 Markets 一致 | ☐ |
| 32 | 图表占位或 mock 数据不报错（见 [10-TROUBLESHOOTING](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) §2 Total liquidity USD） | ☐ |

---

### 3.5 Governance

| # | 检查项 | Pass |
|---|--------|------|
| 33 | 页面可打开；未连接时显示「连接钱包」类提示 | ☐ |
| 34 | 连接后：KPI（Active proposals、Total proposals、Timelock、Voting power、Pool pause 状态等）有数值或 — | ☐ |
| 35 | 提案列表（若有）可展示；状态、投票、Queue/Execute 等按钮状态正确 | ☐ |
| 36 | 无提案时显示空状态或占位，不报错 | ☐ |

---

### 3.6 Activity

| # | 检查项 | Pass |
|---|--------|------|
| 37 | 页面可打开；未连接或无历史时显示空状态提示 | ☐ |
| 38 | 完成至少一笔 Supply/Borrow/Repay/Withdraw 后，**Activity 列表出现该笔记录**（类型、金额、hash、状态） | ☐ |
| 39 | 筛选 All / Pending / Success / Failed 可用 | ☐ |
| 40 | 本地链 31337：区块浏览器链接为 #（无公开浏览器），不报错 | ☐ |
| 41 | Copy hash、View in explorer（主网才有有效链接）可用 | ☐ |

---

### 3.7 Settings / Admin

| # | 检查项 | Pass |
|---|--------|------|
| 42 | **Settings**：页面为占位（F5 可选），无白屏 | ☐ |
| 43 | **Admin**（/admin/proposals）：有权限/路由时可打开；提案列表与详情（若有）可访问 | ☐ |

---

### 3.8 错误与边界

| # | 检查项 | Pass |
|---|--------|------|
| 44 | 用户拒绝 MetaMask：提示为「用户拒绝」类，不弹多次钱包 | ☐ |
| 45 | 合约 revert（如超额、未 Approve）：有可读错误提示（如 insufficient liquidity、revert reason） | ☐ |
| 46 | RPC 不可达或链重置：Dashboard 红字或 diagnostics 非 Yes；按 09 最短闭环修复后可恢复 | ☐ |
| 47 | 数据落后（blocks behind）：状态栏有提示；若 tier=high 写操作禁用（见 runtime risk） | ☐ |

---

## 四、潜在问题与注意点（多维度审计结论）

以下为代码与流程梳理后的**已知或潜在点**，本地验证时留意即可；多数已有文档或逻辑防护。

| 类别 | 说明 | 处理/参考 |
|------|------|----------|
| **抵押确认后不跳转钱包** | writesDisabledByMismatch 时只报错不调 actions.supply | 已加固：预检禁用确认+提示；排错见 10-TROUBLESHOOTING §2；先过 /diagnostics 三项 Yes |
| **链与合约地址不一致** | 节点重启未重新部署或前端未重启 | 09 最短闭环：node → deploy → **重启前端** → MetaMask 31337 → 强刷 |
| **主网只读** | VITE_READ_ONLY_MAINNET=true 且连接主网时，所有写操作禁用 | 预期行为；见 10-TROUBLESHOOTING §6 |
| **本地无区块浏览器** | 31337 的 Activity「View in explorer」指向 # | 预期；见 network.ts BLOCK_EXPLORER_BASE[31337] |
| **Simulation failed** | 预检 estimateGas 失败时：block 则禁止确认；warn_allow 需勾选后才能确认 | usePreflight simulationFailedPolicy；主网未审计或 runtime risk 高时为 block |
| **Supply/Repay 先 Approve** | 首次 Supply/Repay 需先 Approve USD8，再发主交易 | 前端会先弹 Approve，再弹 Supply/Repay；见 useActions approveIfNeeded |
| **Activity 金额来源** | Activity 条目的 amount 来自提交时缓存的 lastSubmittedAmountRef | 仅 confirmed/failed 结算时写入；pending 时无新条目 |
| **Governance 无提案** | 本地刚部署可能无提案；KPI 仍可读（0 或 —） | 正常；创建提案需走 governance 脚本或 UI |
| **Tooltip/无障碍** | 125%/150% 缩放时 tooltip 可能被裁切；移动端无 hover | 10-TROUBLESHOOTING §3；重要信息以文案为主 |
| **Settings 占位** | Settings 页当前为占位（F5 可选） | 无功能需求可忽略 |
| **单抵押文案** | 部分 risk tooltip 使用「multi-collateral」协议级表述，当前为单抵押 | 10-TROUBLESHOOTING §2 已知限制 |

---

## 五、业务逻辑闭环自检（最小 happy path）

建议按以下顺序做一次**完整闭环**，确认流程顺畅：

1. **门禁**：/diagnostics 三项 Yes。
2. **Supply**：输入小额（如 100）→ 预检 → 确认 → MetaMask Approve（若需）→ MetaMask Supply → 等待 confirmed。
3. **Dashboard 更新**：余额减少、Supplied 增加、Health factor 等更新。
4. **Borrow**：输入小于 maxBorrow 的金额 → 预检 → 确认 → 钱包 → confirmed；债务与 HF 更新。
5. **Activity**：打开 Activity，看到 Supply、Borrow 两条记录，状态为 success。
6. **Repay**：部分或全部 Repay → Approve（若需）→ Repay → confirmed；债务减少。
7. **Withdraw**：部分或全部 Withdraw → 预检 → 确认 → 钱包 → confirmed；抵押与余额更新。

若以上任一步失败：先回到 /diagnostics 确认三项 Yes，再按 09 最短闭环与 [10-TROUBLESHOOTING](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) 对应条目排查。

---

## 六、与现有文档关系

| 文档 | 关系 |
|------|------|
| [09-本地链标准与地址.md](../09-本地链标准与地址.md) | 本地链 SSOT；门禁、最短闭环、Evidence Pack |
| [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) | 调试顺序 A→E；本清单对应 A（基础一致性）+ 前端/Dashboard 流程 |
| [10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 已知限制、CreateFileMapping、抵押不跳转钱包、Tooltip、Gas 卡住 |
| [CHECKLIST_E2E.md](CHECKLIST_E2E.md) | E2E 门禁与关键用例；本清单为人肉前端验证的细化版 |
| [ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN.md](ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN.md) | 单次门禁执行报告；本清单为持续使用的验证清单 |

---

**文档版本**：与 09、10、DEBUG_PLAYBOOK、ENTERPRISE 报告一致。本地启动后按 **§二 前置** 再按 **§三 清单** 逐项打勾即可完成多维度、全流程验证。
