# Oracle 价格 decimals 与 LTV/清算价单位一致性及回归验证

**依据**：[09-本地链标准与地址.md](../09-本地链标准与地址.md) GATE 五项、[DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) 分层（GATE 后进入业务计算层）。**用途**：确保链/部署/读合约正常后，Oracle 价格精度与前端 LTV、清算价单位换算一致，并通过 /diagnostics 与 Evidence Pack 做回归验证。

---

## 一、GATE 与业务层顺序

1. **先过 GATE**：`npm run verify:consistency` → CONSISTENT（链、deployments、frontend、链上 code 对齐）。
2. **再进业务计算层**：Oracle 价格 decimals、collateralValue/debtValue 单位、清算阈值与前端展示一致。

---

## 二、合约侧单位约定（事实源）

| 来源 | 约定 |
|------|------|
| **IOracleRouter.getPrice(asset)** | 返回 **8 decimals**（e.g. 1e8 = 1 USD）。见 `contracts/interfaces/IOracleRouter.sol`、`contracts/oracle/OracleRouter.sol`、MockAggregator.decimals = 8。 |
| **getUserPosition**（oracle 已设置） | `supplied`/`borrowed` = token 数量（18 decimals）；`collateralValue` = (supplied × price) / 1e18 → **8 decimals (USD)**；HF = (collateralValue × lt) / debtValue，debtValue = (borrowed × price) / 1e18 → **8 decimals**。 |
| **getUserPosition**（oracle 未设置） | `collateralValue` = supplied（18 decimals）；HF 基于 token 数量比。 |

---

## 三、前端与合约对齐

| 项 | 约定 | 代码位置 |
|----|------|----------|
| **Oracle 价格精度** | 前端与合约统一为 **8 decimals**。 | `frontend/src/config/runtime.ts`：`ORACLE_PRICE_DECIMALS = 8`。 |
| **collateralValue / 清算值展示** | 当 oracle 设置时，collateralValue 与「清算阈值价值」均为 **8 decimals**；formatUsd 使用 `formatUnits(v, ORACLE_PRICE_DECIMALS)`。 | `DashboardPage.tsx`：KPI totalCollateralUsd、RiskVizCard 的 formatUsd；`runtime.ts` 的 ORACLE_PRICE_DECIMALS。 |
| **清算阈值价值公式** | 与合约 value 空间一致：**liquidationThresholdValue = collateralValue × 100 / healthFactor**（HF 比例 100 = 1.0）。不再使用 (borrowed × 100) / ltPct（borrowed 为 token 数量，会混用单位）。 | `RiskVizCard.tsx`：liquidationThresholdValue 计算；注释说明与 IOracleRouter 8 decimals 一致。 |
| **LTV/Current LTV** | maxBorrow/borrowed 为 token 空间；Current LTV 展示时 capped（≤10000%）避免 maxBorrow 极小导致爆炸。 | `RiskVizCard.tsx`：currentLtvPct 上限。 |

---

## 四、回归验证步骤

### 4.1 GATE（链、部署、读合约）

- 执行：`npm run verify:consistency`。
- 期望：输出 **RESULT: CONSISTENT**；Read chainId、Wallet chainId、Deployments、链上 code 对齐。

### 4.2 /diagnostics

- 打开前端 **http://127.0.0.1:5173/diagnostics**（或实际端口）。
- 确认 **Read chainId**、**Wallet chainId**、**Deployments** 三项均为 **Yes**。
- 可选：Copy debug bundle、Download session evidence，用于 Evidence Pack。

### 4.3 业务层自检（Dashboard）

- 连接钱包（31337），打开 Dashboard。
- 有仓位且 oracle 已设置时：**Total collateral (USD)**、**Liquidation price (USD)**、**Risk overview** 中清算阈值与 margin 数值应合理（无异常巨大或为 0）；Health factor 与合约一致。
- 做一次 Supply 或 Repay 后，确认 KPI 与 Risk 卡片刷新正确。

