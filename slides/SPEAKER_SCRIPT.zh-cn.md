---
marp: true
paginate: true
size: 9:16
theme: gaia
footer: "SimpleLending | Speaker Script Deck | 2026-02-10"
title: "SimpleLending - 口播稿（中文）"
author: "Smart Contract Projects"
keywords: "Web3, DeFi, Smart Contracts, Hardhat, React, TypeScript, Lending Protocol"
description: "与 slides/INTERVIEW_DECK.zh-cn.md 1:1 对齐的口播稿（逐页对应）"
style: |
  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg: #0b1020;
    --panel: rgba(22, 27, 34, 0.65);
    --panel-strong: rgba(22, 27, 34, 0.85);
    --border: rgba(110, 118, 129, 0.25);
    --fg: #e6edf3;
    --muted: rgba(201, 209, 217, 0.85);
    --muted2: rgba(201, 209, 217, 0.70);
    --accent: #7ee787;
    --link: #58a6ff;
  }

  section {
    background: var(--bg) !important;
    color: var(--fg) !important;
    padding: 48px 56px 160px 56px;
    display: flex;
    flex-direction: column;
    font-size: 25px;
    font-family: "Inter", "SF Pro Display", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif;
    line-height: 1.4;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  p {
    margin: 0 0 10px 0;
    line-height: 1.5;
  }
  ul, ol {
    line-height: 1.5;
    margin: 8px 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--fg);
    font-weight: 600;
  }
  h1 {
    font-size: 52px;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 20px;
  }
  h2 {
    font-size: 34px;
    letter-spacing: -0.3px;
    line-height: 1.3;
    margin-bottom: 16px;
  }
  h3 {
    font-size: 26px;
    letter-spacing: -0.2px;
    line-height: 1.4;
    margin-bottom: 14px;
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
  a:hover { border-bottom-color: var(--link); }

  /* Slide top decoration */
  section::before {
    content: "";
    position: absolute;
    left: 56px;
    right: 56px;
    top: 48px;
    height: 2px;
    background: linear-gradient(90deg, rgba(110,118,129,0.0), rgba(110,118,129,0.45), rgba(110,118,129,0.0));
    opacity: 0.6;
  }

  /* Pagination (page number) — keep it away from the bottom edge */
  section::after {
    right: 56px !important;
    bottom: 48px !important;
    font-size: 12px !important;
    color: rgba(201, 209, 217, 0.55) !important;
  }

  .topkicker {
    position: absolute;
    left: 56px;
    top: 24px;
    font-size: 15px;
    letter-spacing: 2.0px;
    text-transform: uppercase;
    color: var(--muted2);
    font-weight: 500;
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
    padding: 16px 20px;
    min-width: 0;
    font-size: 21px;
    line-height: 1.4;
  }

  .tight ul, .tight ol { margin: 6px 0 0 22px; }
  .tight li { margin: 3px 0; line-height: 1.45; }

  .subtitle {
    margin-top: 12px;
    font-size: 21px;
    color: var(--muted);
    font-weight: 400;
    line-height: 1.5;
  }

  .evidence {
    position: static;
    order: 98;
    margin-top: auto;
    align-self: flex-start;
    padding: 10px 16px;
    font-size: 14px;
    color: rgba(201, 209, 217, 0.9);
    background: var(--panel-strong);
    border: 1px solid rgba(110, 118, 129, 0.5);
    border-radius: 12px;
    font-weight: 400;
    line-height: 1.4;
    max-width: 100%;
    word-break: break-word;
  }
  .evidence strong {
    color: rgba(201, 209, 217, 0.95);
    font-weight: 600;
  }

  /* Footer as a bottom row (never overlaps content) */
  section > footer, section footer.marp-footer {
    order: 99;
    margin-top: auto;
    position: static !important;
    inset: auto !important;
    bottom: auto !important;
    height: auto !important;
    line-height: 1.3 !important;
    padding: 0 !important;
    font-size: 12px;
    color: rgba(201, 209, 217, 0.65);
    text-align: left;
    font-weight: 400;
    margin-bottom: 20px;
  }
---

# SimpleLending
## 口播稿（逐页对齐）

<div class="subtitle">可复现 · 可验收 · 安全基线 · 端到端闭环</div>

<div class="card tight" style="margin-top: 28px;">

定位：这是笔试题的落地实现，对应题面 **Coding Test Assignment - Web3 engineer**；要求在本地 Hardhat 部署合约、导出 ABI/地址，并用 React + TypeScript + ethers v6 跑通借贷闭环（交易 + 状态 + 更新）。

接到要求后我先列“可验收点”清单，再按清单逐项交付、逐项自证。做题顺序：

1) **审题**：列验收清单
2) **跑通环境**：本地链 + 部署/seed
3) **打通集成**：导出 ABI/地址 + 前端读写分离
4) **做稳体验**：tx 状态机 + confirmed 刷新 + events/backfill

