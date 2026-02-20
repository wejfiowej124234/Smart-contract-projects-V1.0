# E2E 专项清单（Checklist E2E）

**用途**：与 [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) §E 对应，用于 E2E 与门禁的快速打勾与回归。本目录入口与阅读顺序见 [README.md](README.md)；完整说明见 [11-FULL-LINK-TEST-CHECKLIST.md](../11-FULL-LINK-TEST-CHECKLIST.md) §0、§0.1 与 [03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8。

---


## 门禁与层级

| 命令 | 说明 | 验收 |
|------|------|------|
| `npm run p10:gate` | 本地唯一验收门禁（起链→部署→治理→e2e:core→evidence-pack） | exit 0；控制台输出 EVIDENCE-PACK-MANIFEST-SHA256 |
| `npm run e2e:smoke` | 烟雾测试（起链+部署+流式验证） | 约 10s 内通过 |
| `npm run e2e:core` | 核心流 E2E（smoke + core-flow） | p10:gate 默认执行此层 |
| `npm run e2e:ui` | 全量 Playwright UI E2E | 链需已起；可选 `E2E_TIER=nightly` 或 `p10:gate -- --full` |

---

## E2E 打勾（关键用例）

| 项 | 说明 | Pass |
|----|------|------|
| 连接钱包 | Connect → 选账户 → 显示 Connected、chainId 31337 |  |
| 切链 | 错误网络时提示；Switch network → 31337 |  |
| Supply | 完整流程：Approve → Supply → 余额/仓位更新 |  |
| Borrow | 有抵押后 Borrow → 债务与 HF 更新 |  |
| Repay | Repay → 债务减少、余额更新 |  |
| Withdraw | Withdraw → 抵押减少、余额更新 |  |
| 事件/UI 更新 | tx confirmed 后 Dashboard/KPI/Position 刷新 |  |

---

## 证据包（evidence-pack）

- **路径**：`evidence-pack/`（manifest.json、evidence-summary.json、deployments-31337.json、p10-gate-output.txt）
- **锚点**：控制台 `EVIDENCE-PACK-MANIFEST-SHA256`
- **复现**：8545 空闲下 `npm run p10:gate` 一次即可生成
