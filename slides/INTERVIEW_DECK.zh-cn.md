---
marp: true
paginate: false
size: 16:9
theme: gaia
footer: "SimpleLending | Product Roadshow Deck | 2026-02-10"
title: "SimpleLending - 产品技术路演（中文版）"
author: "Smart Contract Projects"
keywords: "Web3, DeFi, Smart Contracts, Hardhat, React, TypeScript, Lending Protocol"
description: "产品技术路演：可复现、可验收的借贷 dApp（MVP）"
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
    padding: 56px 72px 112px 72px;
    display: flex;
    flex-direction: column;
    font-size: 28px;
    font-family: "Inter", "SF Pro Display", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif;
    line-height: 1.45;
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
    font-size: 60px; 
    letter-spacing: -0.5px; 
    line-height: 1.2;
    margin-bottom: 20px;
  }
  h2 { 
    font-size: 40px; 
    letter-spacing: -0.3px; 
    line-height: 1.3;
    margin-bottom: 16px;
  }
  h3 { 
    font-size: 30px; 
    letter-spacing: -0.2px;
    line-height: 1.4;
    margin-bottom: 14px;
  }
  h4 {
    font-size: 26px;
    letter-spacing: -0.1px;
    line-height: 1.4;
    margin-bottom: 10px;
    font-weight: 600;
  }
  h5 {
    font-size: 24px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 8px;
    font-weight: 500;
  }
  h6 {
    font-size: 22px;
    letter-spacing: 0px;
    line-height: 1.5;
    margin-bottom: 6px;
    font-weight: 500;
  }
  strong {
    color: var(--accent); 
    font-weight: 600;
  }
  a { 
    color: var(--link); 
    position: relative;
    text-decoration: none;
    border-bottom: 1px solid rgba(88, 166, 255, 0.3);
    transition: border-color 0.2s;
  }
  a:hover {
    border-bottom-color: var(--link);
  }
  

  /* Bottom pixel safety strip: override Marp pagination (::after) to avoid edge clipping */
  section::after {
    content: "" !important;
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    height: 2px !important;
    padding: 0 !important;
    background: var(--bg) !important;
    z-index: 9999 !important;
    pointer-events: none !important;
  }
  /* Enhanced readability for financial presentations */
  p {
    margin: 0 0 12px 0;
    line-height: 1.55;
  }
  
  ul, ol {
    line-height: 1.55;
    margin: 10px 0;
  }
  
  blockquote {
    border-left: 4px solid var(--accent);
    padding-left: 20px;
    margin: 16px 0;
    font-style: italic;
    color: var(--muted);
    font-size: 25px;
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
    font-size: 64px;
    margin-top: 72px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  .divider-sub {
    margin-top: 12px;
    font-size: 28px;
    color: var(--muted);
    font-weight: 400;
  }

  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px 30px;
    min-width: 0;
    font-size: 24px;
    line-height: 1.45;
  }

  /* Per-slide compact mode for dense pages */
  section.compact { font-size: 26px; }
  section.compact h1 { font-size: 56px; }
  section.compact h2 { font-size: 36px; margin-bottom: 16px; }
  section.compact h3 { font-size: 28px; margin-bottom: 14px; }
  section.compact .card { font-size: 23px; padding: 22px 30px; }
  section.compact .tight ul, section.compact .tight ol { margin: 4px 0 0 20px; }
  section.compact .tight li { margin: 4px 0; line-height: 1.5; }

  /* Per-slide dense mode (more aggressive than compact) */
  section.dense { font-size: 24px; }
  section.dense h1 { font-size: 52px; }
  section.dense h2 { font-size: 34px; margin-bottom: 14px; }
  section.dense h3 { font-size: 26px; margin-bottom: 12px; }
  section.dense .card { font-size: 21px; padding: 18px 24px; }
  section.dense .tight ul, section.dense .tight ol { margin: 2px 0 0 18px; }
  section.dense .tight li { margin: 2px 0; line-height: 1.4; }
  section.dense pre { font-size: 20px; padding: 16px 18px; margin: 12px 0; }
  section.dense img { max-height: 58vh; }
  section.dense footer { font-size: 12px; margin-bottom: 20px; }
  section.dense .evidence { font-size: 12px; padding: 8px 12px; }

  /* Ultra-dense mode for slides that still overflow */
  section.ultra { font-size: 22px; }
  section.ultra h1 { font-size: 48px; }
  section.ultra h2 { font-size: 32px; margin-bottom: 12px; }
  section.ultra h3 { font-size: 24px; margin-bottom: 10px; }
  section.ultra .card { font-size: 19px; padding: 14px 20px; }
  section.ultra .tight ul, section.ultra .tight ol { margin: 2px 0 0 16px; }
  section.ultra .tight li { margin: 2px 0; line-height: 1.35; }
  section.ultra pre { font-size: 18px; padding: 12px 14px; margin: 10px 0; }
  section.ultra img { max-height: 54vh; }
  section.ultra footer { font-size: 11px; margin-bottom: 18px; }
  section.ultra .evidence { font-size: 11px; padding: 6px 10px; }

  /* Extra safety for PDF viewers that clip bottom pixels */
  section.safefooter { padding-bottom: 176px; }
  section.safefooter footer { font-size: 12px; margin-bottom: 34px; }
  section.safefooter .card { font-size: 18px; line-height: 1.35; padding: 18px 24px; }
  section.safefooter .card p { margin: 0 0 8px 0; line-height: 1.35; }
  section.safefooter .card li { margin: 1px 0; }
  section.safefooter .tight ul, section.safefooter .tight ol { margin: 2px 0 0 18px; }
  section.safefooter code { font-size: 18px; }
  section.safefooter img { max-height: 14vh !important; box-shadow: none !important; }
  section.safefooter .evidence { font-size: 11px; padding: 6px 10px; line-height: 1.35; backdrop-filter: none; margin-top: 12px !important; }

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
    white-space: normal;
    font-size: 22px;
    font-family: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", monospace;
    background: rgba(22, 27, 34, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1.5;
  }

  .tight ul, .tight ol { margin: 4px 0 0 22px; }
  .tight li { margin: 4px 0; line-height: 1.5; }

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
    position: static;
    order: 98;
    margin-top: auto;
    align-self: flex-start;
    padding: 10px 16px;
    font-size: 14px;
    color: rgba(201, 209, 217, 0.9); /* Improved contrast */
    background: var(--panel-strong);
    border: 1px solid rgba(110, 118, 129, 0.5);
    border-radius: 12px;
    backdrop-filter: blur(4px);
    font-weight: 400;
    line-height: 1.4;
    max-width: 100%;
    word-break: break-word;
  }

  .evidence + footer {
    margin-top: 12px;
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

  /* Footer as a bottom row (never overlaps content) */
  section footer {
    order: 99;
    margin-top: auto;
    position: static !important;
    inset: auto !important;
    height: auto !important;
    line-height: 1.3 !important;
    padding: 0 !important;
    font-size: 14px;
    color: rgba(201, 209, 217, 0.65);
    text-align: left;
    font-weight: 400;
    margin-bottom: 28px;
  }
---

# SimpleLending
## 可复现的借贷产品原型（MVP）

<div class="subtitle">可复现 · 可验收 · 安全基线 · 端到端闭环</div>

<div class="card tight" style="margin-top: 32px; margin-bottom: 24px;">

- **面向对象**：投资人 / 合作伙伴 / 技术决策者 / 架构工程师
- **产品能力**：抵押存入 → 借款 → 还款 → 取出（端到端闭环）
- **交付形态**：合约 + 前端 + 一键部署/导出 + 自动化验证

</div>

---

## Agenda（面向多角色）

<div class="topkicker">OVERVIEW · 概览</div>

讲法：先审题列验收点，再展示证据与实现。

按做题节奏：接到要求 → 审题 → 拆验收点 → 落地 → 验证 → 交付。

<div class="cols" style="margin-top: 32px;">

<div class="card tight">

### Part A
1) 产品价值与适用场景
2) 端到端架构
3) 关键设计取舍与边界
4) 可靠性（交易生命周期 + 刷新）

