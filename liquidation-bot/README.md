# Liquidation Bot（清算机器人）

> 06 升级后目录：清算机器人独立模块。与 project-upgrade《07-升级后智能合约清单》《06-升级后目录结构》对齐。

## 运行

从项目根目录执行：

```bash
npx hardhat run liquidation-bot/run.ts
```

或使用脚本别名（若已在 package.json 配置）：

```bash
npm run run:liquidation-bot
```

本地网络需先部署池子与清算合约，或使用默认 in-process 网络。

## 目录说明（06 目标结构）

- **run.ts**：当前最小可用入口（部署池 + 构造可清算仓位 + 调用 liquidationCall）。
- **src/**：预留；后续将逻辑拆分为 src/ 内模块。
- **strategies/**：预留；清算策略（如最大 repay、健康因子目标等）。
- **risk-controls/**：预留；风控与限速。

最小可用脚本同时保留在 `scripts/run-liquidation-bot.ts`，便于与现有 CI/文档一致；本目录为 06 约定形态。
