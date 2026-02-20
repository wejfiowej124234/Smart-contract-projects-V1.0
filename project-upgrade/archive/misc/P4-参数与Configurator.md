# P4 参数与 PoolConfigurator

> P4 交付：PoolConfigurator 已部署；initReserves、setLTV、setLiquidationThreshold、setInterestRateStrategy；仅 Admin 可调。参数含义与可调范围、谁可调见下表。资产清单见《02-资产清单-抵押与借贷》与 scripts/config。

## 参数含义与可调范围

| 参数 | 含义 | 可调范围 | 谁可调 |
|------|------|----------|--------|
| **LTV** | 贷款价值比：最多借抵押价值的比例 | 0–100（如 75 = 75%） | PoolConfigurator.Admin |
| **LiquidationThreshold (LT)** | 清算阈值：低于此 HF 可被清算 | 0–100（如 80 = 80%） | PoolConfigurator.Admin |
| **InterestRateStrategy** | 利率策略合约地址 | 非零地址 | PoolConfigurator.Admin |

- **谁可调**：仅 PoolConfigurator 的 **Admin** 可调用 setLTV、setLiquidationThreshold、setInterestRateStrategy、initReserves。P9 前 Admin 为部署多签/指定 EOA；P9 后可为 Timelock。
- **流程**：Admin 调用 PoolConfigurator.setLTV(asset, ltv) 等 → Configurator 调用 Pool.setReserveLTV(asset, ltv)（Pool 仅接受来自 configurator 地址的调用）。

## 资产清单与 config

- **链上**：Pool.reserveList() 与 Pool 的 ltvRatio、liquidationThreshold、interestRateStrategy 为当前单资产（USD8）配置。
- **链下**：scripts/config/reserves.31337.json 与《02-资产清单-抵押与借贷》§2 对齐；部署/治理变更时同步更新。
