---
marp: true
paginate: true
size: 16:9
theme: gaia
footer: "Smart-contract-projects | Web3 Engineer Coding Test | 2026-01-27"
title: "Web3 Engineer Coding Test - Technical Presentation (中文版)"
author: "Smart Contract Projects"
keywords: "Web3, DeFi, Smart Contracts, Hardhat, React, TypeScript, Lending Protocol"
description: "企业级技术演示：可复现的DeFi借贷协议实现"
style: |
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg: #0b1020;
    --panel: rgba(22, 27, 34, 0.65);
    --panel-strong: rgba(22, 27, 34, 0.85);
    --border: rgba(110, 118, 129, 0.25);
    --fg: #e6edf3;
    --muted: rgba(201, 209, 217, 0.85); /* Improved contrast for WCAG AA */
    --muted2: rgba(201, 209, 217, 0.70); /* Improved contrast */
    --accent: #7ee787;
    --link: #58a6ff;
  }

  section {
    background: var(--bg);
    color: var(--fg);
    padding: 56px 72px 120px 72px;
    font-size: 30px;
    font-family: "Inter", "SF Pro Display", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif;
    line-height: 1.5;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  h1, h2, h3, h4, h5, h6 { 
    color: var(--fg); 
    font-weight: 600;
  }
  h1 { 
    font-size: 64px; 
    letter-spacing: -0.5px; 
    line-height: 1.2;
    margin-bottom: 24px;
  }
  h2 { 
    font-size: 42px; 
    letter-spacing: -0.3px; 
    line-height: 1.3;
    margin-bottom: 20px;
  }
  h3 { 
    font-size: 32px; 
    letter-spacing: -0.2px;
    line-height: 1.4;
    margin-bottom: 16px;
  }
  h4 {
    font-size: 28px;
    letter-spacing: -0.1px;
    line-height: 1.4;
    margin-bottom: 12px;
    font-weight: 600;
  }
  h5 {
    font-size: 26px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 10px;
    font-weight: 500;
  }
  h6 {
    font-size: 24px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 8px;
    font-weight: 500;
  }
  strong { 
    color: var(--accent); 
    font-weight: 600;
  }
  a { 
    color: var(--link); 
    text-decoration: none;
    border-bottom: 1px solid rgba(88, 166, 255, 0.3);
    transition: border-color 0.2s;
  }
  a:hover {
    border-bottom-color: var(--link);
  }
  
  /* Enhanced readability for financial presentations */
  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
  }
  
  ul, ol {
    line-height: 1.6;
    margin: 12px 0;
  }
  
  blockquote {
    border-left: 4px solid var(--accent);
    padding-left: 20px;
    margin: 20px 0;
    font-style: italic;
    color: var(--muted);
    font-size: 28px;
    line-height: 1.5;
  }

  section::before {
    content: "";
    position: absolute;
    left: 72px;
    right: 72px;
    top: 56px;
    height: 2px;
    background: linear-gradient(90deg, rgba(110,118,129,0.0), rgba(110,118,129,0.45), rgba(110,118,129,0.0));
    opacity: 0.6;
  }

  .kicker {
    font-size: 20px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(201, 209, 217, 0.7);
    font-weight: 500;
  }

  .topkicker {
    position: absolute;
    left: 72px;
    top: 24px;
    font-size: 15px;
    letter-spacing: 2.0px;
    text-transform: uppercase;
    color: var(--muted2);
    font-weight: 500;
  }
  
  /* Additional utility classes for enterprise presentations */
  .highlight {
    background: rgba(126, 231, 135, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent);
  }
  
  .warning {
    background: rgba(255, 193, 7, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: #ffc107;
  }
  
  .note {
    background: rgba(88, 166, 255, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--link);
  }
  
  /* First slide layout optimization */
  section:first-of-type {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  section:first-of-type h1 {
    margin-bottom: 16px;
  }
  
  section:first-of-type h2 {
    margin-bottom: 12px;
  }
  
  section:first-of-type .subtitle {
    margin-bottom: 24px;
  }

  .divider-title {
    font-size: 68px;
    margin-top: 80px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .divider-sub {
    margin-top: 16px;
    font-size: 28px;
    color: var(--muted);
    font-weight: 400;
  }

  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px 28px;
    min-width: 0;
    font-size: 28px;
    line-height: 1.5;
  }

  .card h3, .card h4 {
    margin-top: 0;
    margin-bottom: 8px;
  }

  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  
  /* Three column layout support */
  .cols-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    align-items: start;
  }

  .card, .card * {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  code {
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 26px;
    font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", monospace;
    background: rgba(22, 27, 34, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1.5;
  }

  .tight ul { margin: 8px 0 0 24px; }
  .tight li { margin: 8px 0; line-height: 1.6; }

  .subtitle {
    margin-top: 12px;
    font-size: 24px;
    color: var(--muted);
    font-weight: 400;
    line-height: 1.5;
  }
  
  /* Enhanced code block styling */
  pre {
    background: rgba(22, 27, 34, 0.9);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    overflow-x: auto;
    font-size: 24px;
    line-height: 1.6;
    margin: 16px 0;
  }
  
  pre code {
    background: transparent;
    padding: 0;
    font-size: 24px;
    color: var(--fg);
  }

  .evidence {
    position: absolute;
    left: 40px;
    bottom: 80px;
    padding: 10px 16px;
    font-size: 16px;
    color: rgba(201, 209, 217, 0.9); /* Improved contrast */
    background: var(--panel-strong);
    border: 1px solid rgba(110, 118, 129, 0.5);
    border-radius: 12px;
    backdrop-filter: blur(4px);
    font-weight: 400;
    line-height: 1.4;
  }

  .evidence strong { 
    color: rgba(201, 209, 217, 0.95); 
    font-weight: 600;
  }

  section img {
    max-height: 66vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* Table styles for enterprise presentations */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 28px;
  }
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    background: var(--panel);
    color: var(--fg);
    font-weight: 600;
  }
  tr:hover {
    background: rgba(22, 27, 34, 0.4);
  }
  
  /* Print-friendly styles */
  @media print {
    section {
      page-break-after: always;
    }
    section:last-child {
      page-break-after: auto;
    }
  }

  /* Keep footer & page number inside the PDF safe area */
  section footer {
    position: absolute;
    left: 72px;
    right: 140px;
    bottom: 36px;
    font-size: 16px;
    color: rgba(201, 209, 217, 0.65);
    text-align: left;
    font-weight: 400;
  }

  section::after {
    right: 48px !important;
    bottom: 32px !important;
    font-size: 16px !important;
    color: rgba(201, 209, 217, 0.65) !important;
    font-weight: 400 !important;
  }
---

# Smart-contract-projects
## Web3 Engineer Coding Test — 面试技术演示

<div class="subtitle">可复现 · 可验收 · 录屏友好（金融企业叙事风格）</div>

<div class="card tight" style="margin-top: 32px; margin-bottom: 24px;">

- **技术栈**：Hardhat + Solidity + React/TS + ethers v6
- **本地链**：Hardhat 31337
- **演示闭环**：approve（授权）→ supply（存入）→ borrow（借款）→ repay（还款）→ withdraw（取出）

</div>

<!-- _notes: |
  15 秒开场：先讲“可复现 + 工程可靠性”，再进入结构。
-->

---

## Agenda（外企面试风格）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="cols" style="margin-top: 32px;">

<div class="card tight">

### Part A
1) 题目与 scope
2) 端到端架构
3) 关键设计取舍
4) 可靠性（交易生命周期 + 刷新）