验收看三件事：功能齐、边界清、体验稳。

</div>

<div class="evidence">Evidence: <strong>docs/CODING_TEST_ASSIGNMENT.txt</strong> · 对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 1 页</div>

---

## Agenda（面向多角色）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="card tight" style="margin-top: 32px;">

讲法很简单：先按题面验收清单过一遍，再挑三处工程亮点深挖。

我会按我当时做题的顺序讲：先把环境与导出物跑通，再把合约规则落到链上，最后把前端交易体验和可靠性做稳。

验收清单：部署脚本与导出物、钱包与网络、approve、dashboard 指标、四个交易、实时更新。

深挖三点：合约强约束（revert）、前端交易状态机、以及 confirmed + events + backfill 的刷新链路。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 2 页</div>

---

## 关键术语与接口（中英对照）

<div class="card tight">

这里先统一一下术语，后面我会一直按这四个动作讲：Supply、Borrow、Repay、Withdraw。

环境也说清楚：默认是 Hardhat 本地链（chainId 31337），RPC 是 `http://127.0.0.1:8545`，前端是 Vite 的 `http://localhost:5173`。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 3 页</div>

---

## Executive Summary（对四类受众的一页结论）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="card tight">

我用四句话把价值点对齐：

- 对投资人：可演示、可复盘，闭环与边界清楚。
- 对合作伙伴：ABI + 地址一键导出，事件标准化，便于集成。
- 对技术决策者：关键约束在链上，验收路径明确，Non-goals 清晰。
- 对架构工程师：读写分离 + 交易状态机 + 刷新/回填兜底。

后面每一页我都会尽量带上“证据点”，你可以回到仓库直接核对。

</div>

<div class="evidence">Evidence: <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>

---

## 产品能力与证据

<div class="topkicker">OVERVIEW · 概览</div>

<div class="card tight" style="margin-top: 28px;">

这一页对应我说的“审题”：我不靠口头描述功能，而是把题面要求逐条拉成“验收点 → 代码证据”。

你可以按题面 rubric 来验收：钱包/网络切换与持久化、approve 流程、dashboard 指标、四个交易、交易状态展示，以及事件监听带来的实时更新。

我做题时的节奏也很直白：先把 happy path 跑通（能真实发交易、能看到链上状态变化），再补齐边界与可靠性（错链、revert、pending、replacement、RPC 读延迟）。

接下来我会先快速过一遍“价值 + 可信”，然后按“从部署到前端”的链路把关键模块讲清楚。

</div>

<div class="evidence">Evidence: <strong>docs/CODING_TEST_ASSIGNMENT.txt</strong> · <strong>docs/ASSESSMENT_MAPPING.md</strong> · <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

<!-- _class: compact dense -->

## 一分钟概览（价值 + 可信）

<div class="topkicker">OVERVIEW · 概览</div>

<div class="card tight" style="margin-top: 28px;">

先讲价值：它把抵押借贷的闭环做成可演示的产品形态，并且把接入成本降低到“导入 ABI + 地址即可”。

再讲可信：关键约束（比如 LTV=75%）不是 UI 控制，而是链上强制 revert。

工程上，我用交易状态机处理钱包/RPC 不确定性，并在 confirmed 后刷新读模型；事件监听 + 有界回填做 best-effort 兜底。

</div>

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

<!-- _class: compact dense -->

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="divider-title">Architecture</div>
<div class="divider-sub">端到端架构与工程边界</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 7 页</div>

---

## 架构（端到端）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="card tight" style="margin-top: 28px;">

这里我用一句话概括：部署脚本负责把“合约 + 初始状态 + 导出物”准备好；前端用导出物进行读写交互。

对外部集成来说，最关键的交付物就是 ABI 和地址，前端也是按这个方式接入的。

下一页我会把目录结构和关键模块的证据点标出来，方便快速定位。

