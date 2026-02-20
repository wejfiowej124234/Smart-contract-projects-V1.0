# 15-Mock 与测试环境清单（企业级口径）

> **Mock 不应该是零散几个合约**，而应形成**可审计、可复现、可切环境**的「三张表/三份清单」。开发过程中「哪里加 Mock」以本文为准；实现时落在目标仓库的 `mocks/`、`config/`、`scenarios/` 等目录。

---

## 1) Mock 依赖表（Dependency Mocking Matrix）

**用途**：任何人一看就知道「哪些外部依赖被替换成 Mock」；审计/面试可追溯。

| 依赖域 | 真实依赖（主网/测试网） | 本地替代（Mock） | 为什么必须 Mock | 协议/系统用它做什么 |
|--------|--------------------------|------------------|-----------------|----------------------|
| 价格预言机 | Chainlink Aggregator / Oracle Router | MockAggregator / MockOracle | 本地链无 Chainlink | 计算 HF、清算阈值、抵押率 |
| 稳定币 | USDC/USDT | MockERC20(USDC) | 本地链无 USDC | 借贷资产、还款、利息 |
| 抵押资产 | WETH/WBTC 等 | MockERC20(WETH/WBTC) 或本地 WETH | 本地无真实资产 | 抵押/赎回 |
| DEX 报价/换币 | Uniswap/0x/1inch | MockDex / MockSwapRouter | 本地无流动性池 | 测 swap、滑点、路由 |
| 清算执行者 | Keeper/Bot | MockLiquidator（脚本或合约） | 本地无 keeper 网络 | 触发 liquidate 流程 |
| 利率模型 | 可复用外部模型 | MockRateModel 或固定利率 | 便于可控 | 压测利息累积与边界 |
| 时间/区块 | 链的 block.timestamp | TimeController（仅测试） | 需要快进时间 | 测利息、到期、TWAP |
| 风险模块 | 真实风控/黑名单 | MockRiskEngine | 本地不接外部系统 | 测限制/冻结/额度 |
| 跨链/桥 | LayerZero/CCIP | MockBridgeAdapter | 本地无跨链消息 | 测消息/回执/失败重试（可选） |

**与 P 阶段对应**：P6 预言机层 → 价格类 Mock；P4/P5 多资产 → 代币类 Mock；P7/P8 清算 → 清算执行者 Mock；P2 利率 → 利率模型 Mock。各 P 的 **Mock 要求与打勾前必查** 见《11-升级阶段清单-P0至P10》「P0–P10 与《15-Mock与测试环境清单》对应」表。新增 Mock 时在本表补一行并注明对应 P。

---

## 2) Mock 参数设置表（Mock Config Parameters）

**用途**：每个 Mock 需要哪些参数、默认值、可改范围、谁来改；参数变成**可追踪的配置资产**，哪套环境用哪套参数一眼可查。

### A. 价格类（最关键）

| Mock | 参数 | 示例 | 谁设置 | 备注 |
|------|------|------|--------|------|
| MockAggregator | price | 2000 * 1e8 | 部署脚本 / 测试 | 必须可 `setPrice()` |
| MockAggregator | decimals | 8 | 合约固定 | 对齐 Chainlink 常见精度 |
| OracleRouter(Mock) | asset→feed 映射 | ETH→feed1 | 部署脚本 | 多资产必须表驱动 |
| OracleRouter(Mock) | stalePeriod | 1 hour | 配置/部署 | 测「过期价格」分支 |

### B. 代币类

| Mock | 参数 | 示例 | 谁设置 | 备注 |
|------|------|------|--------|------|
| MockERC20(USDC) | decimals | 6 | 合约固定 | 对齐真实 USDC |
| MockERC20(USDC) | initialMint | 10,000,000e6 | 部署脚本 | 给测试账户发钱 |
| MockERC20(WETH) | decimals | 18 | 合约固定 | 抵押资产 |
| Faucet/Distributor | mintTo 列表 | addr1, addr2 | 脚本 | 便于一键初始化 |

### C. 协议风控/清算参数（协议配置，与 Mock 场景一起管理）