</div>

<div class="card tight">

### Part B
5) 安全 baseline
6) 测试与可复现
7) Demo + Q&A

</div>

</div>

---

## 术语 / 函数名速查（中英对照，方便你讲）

<div class="card">

- **Supply（存入/做抵押）**：`supply(amount)`
- **Borrow（借款）**：`borrow(amount)`
- **Repay（还款）**：`repay(amount)`
- **Withdraw（取出/赎回）**：`withdraw(amount)`

链与端口（你口播时用）：
- **ChainId 31337**：Hardhat 本地链（不是端口）
- **RPC**：`http://127.0.0.1:8545`（Hardhat node 默认）
- **前端**：`http://localhost:5173`（Vite 默认）

</div>

---

## Executive Summary（金融企业视角）

<div class="topkicker">OVERVIEW · 概览</div>

- **交付物完整**：合约 + 前端 + 部署/导出/seed 脚本 + 集成测试
- **规则强约束**：LTV=75%，borrow/withdraw 都由合约硬性 revert
- **可靠性优先**：交易状态机 + confirmed 后强制刷新 + 事件监听 + backfill 兜底
- **安全基线**：nonReentrant / SafeERC20 / Pausable + 前端网络与金额解析防护

一句话：
> “这是 coding test，但按企业项目交付标准组织：可复现、可验收、可解释风险边界。”

