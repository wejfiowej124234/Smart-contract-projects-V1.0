# 审计留证套件（基线 + 架构 + 测试 + 前端）

**约定**：本文档由原 **AUDIT-BASELINE**、**AUDIT-ARCHITECTURE**、**AUDIT-TEST-RESULTS**、**AUDIT-FRONTEND** 合并而成，作为安全/审计留证单一入口。Part A–D 分别对应基线、目录与模块化、全量测试与门禁、前端审计。

---

# Part A：审计基线（v1.0 Local-Only 全栈审计）

**角色**：Protocol Security Lead + Staff Engineer + Frontend QA Lead  
**原则**：以代码/脚本/测试/运行结果为唯一事实来源  
**产出**：Step 0 产出，供后续步骤引用。

## 1. 仓库信息

| 项 | 值 | 证据 |
|----|-----|------|
| **commit** | `9101e124660b6ec00947dec34a49e92c85c9445a` | `git rev-parse HEAD` |
| **Node** | v22.14.0 | `node -v` |
| **npm** | 10.9.2 | `npm -v` |
| **OS** | Windows 10.0.26100.0 | `[System.Environment]::OSVersion` |
| **package.json version** | 1.0.0 | `package.json` → `"version": "1.0.0"` |

## 2. 关键入口

### 2.1 后端/合约