### 4.4 Evidence Pack（留证）

- 最小集：diagnostics 三项 Yes 截图、`deployments/31337.json`、`verify:consistency` 输出、可选 sentinel 输出。
- 门禁脚本：`npm run p10:gate` 可生成 evidence-pack；控制台输出 EVIDENCE-PACK-MANIFEST-SHA256。
- 见 [09 Part 4.2](../09-本地链标准与地址.md)、[03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8。

---

## 五、变更摘要（本次修复）

- **RiskVizCard**：清算阈值价值由 `(borrowed * 100) / ltPct` 改为 **`(collateralValue * 100) / healthFactor`**，与合约 value 空间及 8 decimals 一致。
- **前端常量**：新增 `ORACLE_PRICE_DECIMALS = 8`，collateral/清算相关 formatUsd 统一使用该常量。
- **DashboardPage**：totalCollateralUsd 与 RiskVizCard formatUsd 均使用 `ORACLE_PRICE_DECIMALS`。

---

## 六、Borrow limit / maxBorrow / maxWithdraw 单位与 decimals（SSOT）

**约定**：与 [09-本地链标准与地址.md](../09-本地链标准与地址.md) 一致；数值展示与合约状态一致且可复现。

| 项 | 约定 | 代码位置 |
|----|------|----------|
| **合约返回值** | `calculateMaxBorrow` 返回 **剩余可借 headroom**（maxBorrowable − borrowed），`calculateMaxWithdraw` 返回剩余可提；单位均为 **token wei**（ERC20.decimals，本地 USD8 = 18）。 | `contracts/core/LendingPoolImpl.sol`；`frontend/src/hooks/useDashboard.ts`。 |
| **Borrow limit 量纲（关键）** | **KPI「Borrow limit」= LTV 上限 maxBorrowable**，非 headroom。公式：maxBorrowable = borrowed + maxBorrow（合约 headroom）。Collateral 111.11、LTV 75% 时 Borrow limit ≈ 83.33；Borrow limit used = borrowed / maxBorrowable；Available to borrow = headroom（formatToken(maxBorrow)）。 | `DashboardPage.tsx`：borrowLimit = formatToken(borrowed + maxBorrow)；borrowLimitUsedPct 分母用 maxBorrowable；RiskVizCard、preflightImpact 同口径。 |
| **前端 decimals 来源** | 统一使用 **合约真实 ERC20.decimals()**：`useTokenMetadata(contracts?.usd8)` → `usd8Decimals`。 | `DashboardPage.tsx`、`DashboardGrid.tsx`、`UserPosition.tsx`。 |
| **同一格式化逻辑** | 所有金额均通过 **formatToken(wei, tokenDecimals)** 展示；KPI 与 UserPosition 使用同一 decimals。 | `useDashboardForm.ts` 的 formatToken；UserPosition 使用 `tokenDecimals ?? DEFAULT_DECIMALS`。 |
| **无最小值 clamp** | UI 层**不**做最小值 clamp；0n 显示 "0"。**极小 headroom**：当 headroom &lt; 阈值（0.01）时显示 **≈0**，tooltip 写明 **「Headroom (maxBorrowable − borrowed). Remaining headroom negligible; at or near limit.»**，避免 0.000001 被误读为写死最小值。 | `format.ts` 的 formatHeadroomDisplay、headroomNegligibleTooltip；DashboardKpiBar、UserPosition。 |
| **HealthFactor 口径** | 合约存储 `healthFactor = (maxBorrowable * 100) / borrowed`（比例 ×100）；前端统一用 **formatHealthFactorForDisplay(healthFactor)**。Borrow usage 100% 时 HF = LT/LTV（如 LTV 75%、LT 80% → HF ≈ 1.067），与 Risk 卡片一致。 | `format.ts`；`config/runtime.ts` 的 HEALTH_FACTOR_*；DashboardKpiBar、UserPosition、RiskVizCard。 |

---

## 六.1、数值展示细节（避免误读）

| 项 | 约定 | 代码位置 |
|----|------|----------|
| **Borrow usage / limit used 百分比** | 统一取整规则：**≥100% 或 ≥99.95% → "100%"**；**99% ≤ pct &lt; 99.95% → 保留一位小数**（如 99.9%）；其余取整为整数。计算用 4 位小数精度（borrowed×1e6/maxBorrowable/1e4），避免 99.9999% 被粗粒度显示为 99%。 | `format.ts` 的 formatBorrowUsagePercent；DashboardKpiBar、RiskVizCard、preflightImpact。 |
| **Dashboard 与 Markets 金额精度** | totalSupply、totalBorrow、**Borrow limit**、Total liquidity 等主指标统一 **2 位小数**（TOKEN_AMOUNT_DECIMALS_MAIN）；KPI 的 Borrow limit / totalSupply / totalBorrow 的 **hover (title)** 展示完整精度。条件提示：Markets 连接后显示 **marketsLiveRatesFromChain**（"Live rates from chain."），未连接显示 marketsSubtitle。 | `config/runtime.ts`；DashboardPage（borrowLimitTitle/totalSupplyTitle/totalBorrowTitle）、DashboardKpiBar；MarketsPage；`config/ui.ts`。 |

---

## 七、Degraded 健康枚举与风险态 UX

**约定**：与 09 门禁及生产级可观测性一致。

| 项 | 约定 | 代码位置 |
|----|------|----------|
| **健康枚举** | 状态栏与 Evidence Pack 使用统一枚举：**ok**（正常）、**degraded**（数据/风险条件，提交前确认）、**writesDisabled**（写禁用，需先解决）。 | `config/ui.ts`：statusBarHealthEnum*、statusBarDegradedTooltip；DataStatusBar 的 aria-label、title。 |
| **Degraded 触发** | runtimeRisk.tier === "medium"、RPC fallback、或 blocksBehind &gt; 阈值时显示 "Degraded"；tooltip 与 Details 展示具体原因。**本地链 31337 例外**：仅因「Health factor at risk」不设 Degraded，以便 GATE 通过后状态栏为 OK，满足 Release Gate 门禁。 | `useRuntimeRisk.ts`（chainId === LOCAL_CHAIN_ID 时 HF at risk 不提升 tier）；DataStatusBar.tsx。 |
| **Evidence Pack** | /diagnostics 页展示 **Runtime risk (health enum)**：tier（low/medium/high）及 reasons；Debug bundle 已含 runtimeRiskSnapshot。 | DiagnosticsPage.tsx；copyDebugBundle。 |

---

## 八、修复后回归验证（完整闭环）

在确认链、部署与读合约均通过 **GATE 门禁** 后，按以下顺序做回归，确保借贷数值系统、风险模型与前端展示完全一致且具备生产级可观测性。

1. **GATE 五项**：`npm run verify:consistency` → 输出 **RESULT: CONSISTENT**。
2. **/diagnostics**：打开前端 /diagnostics，确认 **Read chainId**、**Wallet chainId**、**Deployments** 三项 **Yes**；确认 **Runtime risk (health enum)** 显示当前 tier 与 reasons（Degraded 时应有原因）。
3. **Evidence Pack**：按 09 Part 4.2 留证（diagnostics 截图、deployments+SHA256、可选 Debug bundle / Session evidence）；门禁脚本 `npm run p10:gate` 可生成 evidence-pack。
4. **E2E 回归**：执行 `npm run smoke:e2e` 或 `npm run e2e:core`（见 package.json），确认 Supply 等 happy path 与 Dashboard 数值展示与合约一致；Borrow usage/limit used 百分比与 headroom ≈0 展示符合 §六.1 规则；Dashboard 与 Markets 金额精度一致。

---

**文档版本**：与 09、DEBUG_PLAYBOOK、合约 IOracleRouter 及 LendingPoolImpl 注释一致。Oracle、LTV、健康枚举或数值展示逻辑变更时请同步本页与代码注释。