</div>

<div class="card tight">

### Part B
5) 安全 baseline
6) 测试、可复现与可运营
7) Demo（演示）+ Q&A

</div>

</div>

---

## 关键术语与接口（中英对照）

<div class="card">

- **Supply（存入/做抵押）**：`supply(amount)`
- **Borrow（借款）**：`borrow(amount)`
- **Repay（还款）**：`repay(amount)`
- **Withdraw（取出/赎回）**：`withdraw(amount)`

环境信息（本地 PoC 默认）：
- **ChainId 31337**：Hardhat 本地链（不是端口）
- **RPC**：`http://127.0.0.1:8545`（Hardhat node 默认）
- **前端**：`http://localhost:5173`（Vite 默认）

</div>

---

## Executive Summary（对四类受众的一页结论）

<div class="topkicker">OVERVIEW · 概览</div>

- **投资人**：可路演、可复盘的借贷 MVP（价值与边界清晰）
- **合作伙伴**：ABI + 地址一键导出（`frontend/src/contracts/deployments.json` + `frontend/src/abis/*.json`）+ 标准化事件
- **技术决策者**：on-chain 强约束 + 验收路径明确 + Non-goals 清晰
- **架构工程师**：读写分离 + 交易状态机 + 刷新/回填兜底

一句话：
> “可复现、可验收的借贷 MVP：端到端闭环 + on-chain 强约束 + 工程化交付。”