| 路径 | 说明 |
|------|------|
| **contracts/** | 合约源码：core/（LendingPoolImpl、ReserveLogic、RiskEngine、Liquidation、PoolConfigurator、Treasury、FlashLoan、LinearRateStrategy、UserConfiguration）、oracle/、tokens/、governance/、libs/、mocks/、SimpleLending.sol、ImportProxy.sol |
| **scripts/deploy/** | deploy.ts（部署+seed+export）、deploy-p9.ts（P9 治理部署） |
| **scripts/governance/** | transfer-admin、first-proposal-setltv、verify-p9-complete、verify-guardian、second-proposal-setlt、proxy-upgrade-drill |
| **scripts/ci/** | run-p10-full.mjs（p10:ci）、p10-local-only-gate.mjs（p10:gate）、run-e2e-ui.mjs（e2e:ui）、generate-evidence-pack.mjs |
| **scripts/demo/** | start-local-chain.mjs（demo:chain）、start-frontend.mjs（原 demo:frontend；package.json 中后项覆盖为 `cd frontend && npm run dev`） |
| **scripts/config/** | loadProfile.ts、reserves.31337.json |
| **scripts/security-gate/** | verify.ts、config.ts、b4-evidence.ts、check-b4-evidence.ts |
| **deployments/** | 31337.json（部署产物）；evidence-pack/（门禁后生成） |

### 2.2 前端

| 路径 | 说明 |
|------|------|
| **frontend/** | Vite + React + TypeScript + ethers v6 |
| **frontend/src/** | App.tsx（路由）、pages/（DashboardPage、GovernancePage）、components/（layout、actions、dashboard、admin、tx、ui）、hooks/、state/、contracts/、config/、utils/、types/ |
| **前端入口** | `npm run dev`（frontend 目录）；根目录 `demo:frontend` 实际为 `cd frontend && npm run dev`（package.json 最后一处定义） |
| **前端端口** | Vite 默认 5173（未在 vite.config.ts 覆盖） |

### 2.3 文档

| 路径 | 说明 |
|------|------|
| **project-upgrade/** | 00–15 升级文档、README、前端重构方案-架构级落地版、archive/misc/、archive/ |
| **docs/** | 03-08-deployment-runbook.md（含 §8 门禁 §9 发布 §10 发布与运维）、RELEASE-*、AUDIT-*、PROTOCOL-DESIGN 等 |

## 3. 关键命令（来自 package.json）

| 命令 | 含义 |
|------|------|
| `npm run compile` | hardhat compile |
| `npm test` | hardhat test（含 unit + integration） |
| `npm run smoke:e2e` | node scripts/smoke-e2e.mjs |
| `npm run e2e:ui` | node scripts/ci/run-e2e-ui.mjs（Playwright） |
| `npm run p10:gate` | node scripts/ci/p10-local-only-gate.mjs |
| `npm run deploy:localhost` | hardhat run scripts/deploy/deploy.ts --network localhost |
| `npm run deploy:p9` | hardhat run scripts/deploy/deploy-p9.ts --network localhost |
| `npm run demo:chain` | node scripts/demo/start-local-chain.mjs |
| `npm run demo:frontend` | cd frontend && npm run dev（**以 package.json 中后出现的为准**） |

**基线建立时间**：审计执行时  
**引用**：Step 1–6 以本基线为入口与版本依据。

---

# Part B：目录与模块化审计（Architecture Audit）

**目标**：A) 目录结构是否与当前实现一致（最新）；B) 模块划分是否最优/合理。  
**证据**：目录树快照、模块职责表、配置与依赖入口核查。

## 1. 目录树快照（2–3 层，忽略 node_modules/dist/cache）

```
Smart contract projects/
├── contracts/
│   ├── core/           # LendingPoolImpl, ReserveLogic, RiskEngine, Liquidation, PoolConfigurator, Treasury, FlashLoan, LinearRateStrategy, UserConfiguration
│   ├── oracle/         # OracleRouter, ChainlinkAdapter, PriceBoundGuard, DexTwapAdapter, SequencerUptimeGuard
│   ├── tokens/         # AToken, VariableDebtToken, TestToken
│   ├── governance/     # GovernorP9, GovernanceToken, EmergencyModule
│   ├── libs/           # WadRayMath, SafeTransfer, Errors, Events
│   ├── mocks/          # MockAggregator, MockFlashLoanReceiver*
│   ├── interfaces/     # IOracleRouter, IInterestRateStrategy, IFlashLoanReceiver
│   ├── test/           # TestReserveLogic, TestRiskEngine
│   ├── SimpleLending.sol
│   └── ImportProxy.sol
├── scripts/
│   ├── deploy/         # deploy.ts, deploy-p9.ts
│   ├── governance/     # transfer-admin, first-proposal-setltv, verify-p9-complete, verify-guardian, second-proposal-setlt, proxy-upgrade-drill
│   ├── ci/             # run-p10-full.mjs, p10-local-only-gate.mjs, run-e2e-ui.mjs, generate-evidence-pack.mjs, smoke-deployed-localhost.ts, local-release-loop.mjs
│   ├── demo/           # start-local-chain.mjs, start-frontend.mjs
│   ├── config/         # loadProfile.ts, reserves.31337.json
│   ├── security-gate/  # verify.ts, config.ts, b4-evidence.ts, check-b4-evidence.ts
│   ├── release/        # generate-manifest.ts, sign-b4-evidence.ts
│   ├── _lib/           # export.ts, fs.ts
│   └── smoke-e2e.mjs
├── test/
│   ├── unit/           # RiskEngine.unit, ReserveLogic.unit, LinearRateStrategy.unit
│   ├── integration/    # SimpleLending.integration
│   ├── invariants/     # invariants.ts
│   └── fuzz/           # fuzz.ts
├── frontend/
│   └── src/
│       ├── pages/      # DashboardPage, GovernancePage
│       ├── components/ # layout, actions, dashboard, admin, tx, ui
│       ├── hooks/      # useActions, useDashboard, useWallet, useAllowance, usePreflight, useTxDisplay, useTheme, useTokenMetadata
│       ├── state/      # tx.ts, txStore.ts, errors.ts
│       ├── contracts/  # deployments.ts, contracts.ts, write.ts, abis.ts
│       ├── config/     # runtime.ts, network.ts, ui.ts
│       ├── utils/      # amount.ts, format.ts, assert.ts
│       └── types/      # ethereum.ts, dashboard.ts
├── deployments/        # 31337.json
├── evidence-pack/      # manifest.json, deployments-31337.json, evidence-summary.json, p10-gate-output.txt
├── docs/
├── project-upgrade/    # 00–15, README, 前端重构方案-架构级落地版, archive/misc/, archive/
├── e2e/                # playwright.config.ts, fixtures.ts, lending-flow.spec.ts, pause-governance.spec.ts
└── hardhat.config.ts, package.json
```

## 2. 模块职责表

| 层级 | 路径 | 职责 | 判定 |
|------|------|------|------|
| **contracts** | core/ | 池子、储备、利率、风控、清算、配置、国库、闪电贷、用户位图 | ✅ 单一职责清晰 |
| | oracle/ | 路由、Chainlink、PriceBound、DexTwap、Sequencer | ✅ |
| | governance/ | Governor、治理币、紧急模块 | ✅ |
| | tokens/ | aToken、variableDebtToken、TestToken | ✅ |
| | libs/ | 数学、安全转账、错误与事件 | ✅ |
| **scripts** | deploy/ | 部署与 P9 部署；**唯一通过 loadProfile(chainId)** | ✅ 配置收口 |
| | governance/ | 治理步骤（transfer-admin → proxy-upgrade-drill） | ✅ 可复现 |
| | ci/ | p10:ci、p10:gate、e2e:ui、evidence-pack、smoke | ✅ |
| | demo/ | 一键起链、一键起前端 | ✅ |
| | config/ | loadProfile.ts、reserves.31337.json | ✅ 唯一配置入口 |
| | security-gate/ | 门禁校验、B4 证据 | ✅ |
| **test** | unit/ | 单元测试 | ✅ |
| | integration/ | 集成测试（SimpleLending） | ✅ |
| | invariants/ , fuzz/ | 不变量与模糊测试 | ✅ |
| **frontend** | pages/ | Dashboard、Governance | ✅ |
| | components/ | layout、actions、dashboard、admin、tx、ui | ✅ |
| | hooks/ | 写操作、仪表盘、钱包、额度、预检、交易展示、主题 | ✅ |
| | state/ | tx 状态机、txStore、errors | ✅ |
| | contracts/ | 部署读取、合约封装、写调用 | ✅ 适配层清晰 |

## 3. “最新”一致性判定

- **目录与实现**：contracts/、scripts/、test/、frontend/src/、e2e/ 与当前仓库一致；deploy 路径为 `scripts/deploy/deploy.ts`，test 集成为 `test/integration/SimpleLending.integration.ts`。  
- **结论**：**与当前实现一致（最新）**。证据：见 Part A 与上述树。

## 4. “最优”判定与理由

| 标准 | 结论 | 证据 |
|------|------|------|
| **单一职责** | ✅ | contracts 按 core/oracle/governance/tokens 分；scripts 按 deploy/governance/ci/demo/config 分；frontend 按 pages/components/hooks/state 分 |
| **依赖方向** | ✅ | 前端：domain（contracts/write）→ state（tx/txStore）→ UI（components/pages）；脚本：config（loadProfile）→ deploy/governance |
| **配置收口** | ✅ | deploy 与 security-gate 仅通过 `loadProfile(chainId)` 取配置；无散落 env 分支（见 grep loadProfile/getMode） |
| **治理/部署/验证可复现** | ✅ | p10:ci 顺序固定；p10:gate 从零起链→p10:ci→evidence-pack；governance 脚本可逐条执行 |

**结论**：**模块划分符合最佳实践（最优/合理）**；未发现职责耦合、重复或配置分散。  

**最小变更建议**：无需大搬家。可选：在 `scripts/README.md` 或 `docs/03-08-deployment-runbook.md` 中增加「脚本入口索引」；根目录已有 README 与 docs 链接，可补充 docs/00-INDEX.md 作为单一文档入口。

## 5. 产出

- **A)** 目录结构：与当前实现一致（最新）。  
- **B)** 模块划分：最优/合理；配置收口、依赖清晰、门禁可复现。  
- **无需结构性改动**；可选为「加 INDEX / 加脚本入口说明」。

---

# Part C：全量测试与门禁复跑结果（留证）

**执行顺序**：compile → 合约测试（unit+integration）→ smoke:e2e → e2e:ui → p10:gate  
**留证**：每步命令、退出码、关键输出；evidence-pack 引用。

## 1. 编译

| 项 | 值 |
|----|-----|
| **命令** | `npx hardhat compile` |
| **退出码** | 0 |
| **关键输出** | `Nothing to compile`（已编译） |
| **判定** | ✅ 通过 |

## 2. 合约单元 + 集成测试

| 项 | 值 |
|----|-----|
| **命令** | `npm test`（即 `hardhat test`） |
| **退出码** | 0 |
| **关键输出** | `75 passing (5s)`；含 Fuzz、SimpleLending 集成、Invariants、LinearRateStrategy、ReserveLogic、RiskEngine、P2–P7、Gate B5–B8 等 |
| **判定** | ✅ 通过 |

**说明**：仓库未单独定义 `test:integration`；集成测试与单元测试统一由 `npm test` 执行，入口为 `test/` 下 unit/、integration/、invariants/、fuzz/。

## 3. 烟雾测试 / E2E（链上脚本）

| 项 | 值 |
|----|-----|
| **命令** | `npm run smoke:e2e` |
| **退出码** | **0** |
| **关键输出** | 起链 → 部署并导出 → approve→supply→borrow→repay→withdraw flow succeeded → 停止节点 |
| **判定** | ✅ 本轮通过 |

## 4. 前端端到端（Playwright）

| 项 | 值 |
|----|-----|
| **命令** | `npm run e2e:ui` |
| **说明** | 依赖本地链 8545 已起；门禁中可通过 `SKIP_E2E_UI=1` 跳过本步仍生成 evidence-pack。 |
| **判定** | 门禁 SKIP_E2E_UI=1 时跳过；全量门禁（不设 SKIP）见 §5.2。 |

## 5. 最终门禁（Local-Only）

### 5.1 零信任复核（SKIP_E2E_UI=1）

| 项 | 值 |
|----|-----|
| **命令** | `$env:SKIP_E2E_UI="1"; npm run p10:gate`（端口 8545/5173 空闲） |
| **退出码** | **0** |
| **关键输出** | `P10 Local-Only Gate: done. evidence-pack/ generated.` → **EVIDENCE-PACK-MANIFEST-SHA256** 与四锚点 |
| **判定** | ✅ 零信任复核通过；**v1.0 Local-Only Release = GO**。 |

### 5.2 全量门禁（不设 SKIP_E2E_UI）

| 项 | 值 |
|----|-----|
| **命令** | `npm run p10:gate`（未设置 SKIP_E2E_UI） |
| **退出码** | **0** |
| **判定** | ✅ **Full GO（Gate-Complete + Release-Signable）**；evidence-pack 已生成；四锚点与 manifest SHA256 已校验。 |

**说明**：本机终端已取得 **exit 0 + EVIDENCE-PACK-MANIFEST-SHA256 + 四锚点** 作为唯一发布证据，v1.0 正式宣布 **Full GO**。

## 6. evidence-pack 引用

| 项 | 值 |
|----|-----|
| **路径** | `evidence-pack/manifest.json` |
| **files** | deployments-31337.json、evidence-summary.json、p10-gate-output.txt（各含 sha256） |
| **evidence-summary 四锚点** | commitSha、node、npm、os；与门禁 stdout 单一来源只读、双向锚定。 |

**校验**：门禁成功时 stdout 输出 EVIDENCE-PACK-MANIFEST-SHA256 及四锚点；四锚点与 `evidence-pack/evidence-summary.json` 一致。

## 7. 总结

| 步骤 | 命令 | 退出码 | 判定 |
|------|------|--------|------|
| 1. 编译 | `npx hardhat compile` | 0 | ✅ |
| 2. 合约测试 | `npm test` | 0 | ✅ 75 passing |
| 3. 烟雾/脚本 E2E | `npm run smoke:e2e` | **0** | ✅ |
| 4. UI E2E | `npm run e2e:ui` | — | 门禁 SKIP_E2E_UI=1 时跳过 |
| 5. 门禁（SKIP_E2E_UI=1） | `npm run p10:gate` | **0** | ✅ |
| 5′. 全量门禁 | `npm run p10:gate`（不设 SKIP） | **0** | v1.0 = **Full GO** |

**结论**：编译、合约测试、smoke:e2e、p10:gate 均已通过；全量门禁已取得 **exit 0 + EVIDENCE-PACK-MANIFEST-SHA256 + 四锚点**，v1.0 为 **Full GO（Gate-Complete + Release-Signable）**。

---

# Part D：前端审计（结构、可维护性、错误处理、安全 UX、性能）

**审计范围**：`frontend/src` 目录及入口；以代码为准，逐条结论 + 最小修复清单。

## 1. 目录结构

**现状**：pages/（DashboardPage、GovernancePage）；components/（layout、dashboard、actions、admin、ui、tx、ErrorBoundary）；hooks/（useWallet、useDashboard、useActions、useAllowance、usePreflight、useTxDisplay、useTheme、useTokenMetadata）；state/（tx、txStore、errors）；contracts/（deployments、contracts、abis、write）；config/（runtime、network、ui）；utils/、types/。

**结论**：结构清晰，职责划分合理。pages 为路由页，components 按功能分组，hooks 承载读写与状态，state 为纯逻辑，config 为唯一配置入口，依赖方向为 domain → hooks → components → pages，符合“最优”标准。**通过**。

## 2. 交易状态机

**实现位置**：`state/tx.ts`（`TxStage`、`runTxDetailed`）、`hooks/useActions.ts`（Approve → Supply/Withdraw/Borrow/Repay）。

**状态流转**：idle → signing → pending → confirmed | failed | stuck；替换/取消与超时处理明确；持久化 txStore 在 pending 时写入，刷新后可恢复 pending。**通过**。

## 3. 错误处理

**实现位置**：`state/errors.ts`（normalizeError、rewriteMessage、classifyErrorKind）、`config/ui.ts`（用户可见文案）。

| 场景 | 处理方式 | 结论 |
|------|----------|------|
| 用户拒签 (4001) | isUserRejected → errorUserRejectedRequest | ✅ |
| 链错误/网络不匹配 | rewriteMessage → errorWrongNetworkExpectedGotTemplate；kind NetworkMismatch | ✅ |
| 合约 revert | 匹配 exceeds borrowing limit、withdrawal unhealthy 等 → 友好文案；kind Revert | ✅ |
| 余额/授权不足 | insufficient balance/allowance → 对应文案与 kind | ✅ |
| RPC/断网 | missing revert data、failed to fetch 等 → errorDashboardContractReadFailed / errorRpcNetworkCheckNode；kind Rpc | ✅ |

**结论**：RPC 错误、用户拒签、余额不足、断网、链不匹配均有归一化与用户可读文案。**通过**。

## 4. 安全 UX

| 检查项 | 实现 | 结论 |
|--------|------|------|
| 高风险操作提示 | Supply/Borrow/Withdraw/Repay 前 PreflightModal（健康因子、限额等） | ✅ |
| 地址/金额可读 | AddressDisplay 短地址+复制；formatToken/clampDecimalsForDisplay | ✅ |
| 防重复提交 | useActions 中 withLock 按 key 加锁，同 key 并发抛 errorTxAlreadyInProgress | ✅ |
| 切链/未连网 | isSupportedChain、Header/DataStatusBar 提示；getDeployments(chainId) 未支持链无合约数据 | ✅ |

**结论**：通过。

## 5. 性能

| 项 | 实现 | 结论 |
|----|------|------|
| 首屏 | 主要 bundle 含 Dashboard/Governance，体量可接受 | ✅ |
| 刷新策略 | REFRESH_THROTTLE_MS（250ms）、BLOCK_DEBOUNCE_MS（3000ms） | ✅ |
| 交易后状态 | runTxDetailed 确认后 verifyPostState 短时轮询，onConfirmed 触发 dashboard 刷新 | ✅ |

**结论**：通过。

## 6. 最小修复清单（按优先级）

| 优先级 | 项 | 建议 |
|--------|-----|------|
| **P1（major）** | demo:frontend 与 RPC 环境变量 | 已在 DEMO-RUNBOOK-LOCAL 说明：用 `node scripts/demo/start-frontend.mjs` 或手动设置 VITE_LOCAL_RPC_URL。可选：移除重复 key，保留单一 demo:frontend 指向 start-frontend.mjs。 |
| **minor** | 前端结构入口说明 | 在 frontend/README.md 或 FRONTEND_STYLE_GUIDE 增加 1 段「目录职责」。 |

**无 P0/blocking 项**。前端可维护性、错误处理、安全 UX 与性能均满足本地企业级演示要求。

## 7. 总结

- **目录**：与实现一致，模块边界清晰，依赖方向合理。
- **交易状态机**：Approve→Confirm→Pending→Success/Fail/Stuck 一致，含替换/超时与持久化恢复。
- **错误处理**：用户拒签、链错误、revert、余额/授权、RPC/断网均有归一化与文案。
- **安全 UX**：preflight、可读地址/金额、防重复提交、切链与网络提示。
- **性能**：节流/防抖与交易后轮询+刷新已落实。

**判定**：前端达到本地可交付审计标准；仅 P1 配置/文档类改进，无阻断项。

---

---

# Part E：前端 E2E 业务闭环（原 FRONTEND-E2E-BUSINESS-CLOSURE 已合并）

**用途**：全链路审计结论与阻断级别、真实用户 A–F 17 项验收表。

## E.1 全链路审计结论摘要

- **路由与页面**：`/` `/markets` `/governance` 可达；`/markets/:assetId` 可达（单资产 USD8）；`/activity` `/settings` 占位；`/admin/*` 存在未在主导航暴露。
- **状态与数据**：Dashboard 余额/池子/仓位 ✅；切链后脏数据 ⚠️ P1（无 contracts 时 setData(undefined)）；合约 revert 文案 ⚠️ P2。
- **钱包与核心操作**：连接/断开/余额/链展示 ✅；Supply/Withdraw/Borrow/Repay、Preflight、Approve、Tx 状态 ✅。
- **Markets / Governance**：Markets 列表 ✅；Supply/Borrow CTA 跳首页 ⚠️ P3；图表模拟 ⚠️ P2。Governance 提案列表 ✅；无投票 UI ❌ P1；无创建/执行/队列/取消 UI ❌ P2。
- **阻断级别**：P1 — Dashboard 切链脏数据、Governance 无投票 UI；P2 — Activity/Settings 占位、LTV/LT 硬编码、图表模拟、Governance 无创建/执行/队列/取消、合约错误文案；P3 — Markets CTA 无预填、AssetDetail assetId 未参与数据、Admin 未暴露。
- **结论**：主三页、钱包与四操作、Preflight/Approve/Tx、Markets 只读、Governance 只读列表、Pause/Unpause 已闭环；未闭环见上表。

## E.2 真实用户验收表（A–F 17 项）

环境：终端 1 `npm run node`，终端 2 `npm run deploy:localhost`，终端 3 `cd frontend && npm run dev`；MetaMask 31337。

| 组 | 项 | 预期 |
|---|-----|------|
| A | A1–A3 路由 `/` `/markets` `/governance`、`/markets/:assetId`、`/activity` `/settings` | 可达，单资产说明/占位说明 |
| B | B4–B6 Dashboard 数据、切链/无合约、revert 错误 | 数据可见；切链不展示旧数据；友好提示 |
| C | C7–C9 钱包连接/四操作/Preflight/Approve/Tx | 完整流程 pending→confirmed，刷新 |
| D | D10–D12 Markets 列表、CTA 预填、图表标注 | APY/总量/利用率；Simulated data |
| E | E13–E15 提案列表、投票、创建/执行/队列/取消 | 表展示；Vote 可操作 |
| F | F16–F17 LTV/LT 展示、Pause/Unpause | 链上或 default；pauser 可操作 |

全部 Pass 可视为产品级闭环验收通过。E2E 门禁：`npm run e2e:ui` 为门禁，不替代本表 Fail 项修复。

---

# Part F：企业技术检查清单（原 ENTERPRISE-TECH-CHECKLIST 已合并）

**用途**：接口对齐、深度多维度、RPC 与钱包深度审计的单一入口；RPC/前后端接口/智能合约地址与 ABI 的**唯一起点**为 [09-本地链标准与地址.md](09-本地链标准与地址.md)（含 Part 3 接口约定），本 Part F 为深度检查清单。

## F.1 Part A：功能模块接口对齐（10 次迭代）

Deployments 类型与字段（root/frontend/scripts）✅；ABI 命名与导入路径 ✅；ChainId/网络配置（31337、getRpcUrl、SUPPORTED_CHAIN_IDS）✅；Wallet/Provider 与 getDeployments(chainId) ✅；迭代 5–10：Dashboard/Pool Hooks、Actions/Tx、Preflight、Governance 地址与 ABI、Config/Runtime、脚本侧合约名与 export 键 ✅。**规范**：新增部署地址时 DeploymentsJson 与 Deployments 两处同步；ABI 由 export 从 artifact 写出；链/网络常量与 [09-本地链标准与地址.md](09-本地链标准与地址.md) 一致。

## F.2 Part B：深度多维度检查

合约↔前端方法名与返回形状 ✅；ChainId 与 RPC 唯一字面量与来源 ✅；配置依赖链与循环依赖 ✅；本地存储键与状态形状 ✅；错误归一化与 UI 文案 ✅；E2E 与运行环境假设 ✅；设计令牌与 UI 常量 ✅；SendPath/诊断/安全/脚本与前端共享/边界与退化行为 ✅。

## F.3 Part C：RPC 与钱包深度审计

硬编码收敛到 network.ts、configs/localChain.mjs、hardhat.config.ts ✅；RPC 畅通与 getHealthyRpcUrl ✅；UI 跳转钱包（连接、切链、发交易）✅。自检：按 [09-本地链标准与地址.md](09-本地链标准与地址.md) Part 1、Part 2 §5、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) 排查。

---

**文档版本**：1.0  
**合并来源**：AUDIT-BASELINE、AUDIT-ARCHITECTURE、AUDIT-TEST-RESULTS、AUDIT-FRONTEND、FRONTEND-E2E-BUSINESS-CLOSURE、ENTERPRISE-TECH-CHECKLIST（已下线，勿再引用）
