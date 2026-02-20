# 项目负责人 / 面试官入口（合并文档）

**约定**：本文档由原 **Technical_Overview_and_Entry.md**、**PROJECT_LEAD_REVIEW.md**、**P0-P6-Summary-and-Assessment.md** 合并而成，为项目负责人与面试官**唯一起点**。其余 docs 按角色/阶段见 [00-INDEX.md](00-INDEX.md)。

---

# Part 1：技术概览与运行（原 Technical_Overview）

- **范围（v1.0 P0–P10）**：升级版借贷协议 — 代理、储备/利率、预言机、风险/清算、Treasury、Governor + Timelock 治理、紧急暂停；前端 Dashboard / Governance / Markets / Activity；本地 Hardhat 链（31337），无主网部署。
- **技术栈**：Contracts — Solidity 0.8.19，OpenZeppelin（proxy、Governor、Timelock），core/oracle/tokens/governance 模块；Frontend — React 18, TypeScript, Vite, ethers v6；Local chain — Hardhat Node, chainId 31337；Test — Hardhat 单元/集成/不变式/Fuzz，Playwright E2E。
- **运行**：① 终端 1 `npx hardhat node`；② 终端 2 `npm run deploy:localhost` → `npm run deploy:p9`；③ 终端 3 `cd frontend && npm ci && npm run dev`。浏览器添加 RPC `http://127.0.0.1:8545`、chainId `31337`，连接后使用。详见根 **LOCAL_RUN.md**、[09-本地链标准与地址.md](09-本地链标准与地址.md)。
- **验证**：合约 `npm run compile`、`npm test`；前端 `cd frontend && npm run lint && npm run build`；一键 **`npm run p10:gate`**（端口 8545 空闲下执行至 exit 0 = v1.0 门禁通过）；可选 `npm run ci:local`、`npm run smoke:e2e`（需链已起并部署）。
- **文档入口**：全文档以 [docs/00-INDEX.md](00-INDEX.md) 为准；本地调试仅需 [09-本地链标准与地址.md](09-本地链标准与地址.md)、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)、[08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)、[15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)。

---

# Part 2：仓库结构与企业标准（原 PROJECT_LEAD_REVIEW）

## 目录概览

```
Smart contract projects/
├── .github/workflows/ci.yml   # CI
├── contracts/                 # Solidity（core/, oracle/, tokens/, governance/, libs/, mocks/）
├── deployments/               # 31337.json 等
├── docs/                      # 以 00-INDEX.md 为唯一条目
├── frontend/                  # React + TypeScript + Vite + ethers v6
├── scripts/                   # deploy/, governance/, ci/, demo/, config/, _lib/
├── test/                      # unit/, integration/, invariants/, fuzz/
├── hardhat.config.ts, package.json
└── README.md, LOCAL_RUN.md, SECURITY.md, PROJECT_OVERVIEW.md, CONTRIBUTING.md
```

## 企业标准（已落实）

| 领域 | 状态 | 说明 |
|------|------|------|
| 代码注释 | 英文、人称化（hooks, state, utils, config） | — |
| 命名 | 统一 formatToken/formatPercent、formatLocalTime | — |
| 结构 | contracts / frontend(config,hooks,state,components,styles) / scripts / test / docs | — |
| 安全 | 根 SECURITY.md | 漏洞报告与范围 |
| CI | .github/workflows/ci.yml | — |
| UI 文案 | frontend/src/config/ui.ts 单源 | — |

## 负责人自检清单

- [ ] **运行**：`npm install`（根 + frontend）、`npm run deploy:localhost`、`cd frontend && npm run dev` — 连接钱包、完成一次 Supply。
- [ ] **构建**：`cd frontend && npm run build` 无报错。
- [ ] **测试**：`npm test` 通过。
- [ ] **文档**：以 [00-INDEX.md](00-INDEX.md) 为入口；本文档 = 负责人全貌。

---

# Part 3：P0–P10 阶段总结与评估（原 P0-P6-Summary-and-Assessment 扩展）

- **目标**：v1.0 P0–P10 Local-Only 工程闭环；无硬编码；代理/预言机/清算/治理/紧急暂停 + 前端 Dashboard / Governance / Markets / Activity；产品级技术观感与可验证证据包。
- **阶段**：P0 需求+design tokens+结构 → P1–P3 布局/无障碍/企业 UI → P4–P5 主题/HF 可视化/风险提示 → **P6** Aave 风格升级 + Web3 设计系统 → **P7** 清算/Treasury → **P8** 集成与不变式/Fuzz → **P9** 治理上链（Governor、Timelock、GovToken、Guardian）→ **P10** 本地最终门禁（p10:gate、E2E、evidence-pack）。**P0–P10 已实现**。
- **关键文件**：index.css、config/ui.ts、config/network.ts、design-tokens.ts；Header、DashboardGrid、PoolOverview、UserPosition、ActionCardsGrid、TxStatus、PreflightModal、DataStatusBar；Governance 页、Markets、Activity、PauseUnpauseBar；useWallet、useDashboard、useActions、usePreflight、useGovernanceOverview；contracts/core/、oracle/、governance/。
- **验收**：`npm run p10:gate` 至 **exit 0**（输出含 EVIDENCE-PACK-MANIFEST-SHA256 与四锚点）；E2E：Connect → Supply（含 Approve）→ Borrow → Repay → Withdraw；Governance 提案/投票、Pause/Unpause 可用；无硬编码；合约与 config 单源。
- **范围外**：主网/测试网部署、生产级 SLA、第三方主网审计承诺；v1.0 仅 Local-Only。

