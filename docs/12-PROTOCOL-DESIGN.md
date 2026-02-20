# 协议设计（00–09 合并）

**约定**：本文档由原 docs/00-overview、01-architecture、02-economic-model、03-risk-parameters、04-oracle-design、05-liquidation-design、06-security、07-upgrade-governance、09-audit-evidence-pack 合并而成，为协议设计单一入口。与 project-upgrade 对应关系：阶段与打勾见 project-upgrade/11；设计 02/03/07/09 等见 project-upgrade 内对应编号。

---

## 00 协议总览

与 project-upgrade《06-升级后目录结构》对应。P0–P8 单资产借贷协议总览。

**资产与角色**：单资产（池子代币=抵押品=借出资产）；配置见《02-资产清单》与 scripts/config/reserves.\<chainId\>.json。角色：Owner、PAUSER、PoolConfigurator Admin；P9 后可为 Timelock/Guardian。

**风险模型要点**：LTV/清算阈值由 PoolConfigurator 设置；HF < 100 可清算。利率：LinearRateStrategy；reserveFactor 切协议收入至 Treasury。清算：closeFactor、liquidationBonus；见 §05。

**关键流程**：supply → aToken mint；borrow → variableDebtToken mint；repay；withdraw（需满足 LTV）；HF < 100 时 liquidationCall。

---

## 01 模块化架构

与 project-upgrade《05-升级后架构与模块化》《06-升级后目录结构》对应。

**核心**：Pool（LendingPoolImpl 经代理）、PoolConfigurator、ReserveLogic、RiskEngine、Liquidation、Treasury、FlashLoan。**预言机**：OracleRouter、ChainlinkAdapter、PriceBoundGuard；见 §04。**代币**：aToken、variableDebtToken。**升级与权限**：TransparentProxy + ProxyAdmin；见 §07、**docs/03-08-deployment-runbook.md**、project-upgrade《12-升级流程》。

---

## 02 经济模型

与 project-upgrade《03-五大核心模块》经济部分对应。利率：LinearRateStrategy；liquidityIndex、borrowIndex 按 ray 累积。reserveFactor 协议收入 mint 至 Treasury。费用：FlashLoan 费率、清算 bonus/closeFactor 见 §05。当前无激励合约。

---

## 03 风险参数

与 project-upgrade《02-资产清单》、15 §2.C 对应。LTV、liquidationThreshold、liquidationBonus、closeFactor、reserveFactor 由 PoolConfigurator 设置；链上为唯一来源。链下：reserves.\<chainId\>.json 与《02-资产清单》对齐。建议 LTV ≤ LT。

---

## 04 Oracle 设计（P6）

与《09-安全设计-清单》§2.1、《15-Mock与测试环境清单》对齐。主源：Chainlink/MockAggregator；OracleRouter → ChainlinkAdapter；heartbeat、minAnswer/maxAnswer 校验。PriceBoundGuard：偏离阈值、熔断。L2：SequencerUptimeGuard 占位，L2 主网前须补齐。Pool 集成：oracleRouter 设置后 getUserPosition 用 getPrice 计算 collateralValue/debtValue。

---

## 05 清算设计（P7）

与《09-安全设计-清单》§2.4、《15-Mock与测试环境清单》§2.C/§3 对齐。HF < 100 可清算。closeFactor、liquidationBonus 由 PoolConfigurator 设置。Liquidation.liquidationCall → pool.executeLiquidation；repayAmount ≤ closeFactor×debt。坏账由协议承担；Treasury 可覆盖。MEV：当前公开调用。

---

## 06 安全设计

与 project-upgrade《09-安全设计-清单》§2 对齐。**预言机**：心跳/minAnswer/maxAnswer、PriceBoundGuard、SequencerUptimeGuard（L2 占位）。**重入**：nonReentrant、SafeERC20。**权限**：PoolConfigurator 仅 Admin；ProxyAdmin 主网改多签/Timelock；PAUSER、EmergencyModule。**清算与 MEV**：公开清算；可选私有 mempool/拍卖。

---

## 07 升级与治理

与 project-upgrade《12-升级流程》《08-DAO治理-设计清单》对应。代理：TransparentProxy + ProxyAdmin；新实现只追加存储、_disableInitializers()。权限：Owner、PAUSER、PoolConfigurator Admin；P9 后 Configurator 改 Timelock。Timelock、Guardian、EmergencyModule 见《08-DAO治理-设计清单》。

---

## 09 审计证据包

与 project-upgrade《09-安全设计-清单》§3 对应。攻击面见 §06；威胁模型 docs/archive/audits/threat-model/。测试：unit（ReserveLogic、RateStrategy、RiskEngine）、integration（SimpleLending）、invariants、fuzz。内部清单 docs/archive/audits/internal-audit-checklist.md；外部报告 docs/archive/audits/external-audit-reports/；形式化 formal-verification/ 占位。

---

**合并来源**：00-overview、01-architecture、02-economic-model、03-risk-parameters、04-oracle-design、05-liquidation-design、06-security、07-upgrade-governance、09-audit-evidence-pack（已下线，勿再引用）。