---

## 题目 vs 实现（面试官最关心）

<div class="topkicker">OVERVIEW · 概览</div>

![requirements](./assets/requirements-mapping.svg)

<div class="evidence">Evidence: <strong>docs/CODING_TEST_ASSIGNMENT.txt</strong> · <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

<!-- _notes: |
  强调：这是 coding test，但我们把“可复现、可验收、可靠性”做到接近真实工程。
-->

---

## 1 分钟电梯版（你开场就讲这段）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="cols">

<div class="card tight">

### 交付物（Deliverables）
- 合约 + 前端完整闭环（approve → supply → borrow → repay → withdraw）
- 一键 deploy+seed+导出 ABI/地址（可复现）
- 集成测试覆盖关键 revert（可验收）

</div>

<div class="card tight">

### 企业级亮点（Why enterprise-grade）
- on-chain 强约束：LTV=75%，borrow/withdraw 硬 revert
- 可靠性：交易状态机 + confirmed 强制刷新 + 事件监听 + backfill 兜底
- 安全基线：nonReentrant / SafeERC20 / Pausable + 前端网络/金额解析防护

</div>

</div>

---

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="divider-title">Architecture</div>
<div class="divider-sub">端到端架构与工程边界</div>

<!-- _notes: |
  这一页要像“PRD 摘要”：说结论，不展开细节。
-->

---

## Architecture（端到端）

<div class="topkicker">ARCHITECTURE · 架构</div>

![architecture](./assets/architecture.svg)

<div class="evidence">Evidence: <strong>scripts/_lib/export.ts</strong> · <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>

<!-- _notes: |
  从左到右讲：Hardhat workspace -> local chain -> frontend。强调“导出 ABI/地址”是可复现关键。
-->

---

## 项目结构（你要让面试官“看得懂仓库”）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="card tight">

- 合约：`contracts/`
  - `SimpleLending.sol`：业务规则 + 安全组件
  - `TestToken.sol`：USD8/WETH 测试代币
- 部署：`scripts/deploy.ts`（deploy+seed+export）
- 前端：`frontend/`（React + ethers v6）
- 测试：`test/SimpleLending.integration.ts`

</div>

---

## 题面要求对齐（用“证据点”说话）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="cols">

<div class="card tight">

### Part 1：Deploy / Seed / Export
- `scripts/deploy.ts`
- `scripts/_lib/export.ts`

