# debug/ — 调试清单与证据化记录

**用途**：提供**调试清单（Debug Checklist）+ 证据化记录（Evidence Log）**，与 p10:gate / evidence-pack 思路一致，便于**可复现、可交接、可回归**。

---

## 阅读与使用顺序

| 顺序 | 文档 | 何时使用 |
|------|------|----------|
| 1 | [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) | **必读**：调试前先过 A；定位与回归按 B→E 分层 |
| 2 | [INCIDENT_TEMPLATE.md](INCIDENT_TEMPLATE.md) | **每次遇到 bug**：复制为独立文件，填空留证 |
| 3 | [CHECKLIST_E2E.md](CHECKLIST_E2E.md) | **E2E/门禁回归**：打勾验收、证据包核对 |

---

## 本目录文件列表（按用途排序）

| 序号 | 文件 | 用途 |
|------|------|------|
| 1 | [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) | **调试清单主手册**：A 基础一致性 → B 合约层 → C 交易流程层 → D 前端状态层 → E E2E&回归 |
| 2 | [INCIDENT_TEMPLATE.md](INCIDENT_TEMPLATE.md) | **问题记录模板**：现象、环境、复现、证据、根因、修复、回归（每 bug 一份） |
| 3 | [CHECKLIST_E2E.md](CHECKLIST_E2E.md) | **E2E 专项清单**：门禁命令、关键用例打勾、evidence-pack 验收 |
| — | [ENTERPRISE-FRONTEND-BACKEND-CHECK.md](ENTERPRISE-FRONTEND-BACKEND-CHECK.md) | **企业级前后端一致性检查**：前后端一致、ABI 畅通、端口对齐、业务逻辑畅通（联调前可复验） |
| — | [ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN.md](ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN.md) | **企业级审计与排错执行报告**：单次运行 GATE 五项、verify/sentinel/单测结果、Supply 不跳转钱包根因与加固、Evidence 最小集 |
| — | [MULTIDIMENSION-CHECK-AND-LOCAL-FRONTEND-CHECKLIST.md](MULTIDIMENSION-CHECK-AND-LOCAL-FRONTEND-CHECKLIST.md) | **多维度深度检查与本地前端验证清单**：多维度检查维度、本地启动前置、逐页/逐流程打勾清单、潜在问题与业务闭环自检 |
| — | [ORACLE-LTV-UNITS-AND-REGRESSION.md](ORACLE-LTV-UNITS-AND-REGRESSION.md) | **Oracle/LTV 单位与回归**：GATE 后业务计算层、Oracle 8 decimals 与前端 LTV/清算价一致、/diagnostics 与 Evidence Pack 验证 |

---

## 与 docs 其他文档关系

| 文档 | 关系 |
|------|------|
| [09-本地链标准与地址.md](../09-本地链标准与地址.md) Part 4 | 调试**前**准备（环境/链/部署/前端/钱包）与问题发生时的**调试工作**顺序；本目录主手册与之互补 |
| [10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 已知限制、CreateFileMapping、本地 Gas 与卡住；定位时必查 |
| [08-DEMO-RUNBOOK-LOCAL.md](../08-DEMO-RUNBOOK-LOCAL.md) | 起链、部署、前端、手测步骤 |
| [03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8 | 门禁 `p10:gate`、evidence-pack 生成与验收 |
| [11-FULL-LINK-TEST-CHECKLIST.md](../11-FULL-LINK-TEST-CHECKLIST.md) | 全链路手测与 E2E 层级、门禁执行流；E2E 细节见 §0、§0.1 |