</div>

<div class="evidence">Evidence: <strong>scripts/_lib/export.ts</strong> · <strong>frontend/src/contracts/deployments.json</strong> · <strong>frontend/src/abis/*.json</strong></div>

---

## 项目结构（快速定位关键模块）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="card tight" style="margin-top: 28px;">

这一页是“快速导航”：合约在 `contracts/`（核心 `SimpleLending.sol`），部署在 `scripts/deploy.ts`，前端在 `frontend/`，测试在 `test/SimpleLending.integration.ts`。

如果你想快速检查质量，我建议优先看：合约约束、部署导出、前端 hooks 的读写分离、以及交易状态机。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 9 页</div>

---

<!-- _class: compact -->

## 关键模块定位（证据点）

<div class="topkicker">ARCHITECTURE · 架构</div>

<div class="card tight" style="margin-top: 28px;">

我把关键链路按“做题步骤”拆成三块（方便你对照题面逐项验收）：

- Deploy / Seed / Export：先把链上环境与导出物准备好（没有地址/ABI，前端无法开始）
- Frontend 交互 + 实时更新：把闭环做成可演示的 UI（读模型 + 写模型(tx) + events/backfill）
- 工程化交付：把“我本机能跑”变成“你按命令也能跑”（集成测试 + smoke:e2e + 复现说明）

下一段我们进入合约：哪些规则是在链上强约束的。

</div>

<div class="evidence">Evidence: <strong>scripts/deploy.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong></div>

---

<!-- _class: compact -->

<div class="topkicker">CONTRACT · 合约</div>

<div class="divider-title">Contract</div>
<div class="divider-sub">业务规则与 on-chain 强约束</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 11 页</div>

---

<!-- _class: compact dense ultra safefooter -->

## 合约：业务规则（核心）

<div class="topkicker">CONTRACT · 合约</div>

<div class="card tight" style="margin-top: 24px;">

这一页我强调“为什么可信”：规则写在合约里，不是写在 UI 里。

实现上我先做“最小闭环规则”：四个动作能跑通；再把 LTV 与健康检查做成硬性约束（不满足就 revert），这样验收点是明确且可复现的。

核心约束是 LTV=75%。借款会检查池子 liquidity + 用户是否超过 `supplied * 75%`；取款会检查“取完后仍健康”，否则直接 revert。

所以 demo 里看到的“不能借/不能取”，不是前端挡你，是合约硬性拒绝。

</div>

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong></div>

---

## LTV 约束（为何可信）

<div class="topkicker">CONTRACT · 合约</div>

<div class="card tight" style="margin-top: 28px;">

这里把 LTV 的关系画出来，是为了快速判断：最大可借是多少、最大可取是多少。

面试里一句话就够：`maxBorrow` 由 `userSupply * 75%` 决定；`withdraw` 需要保证取完后的仓位仍健康。

</div>

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong> (borrow(), withdraw(), calculateMaxBorrow(), calculateMaxWithdraw())</div>

---

<!-- _class: compact -->

## 设计取舍（Tradeoffs）

<div class="topkicker">DECISIONS · 取舍</div>

<div class="card tight" style="margin-top: 28px;">

这里的取舍是刻意的：为了可复现与可验收，我选了单币种 + 固定 LTV，并把预言机/清算/多资产明确为 Non-goals。

然后我把“不确定性”当成题目的一部分来处理：状态机覆盖 pending/替换/超时；confirmed 后刷新读模型；事件监听 + 有界回填 best-effort 兜底。

下一段进入可靠性细节。

</div>

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useDashboard.ts</strong></div>

---

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="divider-title">Reliability</div>
<div class="divider-sub">交易生命周期 + UI 刷新</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 15 页</div>

---

## 交易状态机（工程可靠性核心）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-top: 28px;">

我不把交易当成“一次函数调用”，而是一个生命周期：签名、pending、confirmed/failed/stuck，还可能被 replacement。

这是在 happy path 之后我重点补齐的部分：前端所有 UI 展示都围绕状态机推进；confirmed 后再刷新读模型，减少 RPC 读延迟造成的错觉。

</div>

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong></div>

---

<!-- _class: compact dense ultra safefooter -->

## 合约：关键函数（Checks / Effects / Interactions）

<div class="topkicker">CONTRACT · 合约</div>

<div class="card tight" style="margin-top: 24px;">

这里用 CEI 视角快速过四个写函数：supply/repay 依赖 `transferFrom`（所以需要 approve），borrow/withdraw 由合约转账给用户。

关键是检查点：borrow 检查 liquidity + LTV；withdraw 检查余额 + 取完后的健康。

</div>

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong></div>

---

## 合约：安全组件（为什么要加）

<div class="topkicker">SECURITY · 安全</div>

<div class="card tight" style="margin-top: 28px;">

三个基础组件：`ReentrancyGuard` 防重入，`Pausable/Ownable` 紧急暂停，`SafeERC20` 兼容非标准 ERC20 行为。

同时保持边界：不做预言机/清算/多资产。

</div>

<div class="evidence">Evidence: <strong>contracts/SimpleLending.sol</strong></div>

---

<!-- _class: compact dense -->

## 前端：读写分离（Provider vs Signer）

<div class="topkicker">FRONTEND · 前端</div>

<div class="card tight" style="margin-top: 28px;">

读模型用 provider 并发读取，并用 `refreshSeq` 防止并发刷新造成旧数据覆盖。

写模型用 signer 发交易，通过 `runTxDetailed` 管理生命周期；confirmed 后触发 `onConfirmed()` 刷新 allowance 与 dashboard。

原则是：不“手改余额”，以链上读为单一事实源。

</div>

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong></div>

---

## 前端：交易状态机（为何不能“发完就算”）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-top: 28px;">

真实世界会遇到：拒签、长 pending、replacement、以及 confirmed 但 RPC 读延迟。

所以用状态机把分支明确化，并在 confirmed 后刷新读模型，必要时做 post-state check。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 20 页</div>

---

<!-- _class: compact dense ultra safefooter -->

## 刷新策略（3 层）

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-top: 24px;">

按优先级三层：1) confirmed 后强制刷新；2) 事件监听主路径；3) 节流 block 监听 + 有界回填 best-effort 兜底。

我不会承诺“永远一致”，但会把阈值、触发点与兜底路径讲清楚，让它可审计、可复盘。

</div>

<div class="evidence">Evidence: <strong>frontend/src/hooks/useDashboard.ts</strong> · <strong>frontend/src/config/runtime.ts</strong></div>

---

<!-- _class: compact dense -->

## 演示流程（端到端）

<div class="topkicker">DEMO · 演示</div>

<div class="card tight" style="margin-top: 28px;">

现场 demo 我会按：Connect → Supply → Borrow → Repay → Withdraw。

演示前我会先用部署脚本把环境准备好（地址/ABI 已导出），这样现场只关注“验收点”和“体验”。

刻意展示两件事：LTV 如何限制可借额度；以及 withdraw 的健康检查是如何被强制执行的。

同时用交易状态展示可靠性：pending/confirmed/超时/替换都有明确反馈，confirmed 后自动刷新。

</div>

<div class="evidence">Evidence: <strong>frontend/src/state/tx.ts</strong> · <strong>frontend/src/hooks/useActions.ts</strong></div>

---

## 前端：Approve（Allowance）机制

<div class="topkicker">FRONTEND · 前端</div>

<div class="card tight" style="margin-top: 28px;">

Supply/Repay 需要 approve，因为内部用 `transferFrom`。

前端用 approve-if-needed：够就跳过，不够才引导 approve，并兼容 USDT 风格的 `approve(0) → approve(amount)`。

</div>

<div class="evidence">Evidence: <strong>frontend/src/hooks/useActions.ts</strong></div>

---

<!-- _class: compact dense -->

## 错误处理：归一化

<div class="topkicker">RELIABILITY · 可靠性</div>

<div class="card tight" style="margin-top: 28px;">

把 wallet/provider/ethers 的错误归一成可解释类别：拒签、错链、revert、RPC 超时/断网、余额/allowance 不足等。

UI 原则：一句话结论 + 保留技术细节 + 在可重试场景给下一步建议。

</div>

<div class="evidence">Evidence: <strong>frontend/src/hooks/useActions.ts</strong></div>

---

## 测试：覆盖哪些关键边界

<div class="topkicker">TESTING · 测试</div>

<div class="card tight" style="margin-top: 28px;">

测试走集成路径：approve → supply → borrow → repay → withdraw。

并覆盖两个关键边界：borrow 超 LTV 必须 revert；withdraw 取完不健康必须 revert。

</div>

<div class="evidence">Evidence: <strong>test/SimpleLending.integration.ts</strong></div>

---

<!-- _class: dense -->

## 安全与 UX 安全（补充项）

<div class="topkicker">SECURITY · 安全</div>

<div class="card tight" style="margin-top: 28px;">

补充项：前端做网络校验、金额解析与错误提示，减少误操作与联调摩擦。

这些不是“更强保证”，但对可用性很关键。

</div>

<div class="evidence">Evidence: <strong>frontend/src/utils/amount.ts</strong> · <strong>frontend/src/hooks/useWallet.ts</strong></div>

---

## 可复现流水线（Reproducibility）

<div class="topkicker">REPRODUCIBILITY · 可复现</div>

<div class="card tight" style="margin-top: 28px;">

作为应聘者，这一步（Step 8）非常关键：把“我本机能跑”变成“你按命令也能跑”。

可复现不是口号，而是从依赖 → 本地链（`npm run node`）→ 部署与导出（`npm run deploy:localhost`）→ 前端读写 → 自动化验证（`npm test` / `npm run smoke:e2e`）的一条流水线。

这样面试官或 reviewer 拿到仓库后，可以直接用脚本复现同样的闭环结果。

</div>

<div class="evidence">Evidence: <strong>package.json</strong> scripts · <strong>scripts/deploy.ts</strong> · <strong>scripts/smoke-e2e.mjs</strong></div>

---

## 交付与可运营（企业级检查项）

<div class="topkicker">DELIVERY · 交付</div>

<div class="card tight" style="margin-top: 28px;">

回答“能否接手”：可复现（脚本+导出+锁依赖），可验收（集成测试闭环+关键 revert），可运营（smoke:e2e Plan B）。

另外题面也要求交付说明（例如 README 的启动方式、假设与技术决策）；我在讲解里会把这些决策用“证据点”对应到代码位置，方便 reviewer 快速核对。

“全栈对接”这里明确是设计稿（非本仓实现）：如果需要 BFF/DB/消息队列，链上仍是源，后端做索引/缓存与重试补偿。

</div>

<div class="evidence">Evidence: <strong>scripts/smoke-e2e.mjs</strong> · <strong>test/SimpleLending.integration.ts</strong></div>

---

## 演示脚本（5 分钟）

<div class="topkicker">DEMO · 演示</div>

<div class="card tight" style="margin-top: 28px;">

5 分钟节奏：启动 → Connect → Supply → Borrow → Repay → Withdraw → 收尾（亮点与 Non-goals）。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 29 页</div>

---

## 自动化验证（Plan B）

<div class="topkicker">DEMO · 演示</div>

<div class="card tight" style="margin-top: 28px;">

当钱包交互不稳定时直接跑：`npm run smoke:e2e`，它会用导出 ABI + 地址走同样的闭环。

</div>

<div class="evidence">Evidence: <strong>scripts/smoke-e2e.mjs</strong></div>

---

## Scope / Non-goals

<div class="topkicker">SCOPE · 范围</div>

<div class="card tight" style="margin-top: 28px;">

不做：预言机、多资产、清算、主网部署。

原因：聚焦合约集成 + 前端交易体验 + 可复现验收。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 31 页</div>

---

## Q&A（投资/合作/技术共用）

<div class="topkicker">Q&A · 问答</div>

<div class="card tight" style="margin-top: 28px;">

我会把问题引导到三个方向：前端可靠性、合约约束与安全、以及扩展与全栈对接（设计稿）。

你也可以直接按你最关心的角色来问。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 32 页</div>

---

## 相关材料

<div class="topkicker">APPENDIX · 附录</div>

<div class="card tight" style="margin-top: 28px;">

中文/英文演示文稿都在 `slides/`。

题目要求与对齐关系：`docs/ASSESSMENT_MAPPING.md`。

可复现与脚本：`scripts/deploy.ts`、`scripts/smoke-e2e.mjs`。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 33 页</div>

---

# Thanks

<div class="topkicker">APPENDIX · 附录</div>

<div class="card tight" style="margin-top: 28px;">

收尾我会回到三点：端到端可复现、链上强约束、以及用状态机 + 刷新/回填处理不确定性。

欢迎继续追问：产品价值、集成方式、或者安全与架构细节。

</div>

<div class="evidence">对应 <strong>slides/INTERVIEW_DECK.zh-cn.md</strong> 第 34 页</div>