---

## 产品能力与证据

<div class="topkicker">OVERVIEW · 概览</div>

![requirements](./assets/requirements-mapping.svg)

<div class="evidence">Evidence: <strong>docs/ASSESSMENT_MAPPING.md</strong> · <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

<!-- _class: compact dense -->

## 一分钟概览（价值 + 可信）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="cols">

<div class="card tight">

### 产品价值（对业务/合作）
- 端到端闭环：抵押借贷全流程可演示、可复盘
- 易接入：导出 ABI + 地址 + 前端读写分离（便于集成与联调）

</div>

<div class="card tight">

### 技术可信（对决策/架构）
- on-chain 强约束：LTV=75%，borrow/withdraw 硬 revert
- 可靠性（主路径）：状态机 + confirmed(TX_CONFIRMATIONS) 后 `onConfirmed()` 刷新（dashboard/allowance）
- 可靠性（读模型兜底）：事件 events + 有界回填 backfill（`EVENT_BACKFILL_MAX_BLOCKS = 2000`）
- 安全基线：nonReentrant / SafeERC20 / Pausable + 前端网络/金额解析防护

</div>

</div>

---

<!-- _class: compact dense -->

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="divider-title">Architecture</div>
<div class="divider-sub">端到端架构与工程边界</div>

---

## 架构（端到端）

<div class="topkicker">ARCHITECTURE · 架构</div>

![architecture](./assets/architecture.svg)

<div class="evidence">Evidence: <strong>scripts/_lib/export.ts</strong> · <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>

---

## 项目结构（快速定位关键模块）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="card tight">

- 合约：`contracts/`
  - `SimpleLending.sol`：业务规则 + 安全组件
  - `TestToken.sol`：USD8 测试代币（WETH 仅前端余额展示，display-only）
- 部署：`scripts/deploy.ts`（deploy+seed+export）
- 前端：`frontend/`（React + ethers v6）
- 测试：`test/SimpleLending.integration.ts`

</div>

---

<!-- _class: compact -->

## 关键模块定位（证据点）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="cols">

<div class="card tight">

### Part 1：Deploy / Seed / Export
- `scripts/deploy.ts`
- `scripts/_lib/export.ts`

