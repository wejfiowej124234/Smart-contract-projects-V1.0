# 全链路测试清单（Full-Link Test Checklist）

**依据**：本项目实际路由、页面与功能（App.tsx、各 Page、Layout、合约 deployments）。  
**用途**：本地启动 + 钱包 + 治理币/智能合约币 + 四大主页面及全部 UI 功能的手测/E2E 覆盖参考。

**入口说明**：主导航仅 4 个链接（Dashboard、Markets、Governance、Activity）。Settings、Diagnostics 无主导航入口，需**直接访问** `/settings`、`/diagnostics`；错误网络/无部署时 **ChainDeploymentFixBanner** 会提供「Go to Diagnostics」链接。

**执行状态**：**一、本地启动**与**三、资产与合约**已由门禁 + diagnose:dashboard + sentinel:read 实测通过（见本节 §0.2「测试执行报告与证据引用」）。二、四～十四需手测或 E2E 通过后逐项打勾。

---

## §0 推荐执行顺序与结果摘要（原执行总结已合并）

**推荐顺序（企业流程）**：`npm run e2e:smoke` →（起链 + deploy:localhost + deploy:p9）→ `npm run e2e:core` → `npm run p10:gate`。**p10:gate 默认只跑 e2e:core**（smoke + core-flow）；全量 e2e:ui 仅 `E2E_TIER=nightly` 或 `npm run p10:gate -- --full`（见本节 §0.1 E2E 层级与门禁执行流）。

```bash
npm run e2e:smoke
# 起链 + 部署：终端 1 → npm run demo:chain；终端 2 → npm run deploy:localhost && npm run deploy:p9
npm run e2e:core
npm run p10:gate
```

**e2e:core 前置**：依赖本地链 8545 与 deploy 已完成；未起链时 core-flow 会因 RPC 不可用失败。

| 阶段 | 结果说明 |
|------|----------|
| 门禁→治理 | gate-validation → 起链 → deploy:localhost → diagnose → sentinel → deploy:p9 → governance 全步骤可全过。 |
| e2e:core | smoke 稳定通过；core-flow 在 headless 下可能超时，本地浏览器或更长超时可复现。 |
| evidence-pack | 若需「部署+治理+证据包」通过而跳过 E2E，可使用 **`SKIP_E2E_UI=1 npm run p10:gate`**（exit 0，生成 evidence-pack）。 |