**总结**：项目负责人仅需本文档 + [00-INDEX.md](00-INDEX.md)；仓库内容与验证步骤见 [07-REPO-HYGIENE.md](07-REPO-HYGIENE.md) Part D。**学习材料**：`learning/` 若存在，**权威入口**为 [learning/项目总览架构.md](../learning/项目总览架构.md)（已与 v1.0 P0–P10 对齐）；当前栈以本文档、[12-PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md)、[09-本地链标准与地址.md](09-本地链标准与地址.md)、[15-governance-create-proposal-example.md](15-governance-create-proposal-example.md) 及根 README 为准。

---

# Part 4：P0–P6 详细（原 P0_P6_Summary + P6_Completion_Assessment）

## 4.1 P0–P6 目标与阶段表

| Goal | Description |
|------|-------------|
| **Business** | 需求 C–G 100%：连接/切换链、余额与 allowance、池与头寸、四操作、交易后刷新与事件、交易状态展示。 |
| **Enterprise** | 无硬编码；样式与文案来自 design tokens + config/ui；结构清晰、可维护、可测。 |
| **UX** | Aave 风格单市场 Dashboard 布局与信息层级；产品级技术观感。 |

| Stage | Core goal | Status |
|-------|-----------|--------|
| **P0** | 需求 100% + design tokens & config + 结构（components/hooks，slim App）+ 无硬编码 | Done |
| **P1** | Aave 风格布局与层级（header、主区、tx status、balance/allowance） | Done |
| **P2** | UX 与无障碍（dark mode、aria/role、loading/transitions） | Done |
| **P3** | Aave 对齐企业 UI（compact header、两列 dashboard、metricGrid、DataStatusBar、2×2 actions、metaGrid） | Done |
| **P4** | 高级调色与 Web3 观感（三主题，无组件硬编码） | Done |
| **P5** | HF 可视化、操作区层级、tx 签名/pending 动画、风险提示、多链/断开 | Done |
| **P6** | Aave 风格升级（P6.1–P6.7）+ Web3 设计系统 + 技术风格增强 | Done |

## 4.2 P0–P6 关键实现要点

- **P0**：design-tokens → `:root`；config/ui.ts 单源；C–G 需求；Types → utils + config → components → hooks → slim App。
- **P1–P3**：固定 header、主内容（池卡、头寸卡、四操作卡）、TxStatus；dark mode、metricGrid、DataStatusBar、2×2 actions。
- **P4–P5**：三主题（Web3 Pro Light / DeFi Dark / Navy Pro）；HF 条与标签、Preflight、风险提示、多链/断开。
- **P6**：P6.1–P6.7（视觉层级、卡阴影/圆角/间距、Pool/Position 市场感、HF 图例、Preflight 概览、输入与主按钮、Header 品牌、DataStatusBar 与空状态 CTA）；设计系统；增强项（utilization bar、modal 动效等，均尊重 prefers-reduced-motion）。

## 4.3 P6 完成与验收（原 P6_Completion_Assessment）

- **P6.1–P6.7 与设计系统**：均已实现；验收 = Connect → Supply（含 Approve）→ Borrow → Repay → Withdraw + 三主题正常。
- **范围外**：不新增 token 类型、不做图表/历史、不引入新动画库、不改变两列/2×2 布局。
- **维护**：后续仅限 index.css/App.css 与现有 tokens；文案来自 config/ui。

## 4.4 关键文件（前端）

- **Config/tokens**：index.css（:root、[data-theme]）、config/ui.ts、config/network.ts、design-tokens.ts
- **Types/utils**：types/dashboard.ts、utils/format.ts、utils/amount.ts
- **Components**：Header、DashboardGrid、PoolOverview、UserPosition、ActionCardsGrid、ActionCard、TxStatus、PreflightModal、DataStatusBar、AddressDisplay
- **Hooks**：useWallet、useDashboard、useTokenMetadata、useAllowance、useActions、useDashboardForm、useTxDisplay、usePreflight、useGovernanceOverview
- **State**：tx.ts、txStore.ts、errors.ts

---

# Part 5：负责人细项（原 PROJECT_LEAD_REVIEW 补充）

## 5.1 前端目录细览

```
frontend/src/
├── abis/              # Contract ABI JSON
├── components/        # actions/, dashboard/, layout/, tx/, ui/
├── config/            # network, runtime, ui（单源）
├── contracts/         # abis, deployments, getContracts, write helpers
├── hooks/             # useWallet, useDashboard, useActions, usePreflight, ...
├── state/             # tx, txStore, errors
├── styles/            # layout, cards-dashboard, forms-buttons
├── types/             # dashboard, ethereum (EIP-1193)
├── utils/             # amount, format, assert
├── App.tsx, main.tsx, design-tokens.ts, index.css
```

## 5.2 人称化注释（Personified comments）

- **Hooks**：useWallet、useActions、useDashboard、usePreflight 等 — 文件级或主导出 JSDoc，英文、“we/you” 语气。
- **State**：tx.ts、txStore.ts、errors.ts（RPC 信息重写）。
- **Utils**：format.ts、amount.ts、assert.ts。
- **Config**：network.ts、runtime.ts、ui.ts。
- **Contracts（前端）**：contracts.ts（getContracts）、deployments.ts。

## 5.3 预交接清单（Pre-handoff）

- `npm run ci:local` 通过。
- 本地流程：Connect → Supply（含 Approve）→ Borrow → Repay → Withdraw。
- 文档已读：根 README、本文档、[00-INDEX.md](00-INDEX.md)。
- 业务/显示/流程验证：见 [debug/SCREENSHOT-FLOW-VERIFICATION.md](debug/SCREENSHOT-FLOW-VERIFICATION.md)。