### Part 2：Frontend 交互 + 实时更新
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/hooks/useDashboard.ts`（events + backfill）
- `frontend/src/hooks/useActions.ts`（write model + tx）

</div>

<div class="card tight">

### Part 3：加分项（工程化）
- `test/SimpleLending.integration.ts`（关键 revert 覆盖）
- `frontend/src/state/tx.ts`（交易状态机）
- `scripts/smoke-e2e.mjs`（演示兜底）

</div>

</div>

---

<div class="topkicker">CONTRACT · 合约</div>

<div class="divider-title">Contract</div>
<div class="divider-sub">业务规则与 on-chain 强约束</div>

---

## 合约：业务规则（核心）

<div class="topkicker">CONTRACT · 合约</div>

- 单币种：USD8 同时用于 supply 和 borrow
- LTV = 75%
  - `maxBorrow = supplied * 75%`
- borrow 硬检查：借完不能超限
- withdraw 硬检查：取完仍要健康

你可以一句话总结：
> “借款/取款不是 UI 控制，是合约强制 revert。”

---

## LTV 约束（为什么这个 demo 可信）

<div class="topkicker">CONTRACT · 合约</div>

![ltv](./assets/ltv-constraints.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> (LTV_RATIO, borrow(), withdraw(), calculateMaxBorrow(), calculateMaxWithdraw())</div>

---

## 设计取舍（Tradeoffs）

<div class="topkicker">DECISIONS · 取舍</div>

<div class="cols">

<div class="card tight">

### Scope 取舍（刻意不做）
- 单币种 + 固定 LTV：降低复杂度，聚焦题面验收
- 不做预言机/清算/多资产：明确 non-goals，避免“半吊子生产化”

</div>

<div class="card tight">

### 可靠性优先（演示不翻车）
- 交易状态机：统一 pending/confirmed/failed
- confirmed 后强制刷新：抵抗 RPC eventual consistency
- 事件监听 + backfill 兜底：满足题面 + 更接近真实工程

</div>

</div>

---

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="divider-title">Reliability</div>
<div class="divider-sub">交易生命周期 + UI 刷新（演示不翻车）</div>

---

## 交易状态机（工程可靠性核心）

<div class="topkicker">RELIABILITY · 可靠性</div>

![tx](./assets/tx-state-machine.svg)

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong> · <strong>frontend/src/state/txStore.ts</strong></div>

---

## 合约：关键函数（讲清楚 Checks / Effects / Interactions）

<div class="topkicker">CONTRACT · 合约</div>

- `supply(amount)`（存入/做抵押）
  - 需要 `approve`（transferFrom）
  - 记账：`userSupply += amount`
- `borrow(amount)`（借款）
  - 检查 liquidity + LTV
  - 转账：合约 → 用户
- `repay(amount)`（还款）
  - 需要 `approve`（transferFrom）
  - 记账：`userBorrow -= amount`
- `withdraw(amount)`（取出/赎回）
  - 检查余额 + 取款后健康
  - 转账：合约 → 用户

---

## 合约：安全组件（为什么要加）

<div class="topkicker">SECURITY · 安全</div>

- `ReentrancyGuard`：关键写函数防重入
- `Pausable` + `Ownable`：紧急暂停（止损开关）
- `SafeERC20`：兼容非标准 ERC20，避免“返回值不规范”坑

边界声明（加分）：
- 本项目不做预言机/清算/多资产，保持题面范围

---

## 前端：读写分离（provider vs signer）

<div class="topkicker">FRONTEND · 前端</div>

- Read model（稳定、可并发）：
  - provider + view calls：余额 / pool / position / maxBorrow / maxWithdraw
- Write model（高不确定性）：
  - signer 发交易 + 交易生命周期管理

收益：
- 读模型不被写流程污染
- confirmed 后再触发 refresh，状态更一致

---

## 前端：交易状态机（为什么不是“发完就算”）

<div class="topkicker">RELIABILITY · 可靠性</div>

- stages：idle → signing → pending → confirmed/failed
- 处理现实世界问题：
  - 用户拒绝签名
  - pending 很久
  - speed up / replacement
  - RPC 读延迟（confirmed ≠ 立刻读到）

<!-- _notes: |
  这里要强调：区块链 UX 的不确定性来自钱包/网络/RPC，而不是代码“写错”。
-->

---

## 刷新策略（3 层）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-bottom: 20px;">

**三层刷新机制**（按优先级）：
1) **Tx confirmed后强制刷新**：`tx.wait()` 确认后立即刷新
2) **合约事件监听**（主路径）：`Supplied` / `Withdrawn` / `Borrowed` / `Repaid`
3) **Fail-safe兜底**：节流block监听 + 小范围backfill（`EVENT_BACKFILL_MAX_BLOCKS = 2000`）

</div>

![refresh](./assets/refresh-strategy.svg)

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/config/runtime.ts</strong></div>

---

## 现场 Demo 结构（录屏更专业）

<div class="topkicker">DEMO · 演示</div>

<div class="cols">

<div class="card tight">

### 先跑通（不解释太多）
1) Connect
2) Supply（必要时 approve）
3) Borrow（展示 LTV=75%）
4) Repay（必要时 approve）
5) Withdraw（展示健康检查）

</div>

<div class="card tight">

### 再解释“为什么可靠”
- tx 状态机：pending/confirmed/failed
- confirmed 后强制刷新：抵抗 RPC 读延迟
- events 主路径 + backfill/节流兜底：避免演示翻车

</div>

</div>

---

## 前端：Approve 细节（面试官爱追问）

<div class="topkicker">FRONTEND · 前端</div>

<div class="cols">

<div class="card tight">

### 哪些操作需要 approve
- Supply（`supply` 存入）
- Repay（`repay` 还款）

原因：写函数内部使用 `transferFrom`，依赖 ERC20 allowance。

</div>

<div class="card tight">

### 前端策略（approve-if-needed）
- 若 `allowance >= amount`：跳过 approve
- 不足才 approve（减少用户操作）
- exact / infinite（安全 vs 便利）
- 兼容 USDT 风格：`approve(0) → approve(amount)` 兜底

</div>

</div>

---

## 错误处理：归一化（你会显得很工程化）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="cols">

<div class="card tight">

### 目标
把 provider / ethers / wallet 的错误统一成“可解释、可展示、可追踪”的分类。

### 主要分类
- UserRejected（4001）
- Revert（CALL_EXCEPTION / reverted）
- Rpc（timeout / network）

</div>

<div class="card tight">

### 展示策略（让面试官放心）
- UI 文案：给用户一句话结论
- 技术细节：保留原始错误（便于排查）
- 重试引导：pending 超时 / RPC 失败给出可操作建议

</div>

</div>

---

## 测试：覆盖哪些关键边界

<div class="topkicker">TESTING · 测试</div>

<div class="cols">

<div class="card tight">

### 集成测试（贴近题面验收）
- approve → supply → borrow → repay → withdraw

你可以一句话总结：
> “完整闭环 + 可复现验收路径。”

</div>

<div class="card tight">

### 两个最关键的安全边界
- borrow 超 LTV：应 revert
- withdraw 导致不健康：应 revert

你可以说：
> “happy path + 两个最重要的安全边界。”

</div>

</div>

---

## 安全与 UX Safety（我们额外补的细节）

<div class="topkicker">SECURITY · 安全</div>

![security](./assets/security-hardening.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> · <strong>frontend/src/utils/amount.ts</strong> · <strong>frontend/src/hooks/useWallet.ts</strong></div>

---

## 可复现流水线（你可以让面试官直接 copy/paste）

<div class="topkicker">REPRODUCIBILITY · 可复现</div>

![pipeline](./assets/pipeline.svg)

<div class="evidence">Evidence: <strong>package.json</strong> scripts · <strong>scripts/deploy.ts</strong> · <strong>scripts/smoke-e2e.mjs</strong></div>

---

## 交付与可运营（企业级检查项）

<div class="topkicker">DELIVERY · 交付</div>

<div class="cols">

<div class="card tight">

### 可复现 / 可验收
- **可复现**：一键脚本 + ABI/地址导出 + lockfile
- **可验收**：集成测试覆盖闭环 + 两个关键 revert

</div>

<div class="card tight">

### 可演示 / 风险边界
- **可演示**：`smoke:e2e` 兜底，降低现场不确定性
- **边界清晰**：明确 Non-goals（无预言机/清算/多资产），避免误导“生产就绪”

</div>

</div>

---

## 现场演示脚本（5 分钟）

<div class="topkicker">DEMO · 演示</div>

0) 启动：node + deploy + frontend
1) Connect（自动切链 31337）
2) Supply（必要时 approve）
3) Borrow（展示 LTV=75%）
4) Repay（必要时 approve）
5) Withdraw（展示健康检查）
6) 收尾：两条亮点 + 证据点

---

## 演示“救场 Plan B”（很加分）

<div class="topkicker">DEMO · 演示</div>

<div class="cols">

<div class="card tight">

### 什么时候用
- MetaMask 临场抽风 / 钱包卡住 / UI 网络不稳定

</div>

<div class="card tight">

### 怎么救场
- 直接跑脚本闭环：`npm run smoke:e2e`
- 它会用导出的 ABI/地址完成同样 approve → supply → borrow → repay → withdraw

</div>

</div>

---

## Scope / Non-goals（提前把“没做”说成“刻意不做”）

<div class="topkicker">SCOPE · 范围</div>

<div class="card tight">

### 不做（刻意）
- 预言机、多资产、清算、主网部署

### 为什么
- 题面重点：**合约集成 + 前端交易体验 + 可复现性**
- 明确边界比“假装生产就绪”更专业

</div>

---

## Q&A 备答（高频追问）

<div class="topkicker">Q&A · 问答</div>

<div class="cols">

<div class="card tight">

### 前端 / 可靠性
- 为什么 confirmed 后还要 post-state check？
- 事件监听丢了怎么办？
- pending 很久 / replacement 怎么处理？

</div>

<div class="card tight">

### 合约 / 安全 / 扩展
- 为什么要 approve？
- borrow/withdraw 的硬约束在哪里？
- 如果要上生产，你会怎么扩展（oracle/liquidation/interest）？

</div>

</div>

---

## 英文版与讲稿

<div class="topkicker">APPENDIX · 附录</div>

<div class="card tight">

- 英文 deck：`slides/INTERVIEW_DECK.en.md`
- 讲稿（可照读）：`slides/SPEAKER_SCRIPT.zh-cn.md`

</div>

---

# Thanks

<div class="topkicker">APPENDIX · 附录</div>

你想看合约还是前端？