**常见错误**：Windows Git Bash 下 CreateFileMapping 错误见 [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) §一；E2E 超时与复跑说明见 [06-AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C、[03-08-deployment-runbook.md](03-08-deployment-runbook.md) §8。

---

## §0.1 E2E 层级与门禁执行流（原 E2E-TIERS 已合并）

**三层**：smoke（~10s，e2e:smoke）→ core-flow（e2e:core，本地链完整闭环）→ full forensic（e2e:ui/e2e:nightly）。**门禁默认**：`p10:gate` 执行 **e2e:core**（smoke + core-flow）；全量 E2E 仅 `E2E_TIER=nightly` 或 `npm run p10:gate -- --full`。全量 E2E 即 `scripts/ci/run-e2e-ui.mjs --project=chromium`（与 `npm run e2e:ui` 相同）。**执行流**：p10:gate → gate-validation → 起链 → deploy:localhost → diagnose → sentinel → deploy:p9 → governance → E2E tier（core 或 nightly）→ 若 SKIP_E2E_UI=1 则跳过 e2e → generate-evidence-pack → exit 0。**状态轮询**：等 app-layout（waitForProviderReady + waitForAppLayoutAfterProvider）、等 KPI（waitForBlockOrKpiVisible）、等交易（waitForTxConfirmed）；见 e2e/fixtures.ts。

---

## §0.2 Go/No-Go 决策与测试执行报告（原 GO-NOGO 已合并）

**Release 标识**：Release ID（如 v1.0.0-local）、gitSha（与 evidence-pack 一致）、appVersion（根 package.json version）。**Gate 结果**：ci:local / p10:gate（8545 空闲下 `npm run p10:gate` exit 0）、Governance smoke、Mainnet read-only（可选）。**Evidence pack**：门禁控制台 `EVIDENCE-PACK-MANIFEST-SHA256`；路径 `evidence-pack/`（manifest.json、evidence-summary.json、deployments-31337.json、p10-gate-output.txt）。**Decision**：GO / Read-only GO / NO-GO；理由与批准人/日期；已知限制与 [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) 一致。**测试执行报告与证据引用**：执行环境（OS、Node/npm、chainId、appVersion、gitSha）以门禁控制台及 evidence-pack/evidence-summary.json 为准；Checklist 见本清单一～十四；Pass/Fail 见门禁输出；证据引用 evidence-pack/、Manifest SHA256、复现 `npm run release-proof:report` 或 evidence-pack 内 JSON；清单章节与门禁对应（一 本地启动 = 门禁 1.1–1.7，二 钱包/三 资产与合约 = 诊断+哨兵，四～十四 = 手测或 E2E）。

---

## 一、本地启动（环境 + 链 + 部署 + 前端）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 1.1 | 端口 | 8545 未被占用（门禁会检测） | ☑ |
| 1.2 | 起链 | `npm run demo:chain` 或 `npx hardhat node`，终端显示 chainId 31337 / Local chain ready | ☑ |
| 1.3 | 部署 P0–P8 | `npm run deploy:localhost`，输出含 USD8 / SimpleLending / aToken / 等地址 | ☑ |
| 1.4 | 部署 P9（治理） | `npm run deploy:p9`（可选）；或直接 `npm run p10:gate` 一次性完成 | ☑ |
| 1.5 | 前端配置 | `frontend/src/contracts/deployments.json` 含 31337 的地址（根目录 `deployments/31337.json` 需由 deploy 脚本或 CI 同步到前端，见 scripts/_lib/export.ts） | ☑ |
| 1.6 | 启动前端 | `cd frontend && npm run dev` 或 `node scripts/demo/start-frontend.mjs`（后者注入 RPC） | ☑ |
| 1.7 | 打开应用 | 浏览器访问 http://127.0.0.1:5173，首屏可加载（与 vite.config.ts 一致） | ☑ |

---

## 二、钱包（Wallet）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 2.1 | 未安装 MetaMask | 点击 Connect → 跳转安装页或提示安装 | ☐ |
| 2.2 | 连接钱包 | 点击 Connect → 选择账户 → 显示“Connected”及短地址 | ☐ |
| 2.3 | 链与网络 | 连接后显示 chainId 31337（或“Hardhat Local”）；Header 显示网络/OK 状态 | ☐ |
| 2.4 | 错误网络 | 若当前链非 31337，显示 Wrong network / 切链横幅 | ☐ |
| 2.5 | 切链 | 点击 Switch network → MetaMask 切到 31337，页面刷新后使用正确部署 | ☐ |
| 2.6 | 断开 | 点击 Disconnect → 账户清空，需重新 Connect 才能操作 | ☐ |
| 2.7 | 无部署链 | 链正确但无 deployments（如新链）→ 显示 ChainDeploymentFixBanner（chainDeploymentMismatchTitle/Body）；三按钮：Copy 部署命令（复制后 Toast）、Troubleshooting 链接（/diagnostics#troubleshooting）、Go to Diagnostics（/diagnostics） | ☐ |
| 2.8 | 主网只读模式 | 当 `VITE_READ_ONLY_MAINNET=true` 且连接主网时，Dashboard 显示「Read-only mode」横幅，所有写操作（Supply/Borrow/Approve 等）禁用，不发送交易 | ☐ |

---

## 三、资产与合约（治理币、智能合约币、Oracle）

| # | 项 | 说明/验证点 | Pass |
|---|----|--------------|------|
| 3.1 | **USD8** | 抵押品/借贷资产；Dashboard 显示钱包余额、Pool totalSupply/totalBorrow、Position supplied/borrowed | ☑ |
| 3.2 | **WETH** | 部署中存在；前端合约层可读（若 UI 展示） | ☑ |
| 3.3 | **aToken** | 供应凭证；deployments 含 aTokenAddress；余额/利息逻辑与合约一致 | ☑ |
| 3.4 | **variableDebtToken** | 借贷债务凭证；deployments 含 variableDebtTokenAddress | ☑ |
| 3.5 | **治理币 (GovToken)** | 治理用；Governance 页显示 Voting power、Delegated to；Delegate 操作使用 GovToken | ☐ |
| 3.6 | **Oracle** | deployments 含 oracleRouterAddress；Dashboard 风险/清算相关若用价格则来自 Oracle | ☑ |
| 3.7 | **Lending / Configurator / Timelock / Governor** | 部署地址正确；Governance 页读取 Governor、Timelock；Pause 使用 Lending/Pool | ☑ |

---

## 四、主布局与导航（Layout + Header）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 4.1 | 品牌与主题 | Header 显示 appName、appLogo；主题切换按钮（Light/Dark/Navy）可切换且生效 | ☐ |
| 4.2 | 主导航 | Dashboard、Markets、Governance、Activity 四个主入口可点击且高亮当前页（Settings/Diagnostics 不在主导航，见文首入口说明） | ☐ |
| 4.3 | Nav 角标 | Dashboard/Governance/Activity 有数据时角标正确（如 Activity “1 pending”） | ☐ |
| 4.4 | Skip to main | “Skip to main content” 可聚焦到主内容区 | ☐ |
| 4.5 | 底部/其他 | Risk disclaimer、Toast 容器正常渲染 | ☐ |

---

## 五、Dashboard 页（/）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| **5.1 连接与数据状态** |
| 5.1.1 | 未连接 | 显示 Connect 提示/行动区，无池子与仓位数据 | ☐ |
| 5.1.2 | 连接后加载 | 显示 Loading 或骨架，然后 Pool/Position/KPI 有数据或占位“—” | ☐ |
| 5.1.3 | 错误态 | 合约读失败时 InlineError/DataStatusBar 有明确提示 | ☐ |
| **5.2 KPI 与池子** |
| 5.2.1 | KPI 条 | Borrow limit、Borrow limit used、Available to borrow、Total supply、Total borrow 数值/占位正确 | ☐ |
| 5.2.2 | KPI tooltip | Borrow limit used 等有 tooltip（分母/阈值说明） | ☐ |
| 5.2.3 | Pool 概览 | Pool overview 卡片：totalSupply、totalBorrow、utilization、supplyRate、borrowRate | ☐ |
| 5.2.4 | User position | supplied、borrowed、healthFactor、maxWithdraw、maxBorrow、颜色与数值一致 | ☐ |
| **5.3 风险区** |
| 5.3.1 | Risk 卡片 | Health factor 条、HF 数值、HF 风险标签（Healthy/At risk/Critical/No debt） | ☐ |
| 5.3.2 | Liquidation price | 有债务时显示清算价格（USD）及子文案“Liquidation threshold X%”；无债务“—” | ☐ |
| 5.3.3 | Liquidation / HF tooltip | 清算价格与 HF 标签具口径/阈值 tooltip（oracle、多抵押说明、HF 区间） | ☐ |
| 5.3.4 | Borrow usage 环 | 环形图与百分比与仓位一致 | ☐ |
| 5.3.5 | Risk parameters | LTV/LT 等参数面板（若有）展示正确 | ☐ |
| **5.4 四张 Action 卡（Supply / Withdraw / Borrow / Repay）** |
| 5.4.1 | Supply | 输入金额、Max、Submit；未 approve 时先 Approve（见 5.5）再 Supply | ☐ |
| 5.4.2 | Withdraw | 输入金额、Max（不超过 maxWithdraw）、Submit；受 HF 约束 | ☐ |
| 5.4.3 | Borrow | 输入金额、Max（不超过 maxBorrow）、Submit；受 HF 约束 | ☐ |
| 5.4.4 | Repay | 输入金额、Max（不超过 borrowed）、Submit | ☐ |
| 5.4.5 | 禁用态 | 无仓位/无额度时对应卡 disabled，reason 文案正确 | ☐ |
| 5.4.6 | 来自 Markets | 从 Markets 点击 Supply/Borrow 跳转 Dashboard 并带 ?action=supply|borrow&asset= 时，滚动到对应卡并预选资产 | ☐ |
| **5.5 Approve 与 Preflight** |
| 5.5.1 | Approve 工具栏 | Exact / Infinite 单选；Infinite 时显示风险提示 | ☐ |
| 5.5.2 | Supply 前 Approve | 若 allowance 不足，先 Approve（exact 或 infinite）再 Supply | ☐ |
| 5.5.3 | Preflight 弹窗 | 点击 Submit 后弹出“Confirm transaction”，展示 Action/Amount/Token/Spender 等，确认后才发交易 | ☐ |
| 5.5.4 | 交易中状态 | 提交后 TxStatus/pending 显示；成功后 Toast、余额/仓位刷新 | ☐ |
| **5.6 其他** |
| 5.6.1 | 合约地址区 | 展示 SimpleLending、USD8 等地址（可复制/短地址） | ☐ |
| 5.6.2 | Data 来源/状态 | DataStatusBar、数据来源 Oracle 等说明（若有） | ☐ |
| 5.6.3 | Chain proof | Genesis block hash 等链上锚点（若有） | ☐ |
| 5.6.4 | Pause/Unpause | PauseUnpauseBar：仅 pauser 可见；Pause 后 Supply/Borrow 等被阻断；Unpause 后恢复 | ☐ |
| 5.6.5 | 空态 CTA 滚动 | Pool/Position 为空时「Start by supplying USD8」按钮点击后滚动到 Supply 卡（#action-card-supply） | ☐ |

---

## 六、Markets 页（/markets）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 6.1 | 未连接 | 显示“连接钱包以加载”等提示 | ☐ |
| 6.1a | Loading / Error | 连接且有部署时：loading 显示“Loading market data…”（pageStateLoading）；error 显示 pageStateError 与 errorText；仅 !loading && !error 时渲染表格与卡片 | ☐ |
| 6.2 | 连接后 | 顶部 KPI 卡片：Supply APY、Borrow APY、Total supply、Total borrow、Utilization | ☐ |
| 6.3 | 排序 | Sort by：APY / Utilization / Total supply 切换，表格排序正确 | ☐ |
| 6.4 | 筛选 | Filter by asset（若有），筛选后仅显示对应资产 | ☐ |
| 6.5 | 储备表格 | 列：Asset、Supply APY、Borrow APY、Utilization、Total liquidity (USD)、Total supply、Total borrow、LTV/LT（若有）、Actions | ☐ |
| 6.6 | Utilization 语义 | 低/中/高 utilization 颜色与 tooltip/aria-label/● 一致 | ☐ |
| 6.7 | Total liquidity USD | 有数据时格式（含 compact K/M/B）；无数据时“—”且 muted | ☐ |
| 6.8 | Supply/Borrow 按钮 | 每行 Supply、Borrow 跳转 Dashboard 并带 ?action=supply|borrow&asset= 对应 symbol | ☐ |
| 6.9 | Coming soon 区 | Mock 资产（如 USDC/ETH/DAI）显示 Coming soon，按钮禁用；可打开“What this means”说明 | ☐ |
| 6.10 | 图表 | PriceVolumeChart（若有）展示与数据一致 | ☐ |
| 6.11 | 空池提示 | 池子为空时提示 Supply 起步 | ☐ |

---

## 七、Governance 页（/governance）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 7.1 | 未连接 | 显示“连接钱包”等提示 | ☐ |
| 7.2 | Overview KPI | Active proposals、Total proposals、Timelock、Voting power、Delegated to、Pool pause 状态、Quorum 等 | ☐ |
| 7.3 | DAO 参数 | Voting period、Proposal threshold、Timelock delay 等（若有） | ☐ |
| 7.4 | 我的信息 | My voting power、Delegated to、Can execute (Yes/No) | ☐ |
| 7.5 | Delegate | 点击 Delegate → 弹窗输入 delegatee 地址 → 提交后 GovToken 委托成功 | ☐ |
| 7.6 | 提案列表表头 | ID、Title、State、Votes、ETA、Actions | ☐ |
| 7.7 | 空态 | 无提案时一行占位：“No proposals yet”、状态“—”、ProposalStateTimeline 占位、Lifecycle states (example) hint、Create proposal 按钮 | ☐ |
| 7.8 | 有提案时 | 每行：ID、标题、状态 pill、ProposalVotesBar（For/Against/Abstain）、TimelockCountdown（若 Queued）、Vote / Queue / Execute / Cancel 按钮（按状态显示） | ☐ |
| 7.9 | Vote | 点击 Vote → 弹窗选择 For/Against/Abstain → 提交，castVote 成功 | ☐ |
| 7.10 | Create proposal | 仅 admin 可见；打开表单填写 targets/values/calldatas/description → 提交创建 | ☐ |
| 7.11 | Queue / Execute | 状态为 Succeeded 可 Queue；Queued 且 ETA 过后可 Execute；需有创建时存的 params | ☐ |
| 7.12 | Cancel | 仅 Cancel 允许的状态可点击 Cancel | ☐ |
| 7.13 | Admin 入口 | 满足 ADMIN_ADDRESSES 时显示 Admin / View history 链接到 /admin | ☐ |
| 7.14 | 提案详情 | 主站 Governance 表格无「点击行进详情」；提案详情仅在 **Admin**（/admin/proposals/:id）查看，从 Governance 点 Admin 或 View history 进入后点某提案的 Detail | ☐ |

---

## 八、Activity 页（/activity）

| # | 项 | 操作/预期 | Pass |
|---|----|-----------|------|
| 8.1 | 未连接 | 显示“连接钱包查看交易”等 | ☐ |
| 8.2 | 筛选 | All / Pending / Success / Failed 四个筛选项，切换后列表过滤正确 | ☐ |
| 8.3 | 表头 | Time、Type、Asset、Amount、Hash、Block、Gas、Status、Explorer 链接 | ☐ |
| 8.4 | 空态 | 表格骨架（与真实表列一致）、空态文案（收益导向 hint + 去 Dashboard CTA） | ☐ |
| 8.5 | 有记录 | 每行展示时间、类型、资产、金额、Hash（短地址+复制）、Block、Gas、Status（pending/success/failed）、View on explorer 链接 | ☐ |
| 8.6 | Pending | 进行中交易显示 pending；Nav 角标“1 pending” | ☐ |
| 8.7 | Replaced/Dropped | 若支持，展示 replaced/dropped 状态与原因 | ☐ |
| 8.8 | 复制 Hash | 复制后 Toast 或按钮变为“Copied” | ☐ |
| 8.9 | Explorer 链接 | 跳转到当前链的区块浏览器该笔 tx | ☐ |

---

## 九、其他页面

| # | 页面 | 项 | 操作/预期 | Pass |
|---|------|----|-----------|------|
| 9.1 | **Settings** (/settings) | 占位 | 显示 Settings 标题与 F5 可选说明 | ☐ |
| 9.2 | **Diagnostics** (/diagnostics) | 信息 | 前端版本、当前链、预期链、部署地址、RPC URL、RPC 失败次数/最后成功时间等 | ☐ |
| 9.3 | Diagnostics | Session evidence | 展示/下载 Session evidence | ☐ |
| 9.4 | Diagnostics | Config fingerprint | 展示配置指纹 | ☐ |
| 9.5 | Diagnostics | Copy debug bundle | 一键复制调试包（版本/链/部署/最近 tx 等） | ☐ |
| 9.6 | **Asset detail** (/markets/:assetId) | 详情 | **入口**：当前 ReserveList 无跳转链接，需直接访问 URL（如 /markets/USD8）。页面展示该资产 APY、Total supply/borrow、Supply/Borrow CTA、← Markets 返回；单资产下 assetId 仅用于 URL 一致性 | ☐ |
| 9.7 | **Admin** (/admin) | 布局 | Admin 布局、Back to app、Admin nav（Proposals） | ☐ |
| 9.8 | Admin | Proposals 列表 | 提案列表、每行 Detail 链接 | ☐ |
| 9.9 | Admin | Proposal 详情 (/admin/proposals/:id) | 单提案详情、Queue/Execute 按钮（按状态可用）、返回 Proposals 列表 | ☐ |
| 9.10 | **Diagnostics 入口** | 可达性 | 直接访问 /diagnostics；或当 2.4/2.7 时通过 ChainDeploymentFixBanner 的「Go to Diagnostics」进入 | ☐ |

---

## 十、全链路业务闭环（推荐顺序）

| # | 步骤 | 验证点 | Pass |
|---|------|--------|------|
| 10.1 | 起链 + 部署 + 前端 | 1.x 全部通过，前端可打开 | ☐ |
| 10.2 | 连接钱包 + 切链 | 2.x 通过，31337 正确 | ☐ |
| 10.3 | Dashboard 余额 | USD8 余额、Pool 为 0 或已有数据 | ☐ |
| 10.4 | Approve（Exact） | 选择 Exact → Approve 一定数量 USD8 给 Lending | ☐ |
| 10.5 | Supply | 输入金额 → Preflight 确认 → Supply → 余额减、Pool/Position 更新、Activity 出现记录 | ☐ |
| 10.6 | Borrow | 在 HF 安全范围内 Borrow → 借贷余额与利率正确 | ☐ |
| 10.7 | Repay | 部分或全部 Repay → 借贷余额与 HF 更新 | ☐ |
| 10.8 | Withdraw | 在 HF 与 maxWithdraw 内 Withdraw → 抵押余额更新 | ☐ |
| 10.9 | Markets | 打开 Markets，排序/筛选/表格/CTA 正常；点击 Supply 跳转 Dashboard 并定位到 Supply 卡 | ☐ |
| 10.10 | Governance | 打开 Governance，查看 KPI、提案列表；若有 Active 提案则 Vote（For/Against/Abstain）；Delegate 一次 | ☐ |
| 10.11 | Create proposal（admin） | 使用 admin 账户创建提案（若有权限） | ☐ |
| 10.12 | Queue / Execute | 提案 Succeeded 后 Queue；Timelock 过后 Execute（若流程完整） | ☐ |
| 10.13 | Pause / Unpause | 使用 pauser 账户 Pause → Supply/Borrow 等被阻断；Unpause → 恢复 | ☐ |
| 10.14 | Activity | 所有上述交易在 Activity 中有记录，筛选与 Explorer 链接正确 | ☐ |
| 10.15 | Admin | 从 Governance 进 Admin，查看 Proposals 列表与详情、Queue/Execute（若适用） | ☐ |

---

## 十一、与现有 E2E 的对应（可选对照）

| E2E 用例 | 覆盖范围 |
|----------|----------|
| `e2e/lending-flow.spec.ts` | 借贷流程（Supply/Borrow/Repay/Withdraw） |
| `e2e/markets-cta-prefill.spec.ts` | Markets CTA 跳转 Dashboard 并预填 action/asset |
| `e2e/governance-page-smoke.spec.ts` | Governance 页烟雾（列表、KPI） |
| `e2e/pause-governance.spec.ts` | Pause/Unpause 与治理相关流程 |
| `e2e/mainnet-read-only.spec.ts` | 主网只读模式（无写交易） |
| `e2e/mainnet-gap-ui.spec.ts` | 主网级 UI 缺口（风险区、Markets、Activity 空态等） |
| `e2e/diagnostics-rpc.spec.ts` | Diagnostics 页与 RPC 状态 |
| `e2e/forensic-a1-f17.spec.ts` | 取证/审计场景 A1–F17 |

手测时可对照上述用例查漏；新增场景可补充到本表或对应 spec。

---

## 十二、资产与合约速查（deployments 31337）

| 合约/资产 | 用途 |
|-----------|------|
| usd8Address | 抵押品/借贷代币（USD8） |
| wethAddress | WETH（若 UI 展示） |
| simpleLendingAddress | 借贷池主合约 |
| aTokenAddress | 供应凭证 |
| variableDebtTokenAddress | 债务凭证 |
| oracleRouterAddress | 价格预言机 |
| configuratorAddress | 配置 |
| governanceTokenAddress | 治理币（GovToken） |
| timelockAddress | 治理 Timelock |
| governorAddress | 治理 Governor |
| emergencyModuleAddress | 紧急模块 |
| proxyAdminAddress | 代理管理 |

---

## 十三、易漏与边界项（快速补测）

| # | 项 | 说明 |
|---|----|------|
| B.1 | Toast | 交易成功/失败、复制「Copied」等有 Toast 或明确反馈 |
| B.2 | 响应式 | Markets/Activity 表格在窄屏下为卡片布局（见 states-toast-skeleton.css 媒体查询） |
| B.3 | 合约读失败 | Dashboard 合约 revert（如 Oracle 未配置）时 InlineError/DataStatusBar 有友好提示，不裸抛「could not coalesce」 |
| B.4 | 切链脏数据 | 从 31337 切到其他链后，Dashboard 不保留上一链的余额/池子/仓位（useDashboard 在无 deployments 时清空 data） |
| B.5 | data-testid | 关键区域有 data-testid（如 app-layout、main-nav、nav-dashboard、activity-page、risk-viz-card、diagnostics-*、admin-back-to-app），便于 E2E 选择器稳定 |

---

## 十四、企业审计级：合约币/治理币与四页面逐项清单

以下以**实际代码为准**（frontend/src、contracts/deployments.json），逐按钮、逐业务逻辑列出，便于企业审计与 E2E 覆盖。

### 14.1 合约币与治理币（按 UI 与业务）

| 资产/合约 | 前端使用位置 | 业务/验证点 | Pass |
|-----------|--------------|-------------|------|
| **USD8** (usd8Address) | Dashboard：钱包余额、Action 卡金额与 Approve 目标；Markets：池子/储备为 USD8；Activity：资产列 | 余额来自 ERC20.balanceOf；Approve 的 spender 为 simpleLendingAddress；Supply/Repay 使用该币 | ☐ |
| **WETH** (wethAddress) | Dashboard 合约地址区（AddressDisplay）；未在 KPI/仓位中展示 | 仅展示地址；链上存在即可 | ☐ |
| **aToken** (aTokenAddress) | deployments 导出；合约层 supply 时 mint、withdraw 时 burn | 前端未单独展示 aToken 余额；仓位 supplied 来自 Pool 读值 | ☐ |
| **variableDebtToken** (variableDebtTokenAddress) | deployments 导出；合约层 borrow 时 mint、repay 时 burn | 前端未单独展示债务凭证余额；仓位 borrowed 来自 Pool 读值 | ☐ |
| **治理币 GovToken** (governanceTokenAddress) | Governance：Overview KPI「Voting power」「Delegated to」「Quorum」「Proposal threshold」；DAO 参数卡；My governance info「My voting power」「Delegated to」；Delegate 弹窗调用 token.delegate(delegatee) | 投票权 = Governor.getVotes(account)；委托 = GovToken.delegates(account)；创建提案门槛、quorum 以 GOV 单位显示（formatUnits(..., GOV_TOKEN_DECIMALS)） | ☐ |
| **SimpleLending（代理）** (simpleLendingAddress) | Dashboard Action 卡、PauseUnpauseBar、合约地址区；Governance overview.poolPaused 读 Pool.paused() | 所有 supply/withdraw/borrow/repay 与 pause 均通过该地址 | ☐ |
| **Oracle** (oracleRouterAddress) | Dashboard DataProvenanceBlock 展示 oracle 地址；风险/清算价若用价格则来自链上 Oracle | 读值一致性 | ☐ |
| **Governor / Timelock** (governorAddress, timelockAddress) | Governance 页：提案列表、Vote/Queue/Execute/Cancel、KPI Timelock 短地址；DAO 参数卡 Copy 为 governor 地址 | castVote、propose、queue、execute、cancel 调 Governor；Queue/Execute 依赖 Timelock | ☐ |

### 14.2 Dashboard 页 — 逐按钮与业务逻辑

| 区域 | 元素 | 类型 | 业务逻辑/预期 | Pass |
|------|------|------|----------------|------|
| **Header（全局）** | 主题切换 | 按钮 | Light→Dark→Navy→Light 循环；aria-label 与 title 正确 | ☐ |
| | Connect / Disconnect | 按钮 | 未连接显示 Connect（或 Install MetaMask）；已连接显示 Disconnect；点击后状态更新 | ☐ |
| | Switch network | 按钮 | 仅错误网络时显示；点击调用 ensureCorrectNetwork，切到 31337 | ☐ |
| | 网络/链 ID pill | 展示 | 正确链显示 OK + chainName；错误链显示 Wrong network | ☐ |
| | 账户地址 | AddressDisplay | 短地址 + 可复制/展开 | ☐ |
| **Banners** | 不支持网络 | 横幅 | wallet.account && !isCorrectNetwork 时显示“This network is not supported...” | ☐ |
| | 本地网络提示 | 横幅 | chainId 31337 时显示“Using local network... reset account...” | ☐ |
| | Read-only mode | 横幅 | readOnlyMode 时显示“Read-only mode...”且写操作禁用 | ☐ |
| | Connect wallet（行动区） | 横幅 | !wallet.account && !readOnlyMode 时显示“Connect wallet...” | ☐ |
| **PauseUnpauseBar** | 整块 | 条件渲染 | 仅当 account 为 pauser 且 pool.paused() 可读时显示 | ☐ |
| | Pause 按钮 | 按钮 | 调用 pool.pause()；成功后 onSuccess 刷新 dashboard | ☐ |
| | Unpause 按钮 | 按钮 | 调用 pool.unpause()；成功后 onSuccess 刷新 | ☐ |
| **DataStatusBar** | Refresh | 按钮 | 调用 dashboard.refresh() | ☐ |
| | Auto-refresh | 开关 | autoRefresh 状态与 blocksBehind 等展示 | ☐ |
| | blockNumber / blocksBehind / rpcStatus | 展示 | 与 provider 一致 | ☐ |
| **InlineError** | 文案 + Retry / Switch to 31337 | 按钮 | dashboard.error 时显示；Retry 调 refresh；切链调 ensureCorrectNetwork | ☐ |
| **TxStatus 区块** | 进行中提示 + View Activity 链接 | 链接 | stage pending/stuck 时显示；链接到 /activity | ☐ |
| | TxStatus 组件 | 子组件 | 显示 hash、stage、Refresh/Clear 等；confirmed 后显示“View in Activity”链接 | ☐ |
| **KPI 条** | Borrow limit、Borrow limit used、Available to borrow、Total supply、Total borrow、Health factor | 展示 | 数值来自 dashboard.data.pool / position；tooltip 与格式正确 | ☐ |
| **LTV 摘要** | “LTV X% · LT Y%” | 展示 | 来自 reserveRiskParams | ☐ |
| **RiskVizCard** | Health factor 条 + 数值 + 风险标签 | 展示 | HF 条、Healthy/At risk/Critical/No debt、tooltip 阈值 | ☐ |
| | Liquidation price (USD) | 展示 | 有债务时公式显示；无债务“—”；tooltip 口径 | ☐ |
| | Borrow usage 环 | 展示 | 百分比与仓位一致 | ☐ |
| **DashboardGrid** | Pool overview + User position | 展示 | totalSupply/totalBorrow/utilization/supplyRate/borrowRate；supplied/borrowed/healthFactor/maxWithdraw/maxBorrow | ☐ |
| **DashboardGrid 空态** | Pool 空态 CTA、Position 空态 CTA | 按钮 | isEmpty 时显示 poolEmptyHint/positionEmptyHint + 按钮「Start by supplying USD8」；点击滚动到 #action-card-supply | ☐ |
| **RiskParametersPanel** | details 折叠 | 组件 | LTV/LT 等参数（若有） | ☐ |
| **ApproveToolbar** | Exact / Infinite 单选 | 单选 | 选择 Exact 或 Infinite；Infinite 时显示风险提示 | ☐ |
| **Supply 卡** | 卡片容器 | — | cardId="action-card-supply"（id 用于空态 CTA 滚动定位与 ?action=supply 滚动） | ☐ |
| | 金额输入 | input | 受 usd8Decimals 与 sanitizeAmountInput 约束 | ☐ |
| | Max 按钮 | 按钮 | 置为钱包 USD8 余额；无余额时禁用 | ☐ |
| | Submit 按钮 | 按钮 | 若 allowance 不足显示“Approve USD8”；否则打开 Preflight；disabled 条件：!actions.ready \|\| !dashboardReady \|\| !form.canSupply \|\| txBusy \|\| readOnlyMode \|\| runtimeRiskTierHigh | ☐ |
| | helpText / actionDisabledReason / parsedError | 展示 | 可用余额、禁用原因、解析错误 | ☐ |
| **Withdraw 卡** | 金额输入、Max、Submit | 同结构 | Max = maxWithdraw（安全）；无 maxWithdraw 或为 0 时卡禁用；cardHint = withdrawHfWarning | ☐ |
| **Borrow 卡** | 金额输入、Max、Submit | 同结构 | Max = maxBorrow（安全）；无 maxBorrow 或为 0 时卡禁用；cardHint = borrowHfWarning | ☐ |
| **Repay 卡** | 金额输入、Max、Submit | 同结构 | Max = borrowed；无债务或钱包余额 0 时 Max 禁用 | ☐ |
| **PreflightModal** | 展示 Action/Amount/Token/Spender/Impact/Gas 等 | 弹窗 | 确认后调 preflight.confirmPreflight；关闭调 closePreflight | ☐ |
| | Confirm / Close 按钮 | 按钮 | Confirm 发起交易；Close 关闭不发送 | ☐ |
| **合约地址区** | details summary「Contracts」 | 折叠 | 展开显示 USD8、WETH、SimpleLending 的 AddressDisplay | ☐ |
| | Markets 链接、「Assets coming soon」按钮 | 链接/按钮 | 链接到 /markets；按钮打开 Mock 说明弹窗 | ☐ |
| **ChainProofAnchors** | chainId/account/token/genesisBlockHash | 展示 | 仅 31337 时显示 | ☐ |

### 14.3 Markets 页 — 逐按钮与业务逻辑

| 区域 | 元素 | 类型 | 业务逻辑/预期 | Pass |
|------|------|------|----------------|------|
| 无连接/无部署 | 提示卡片 | 展示 | !wallet.account 或 !deployments 时“Connect wallet...”或“Unsupported network...” | ☐ |
| Loading/Error | pageStateLoading / pageStateError | 展示 | loading 时“Loading market data…”；error 时 pageStateError + errorText；仅 !loading && !error 时渲染 Toolbar + ReserveList + marketCard + Chart | ☐ |
| **Toolbar** | Sort by | select | apy / utilization / totalSupply；切换后 reserves 排序正确 | ☐ |
| | Filter by asset | select | 空 / symbol / USDC / ETH / DAI；筛选后表格仅显示对应资产 | ☐ |
| **ReserveList 表** | 表头 | 列 | Asset, Supply APY, Borrow APY, Utilization, Total liquidity (USD), Total supply, Total borrow, LTV, LT（若有）, Actions | ☐ |
| | 每行 Asset | 单元格 | symbol + mock badge（若 isMock）+ name | ☐ |
| | Supply APY / Borrow APY | 单元格 | formatWithThousandsSeparator；supply 绿色样式 | ☐ |
| | Utilization | 单元格 | 颜色语义 low/medium/high；title 与 aria-label；● 图标 | ☐ |
| | Total liquidity (USD) | 单元格 | 有值则显示（compact 策略）；无则 muted “—” | ☐ |
| | Supply 按钮 | Link | 跳转 `/?action=supply&asset=${symbol}`；mock 行禁用 | ☐ |
| | Borrow 按钮 | Link | 跳转 `/?action=borrow&asset=${symbol}`；mock 行禁用 | ☐ |
| **Coming soon 区** | “What this means” | 按钮 | 打开 modal：marketsMockExplanationModalTitle/Body | ☐ |
| **Market 卡片** | Supply APY、Borrow APY、Utilization、Total supply/borrow、LTV·LT 行 | 展示 | 与 pool 数据一致 | ☐ |
| | Supply / Borrow CTA | Link | 到 `/?action=supply&asset=USD8` 与 borrow | ☐ |
| | 空池提示 | 文案 | isEmpty 时“Supply assets to start earning...” | ☐ |
| **PriceVolumeChart** | 图表 | 组件 | 展示（可能 mock 数据） | ☐ |
| **Data provenance** | “Data from chain” | 文案 | 标注数据来源 | ☐ |

### 14.4 Governance 页 — 逐按钮与业务逻辑

| 区域 | 元素 | 类型 | 业务逻辑/预期 | Pass |
|------|------|------|----------------|------|
| 无 Governor | 文案 | 展示 | !governorAddress 时“No governor configured for this network...” | ☐ |
| **顶部 CTA** | Create proposal | 按钮 | 打开 Create 弹窗；setCreateError(null) | ☐ |
| | Admin | Link | 满足 ADMIN_ADDRESSES 时显示；to="/admin" | ☐ |
| **Overview KPI** | Active proposals、Total proposals、Timelock、Voting power、Delegated to、Pool pause、Quorum | 展示 | 数值来自 overview；Voting power/Quorum 以 GOV 单位 | ☐ |
| **DAO 参数卡** | Quorum、Voting period、Proposal threshold、Timelock delay | 展示 | 来自 governor；Source 为 governor 短地址 + Copy 按钮 | ☐ |
| | Copy 按钮 | 按钮 | 复制 governorAddress 到剪贴板 | ☐ |
| **My governance info** | My voting power、Delegated to、Can execute (Yes/No) | 展示 | votingPower/delegatedTo；canExecuteAny 为 queued 且 eta 已过 | ☐ |
| | Delegate 按钮 | 按钮 | 打开 Delegate 弹窗 | ☐ |
| | View history 链接 | Link | to="/admin" | ☐ |
| **提案表** | loading 态 | 骨架 | loading 时表显示 3 行 skeleton，aria-busy/aria-label 正确 | ☐ |
| | 表头 | 列 | ID, Title, State, Votes, ETA, Action | ☐ |
| | 空态行 | 一行 | “—”、No proposals yet、pill “—”、ProposalStateTimeline(0)、Lifecycle hint、ProposalVotesBar(0)、Create proposal 按钮、Admin 链接 | ☐ |
| **错误态** | error / actionError | 展示 + Dismiss | 提案加载失败或 Queue/Execute 失败时显示；actionError 带 Dismiss 按钮 | ☐ |
| | 有提案行 | 每行 | ID、标题（来自 stored 或 placeholder）、state pill、ProposalStateTimeline、ProposalVotesBar、TimelockCountdown、Action 列按钮组 | ☐ |
| | state=Active(1) | 按钮 | Vote、Details、Cancel（仅当有 stored） | ☐ |
| | state=Succeeded(4) | 按钮 | Details、Queue | ☐ |
| | state=Queued(5) | 按钮 | Details、Execute | ☐ |
| | 其他 state | 按钮 | 仅 Details | ☐ |
| **Vote 弹窗** | For/Against/Abstain 三按钮 | 按钮 | 选中高亮；voteSupport 状态 | ☐ |
| | Confirm 按钮 | 按钮 | 调 governor.castVote(proposalId, support)；成功后关闭 | ☐ |
| | Close 按钮 | 按钮 | closeVoteModal | ☐ |
| **Details 弹窗** | 展示 stored description/targets/values/calldatas、state、VotesBar | 展示 | 无 stored 时“No stored description...” | ☐ |
| | Close 按钮 | 按钮 | setDetailProposalId(null) | ☐ |
| **Create 弹窗** | Targets、Values、Calldatas、Description 输入 | input/textarea | 提交时 propose(targets, values, calldatas, descriptionHash)；成功后存 localStorage 并关闭 | ☐ |
| | Create proposal / Close 按钮 | 按钮 | submitCreateProposal；Close 关闭 | ☐ |
| **Delegate 弹窗** | Delegatee address 输入 | input | 提交调 token.delegate(delegateAddress) | ☐ |
| | Delegate / Close 按钮 | 按钮 | submitDelegate；Close 关闭 | ☐ |
| **Queue/Execute/Cancel** | 按状态显示 | 按钮 | runQueueExecuteCancel(id, "queue"|"execute"|"cancel")；需 stored params（Queue/Execute）；提交中显示“…” | ☐ |

### 14.5 Activity 页 — 逐按钮与业务逻辑

| 区域 | 元素 | 类型 | 业务逻辑/预期 | Pass |
|------|------|------|----------------|------|
| 未连接 | 文案 | 展示 | “Connect wallet...” (activityConnectHint) | ☐ |
| **筛选** | All / Pending / Success / Failed | 4 个按钮 | aria-pressed；切换后 rows 过滤正确 | ☐ |
| **空态** | 表头 + 3 行骨架 | 表格 | 列与真实表一致；每格 skeleton | ☐ |
| | 收益导向文案 + 去 Dashboard CTA | 文案 + Link | activityEmptyYieldHint、activityEmptyHint、Link to="/" | ☐ |
| **有数据** | 每列 | 单元格 | Time、Type、Asset、Amount、Hash（短地址+复制）、Block、Gas、Status、Explorer 链接 | ☐ |
| | 复制 Hash 按钮 | 按钮 | 复制 toChecksum(hash)；Toast 或“Copied” | ☐ |
| | View on explorer | 链接 | getExplorerTxUrl(chainId, txHash) | ☐ |
| | Replaced/Dropped 状态 | 展示 | outcome 与 droppedReason 对应文案 | ☐ |

---

**文档版本**：与当前 App 路由及功能一致；新增页面或功能时请同步更新本清单。  
**参考**：运行命令与本地演示见 [08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)；排错见 [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)。技术升级文档与代码对齐以 [project-upgrade/00-与当前代码对齐说明.md](../project-upgrade/00-与当前代码对齐说明.md) 及 [project-upgrade/11-升级阶段清单-P0至P10.md](../project-upgrade/11-升级阶段清单-P0至P10.md) 为准。