### Part 2：Frontend 交互 + 实时更新
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/hooks/useDashboard.ts`（事件 events + 回填 backfill）
- `frontend/src/hooks/useActions.ts`（write model + tx）

</div>

<div class="card tight">

### Part 3：工程化与可运营
- `test/SimpleLending.integration.ts`（关键 revert 覆盖）
- `frontend/src/state/tx.ts`（交易状态机）
- `scripts/smoke-e2e.mjs`（自动化验证 verification）

</div>

</div>

---

<!-- _class: compact -->

<div class="topkicker">CONTRACT · 合约</div>

<div class="divider-title">Contract</div>
<div class="divider-sub">业务规则与 on-chain 强约束</div>

---

<!-- _class: compact dense ultra safefooter -->

## 合约：业务规则（核心）

<div class="topkicker">CONTRACT · 合约</div>

- 单币种：USD8 同时用于 supply 和 borrow
- WETH：仅用于前端余额展示（display-only，不参与协议）
- LTV = 75%（`maxBorrow = supplied * 75%`）
- borrow require：`token.balanceOf(address(this)) >= amount`（"Insufficient liquidity"）；`userBorrow + amount <= (userSupply * 75)/100`（"Exceeds borrowing limit"）
- withdraw require：`userSupply >= amount`（"Insufficient supply"）；`borrowed <= (newSupply * 75)/100`（"Withdrawal would make position unhealthy"）

总结：
> “借款/取款不是 UI 控制，是合约强制 revert。”

---

## LTV 约束（为何可信）

<div class="topkicker">CONTRACT · 合约</div>

![ltv](./assets/ltv-constraints.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> (LTV_RATIO, borrow(), withdraw(), calculateMaxBorrow(), calculateMaxWithdraw())</div>

---

<!-- _class: compact -->

## 设计取舍（Tradeoffs）

<div class="topkicker">DECISIONS · 取舍</div>

<div class="cols">

<div class="card tight">

### Scope 取舍（刻意不做）
- 单币种 + 固定 LTV：降低复杂度，聚焦核心闭环与可验证性
- 不做预言机/清算/多资产：明确 non-goals，避免对“生产就绪”的误导

</div>

<div class="card tight">

### 可靠性优先（面向真实网络条件）
  - 交易状态机：idle → signing → pending → confirmed/failed/stuck（含 timeout、TRANSACTION_REPLACED）
  - confirmed(TX_CONFIRMATIONS) 后触发 `onConfirmed()` 刷新读模型：抵抗 RPC eventual consistency
- 事件 events 监听 + 有界回填 backfill 兜底：提升一致性与可恢复性（best-effort）

</div>

</div>

---

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="divider-title">Reliability</div>
<div class="divider-sub">交易生命周期 + UI 刷新</div>

---

## 交易状态机（工程可靠性核心）

<div class="topkicker">RELIABILITY · 可靠性</div>

![tx](./assets/tx-state-machine.svg)

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong> · <strong>frontend/src/state/txStore.ts</strong></div>

---

<!-- _class: compact dense ultra safefooter -->

## 合约：关键函数（Checks / Effects / Interactions）

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

边界声明：
- 本项目不做预言机/清算/多资产，保持 MVP 范围

---

<!-- _class: compact dense -->

## 前端：读写分离（Provider vs Signer）

<div class="topkicker">FRONTEND · 前端</div>

- Read model（纯读 RPC + 并发刷新）：
  - `Promise.all` 并发读取：`balanceOf`/`getPoolInfo`/`getUserPosition`/`calculateMax*`
  - `refreshSeq` 防止并发 refresh 的“旧数据覆盖新数据”
  - chainId 校验：`network.chainId === deployments.chainId`（错链直接报错）
- Write model（高不确定性）：
  - signer 发交易 + `runTxDetailed` 生命周期（含超时/替换）+ confirmed 后回调刷新

收益：
- 读写隔离：写流程不直接“手改余额/仓位”，以链上读为单一事实源
- confirmed 后触发 `onConfirmed()`：`allowance.refresh()` + `dashboard.refresh()`

---

## 前端：交易状态机（为何不能“发完就算”）

<div class="topkicker">RELIABILITY · 可靠性</div>

- stages：idle → signing → pending → confirmed/failed/stuck
- 处理现实世界问题：
  - 用户拒绝签名
  - pending 很久
  - speed up / replacement
  - RPC 读延迟（confirmed ≠ 立刻读到）

---

<!-- _class: compact dense ultra safefooter -->

## 刷新策略（3 层）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-bottom: 12px;">

**三层刷新机制**（按优先级）：
1) **Tx confirmed 后强制刷新**：`tx.wait(TX_CONFIRMATIONS)` / `provider.waitForTransaction` 后触发 `onConfirmed()` 刷新读模型
2) **合约事件监听**（主路径）：`Supplied` / `Withdrawn` / `Borrowed` / `Repaid`
3) **Fail-safe 兜底**：节流 block 监听（≈3s）+ 小范围回填 backfill（`EVENT_BACKFILL_MAX_BLOCKS = 2000`，best-effort）

实现阈值（可审计）：
- `scheduleRefresh`：≈250ms 节流（事件 burst 不抖 UI）
- block listener：connected + correct chain + txStage≠signing/pending/stuck + dashboard 非 loading
- backfillEvents（best-effort）：`queryFilter(from..to)`；有日志则 refresh；cursor=`to+1`；异常下次重试
- pending 超时：`TX_PENDING_TIMEOUT_MS`（30s@31337 / 120s@非本地）
- post-state 校验：每 500ms 轮询，预算 `POST_STATE_MAX_WAIT_MS`；超时标记 unverified（"RPC reads may be lagging; use Refresh to re-check"）

</div>

<img src="./assets/refresh-strategy.svg" style="max-height: 14vh;" />

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/config/runtime.ts</strong></div>

---

<!-- _class: compact dense -->

## 演示流程（端到端）

<div class="topkicker">DEMO · 演示</div>

<div class="cols">

<div class="card tight">

### 演示步骤
1) Connect
2) Supply（必要时 approve）
3) Borrow（展示 LTV=75%）
4) Repay（必要时 approve）
5) Withdraw（展示健康检查）

</div>

<div class="card tight">

### 关键可靠性设计
- tx 状态机：idle → signing → pending → confirmed/failed/stuck（含 timeout、TRANSACTION_REPLACED）
- confirmed(TX_CONFIRMATIONS) 后强制刷新 + post-state 校验（verifying/verified/unverified）：抵抗 RPC 读延迟
- 事件 events 主路径 + 有界回填 backfill/节流兜底：提升一致性与可恢复性（best-effort）

</div>

</div>

---

## 前端：Approve（Allowance）机制

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

<!-- _class: compact dense -->

## 错误处理：归一化

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="cols">

<div class="card tight">

### 目标
把 provider / ethers / wallet 的错误统一成“可解释、可展示、可追踪”的分类。

### 主要分类
- UserRejected（`code=4001` 或 message 命中 rejected）
- NetworkMismatch（message 命中 "Wrong network"）
- Revert（`code=CALL_EXCEPTION` 或 message 命中 reverted）
- Rpc（message 命中 network/timeout/failed to fetch/ECONN）
- 其他：InsufficientBalance / InsufficientAllowance / Validation / Unknown

</div>

<div class="card tight">

### 展示策略
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

### 集成测试（贴近验收与回归）
- approve → supply → borrow → repay → withdraw

结论：
> “完整闭环 + 可复现验收路径。”

</div>

<div class="card tight">

### 两个最关键的安全边界
- borrow 超 LTV：revertedWith("Exceeds borrowing limit")
- withdraw 导致不健康：revertedWith("Withdrawal would make position unhealthy")

结论：
> “happy path + 两个最重要的安全边界。”

</div>

</div>

---

<!-- _class: dense -->

## 安全与 UX 安全（补充项）

<div class="topkicker">SECURITY · 安全</div>

![security](./assets/security-hardening.svg)

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> · <strong>frontend/src/utils/amount.ts</strong> · <strong>frontend/src/hooks/useWallet.ts</strong></div>

---

## 可复现流水线（Reproducibility）

<div class="topkicker">REPRODUCIBILITY · 可复现</div>

![pipeline](./assets/pipeline.svg)

<div class="evidence">Evidence: <strong>package.json</strong> scripts · <strong>scripts/deploy.ts</strong> · <strong>scripts/smoke-e2e.mjs</strong></div>

---

## 交付与可运营（企业级检查项）

<div class="topkicker">DELIVERY · 交付</div>

<div class="cols">

<div class="card tight">

### 可复现 / 可验收
- **可复现**：一键脚本 + ABI + 地址导出 + lockfile
- **可验收**：集成测试覆盖闭环 + 两个关键 revert

</div>

<div class="card tight">

### 可演示 / 风险边界
- **可运营**：`smoke:e2e` 自动化验证，降低联调与演示不确定性
- **边界清晰**：明确 Non-goals（无预言机/清算/多资产），避免误导“生产就绪”
- **全栈对接（设计稿，非本仓实现）**：Next.js/Node 做 BFF（REST）+ JWT；PostgreSQL 存应用态/索引视图；可选 Kafka 做事件摄取与异步重试（best-effort）

</div>

</div>

---

## 演示脚本（5 分钟）

<div class="topkicker">DEMO · 演示</div>

0) 启动：node + deploy + frontend
1) Connect（自动切链 31337）
2) Supply（必要时 approve）
3) Borrow（展示 LTV=75%）
4) Repay（必要时 approve）
5) Withdraw（展示健康检查）
6) 收尾：亮点与边界

---

## 自动化验证（Plan B）

<div class="topkicker">DEMO · 演示</div>

<div class="cols">

<div class="card tight">

### 什么时候用
- 钱包交互不稳定 / 网络波动 / 需要快速回归验证

</div>

<div class="card tight">

### 验证方式
- 直接跑脚本闭环：`npm run smoke:e2e`
- 它会用导出的 ABI + 地址完成同样 approve → supply → borrow → repay → withdraw

</div>

</div>

---

## Scope / Non-goals

<div class="topkicker">SCOPE · 范围</div>

<div class="card tight">

### 不做（刻意）
- 预言机、多资产、清算、主网部署

### 为什么
- MVP 重点：**合约集成 + 前端交易体验 + 可复现性**
- 明确边界比“假装生产就绪”更专业

</div>

---

## Q&A（投资/合作/技术共用）

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
- 路线图：如何扩展（oracle / liquidation / interest / multi-asset）？
- 若接入后端（Next.js/Node + JWT + Postgres + Kafka）：如何设计“链上为源 + 后端索引/缓存”的一致性与重试？

</div>

</div>

---

## 相关材料

<div class="topkicker">APPENDIX · 附录</div>

<div class="card tight">

- 英文版演示文稿：见仓库 slides 目录
- 中文版演示文稿：见仓库 slides 目录

</div>

---

# Thanks

<div class="topkicker">APPENDIX · 附录</div>

欢迎交流：产品价值 / 集成方式 / 安全与架构