| 配置项 | 示例 | 谁设置 | 用途 |
|--------|------|--------|------|
| collateralFactor / LTV | 75% | 部署脚本 / 管理员 | 借款上限 |
| liquidationThreshold | 80% | 部署脚本 / 管理员 | 触发清算 |
| liquidationBonus | 5% | 部署脚本 / 管理员 | 清算奖励 |
| closeFactor | 50% | 部署脚本 / 管理员 | 部分清算比例 |
| reserveFactor | 10% | 部署脚本 | 储备金抽成 |

**企业级要点**：参数不是「写死在代码里」，而是**按环境（local / testnet / mainnet）的配置表**；部署脚本或 config 读取后写入链上。

---

## 3) Mock 场景表（Scenario Presets：一键切换）

**用途**：为测试清算/利率/坏账/极端行情，预设哪些「场景配置」；一键切换，可复现。面试/审计时讲「我们怎么验证极端风险」即以此表为据。

| 场景名 | 初始价格 | 变动 | 目标测试点 | 需要的 Mock 操作 |
|--------|----------|------|------------|------------------|
| Normal | ETH=2000 | 不变 | 正常存借还 | setPrice(2000) |
| Crash 50% | ETH=2000 | →1000 | 触发清算 | setPrice(1000) + call liquidate |
| Flash Crash | 2000→800→2000 | 快速波动 | 边界/重入/状态一致性 | 多次 setPrice + 多笔 tx |
| Stale Price | feed 更新时间过期 | 不更新 | 过期价格保护 | setLastUpdate(old) |
| Insolvency | 借款人无偿还能力 | — | 坏账/储备金/治理兜底 | mock bad debt + reserve logic |
| High Utilization | 存款少借款多 | — | 利率飙升分支 | 调整池子资产分布 |
| Partial Liquidation | closeFactor=50% | — | 分批清算逻辑 | 设置 closeFactor + 多次 liquidate |

实现时：每个场景对应一份配置或脚本（如 `scenarios/crash50.json` + `scripts/run-scenario.ts`），一键加载并执行。

---

## 4) Mock 与「协议配置」的边界

| 类型 | 含义 | 管理位置 |
|------|------|----------|
| **External Dependency Mocks（外部依赖 Mock）** | Oracle、USDC、DEX、Bridge、Keeper 等链上替身 | `mocks/` 合约 + 本清单 §1 |
| **Protocol Config（协议配置）** | 抵押率、清算阈值、利率模型参数等；非「Mock 合约」但属「可切环境的参数」 | `config/` 按环境（local/testnet/mainnet）+ 本清单 §2.C |

两者都与「可审计、可复现、可切环境」一致；场景表（§3）中会同时用到 Mock 操作与协议参数。

---

## 5) 目标仓库中的目录与文件建议

实现时在**升级后目标仓库**中建议具备（不必完全一致，逻辑要有）：

| 目录/文件 | 用途 |
|-----------|------|
| `contracts/mocks/` 或 `test/mocks/` | Mock 合约：MockAggregator、MockERC20、MockOracle、TimeController 等 |
| `scripts/deploy/` | 部署与初始化脚本；读取 config 后部署并设置参数 |
| `scripts/config/` 或 `config/` | 按环境参数表：`local.json`、`testnet.json`、`mainnet.json`；含 Mock 参数与协议参数 |
| `scripts/scenarios/` 或 `scenarios/` | 一键场景脚本/配置：Normal、Crash50、StalePrice 等，见 §3 |

部署脚本应能：读取「当前环境」对应的 config，初始化 Mock 价格/代币/映射，并写入协议参数（LTV、LT、bonus 等），保证**可复现**。

---

## 6) 与同目录文档的关系

- **01-当前项目现状**：当前链为本地，无主网依赖；Mock 即「本地开发与测试」的依赖替身。
- **02-资产清单-抵押与借贷**：Mock 代币（USD8/WETH/USDC）与「抵押/借贷资产」清单对齐；新增资产时同步更新本清单 §1、§2.B。
- **06-升级后目录结构**：`mocks/`、`config/`、`scenarios/` 在目标仓库中的位置可与 06 对齐或在其下注明。
- **11-升级阶段清单-P0至P10**：每 P 涉及外部依赖时，在本清单 §1 中应有对应行；加 Mock 时先查本清单，再落代码与 config。

**结论**：开发过程中「哪里加 Mock」以本文**三张表**为准；新增 Mock 时更新 §1，新增参数时更新 §2，新增场景时更新 §3，并保证目标仓库中有对应 config/脚本可复现。
