# 文档索引（单一入口）

**企业级标准**：唯一条目、按角色/阶段/命令可导航、无断链、已弃用与归档集中登记（§ 五）、子目录全表可查（13 §一）。

**约定**：根 [README.md](../README.md) → [00-INDEX.md](00-INDEX.md)（本文档）→ 各角色/阶段/运行命令入口。**v1.0 已实现**；本地唯一验收：端口 8545 空闲下 **`npm run p10:gate` exit 0**（输出含 EVIDENCE-PACK-MANIFEST-SHA256 及四锚点）。**文档规范**（数量与引用）：[archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md) §0 规范摘要、§13 一一核对表。

**文档分类总览**（docs 根目录 **22** 个 .md：**00～15** 入口/角色/部署/审计/协议等，**16～21** 治理制度级→终局级→Ultra-Endgame→终极未解；+ 子目录；以本 INDEX 为准）

| 类别 | 入口节 | 说明 |
|------|--------|------|
| 入口与约定 | 根 README、本文档、docs/01-README | 唯一条目；企业级约定 |
| **按主题归类** | **§ 〇** | 本地链、治理、部署、审计、协议、角色、英文、一致性等（快速按主题找文档） |
| 角色导航 | § 一 | 项目负责人、安全/审计、发布/门禁、仓库治理、**治理（创建提案）**、企业技术检查、本地链/演示/排错/测试/全链路/E2E |
| 阶段与命令 | § 二、§ 三 | P0–P10、运行命令（p10:gate、demo、deploy、e2e、test、compile） |
| 审计与清理产出 | § 四 | 审计留证套件、前端 E2E 闭环、演示 Runbook、文档清理、企业技术检查、P0–P6 总结、Go/No-Go、排错、模块化判据、docs 全量复核、设计/证据/其他 |
| 英文作品集 | § 六 | EN-PORTFOLIO（One-Pager+架构摘要+10分钟脚本+产品作品集合并）、AUTHORITATIVE-RELEASE-EVIDENCE |
| 已弃用/已整合 | § 五 | 重定向、已清除、已整合映射；勿再引用旧路径 |

**调试前后端唯一入口**（避免文档过多导致混乱）：本地调试/排错时**仅需**以下 5 个入口，其余按需从 § 〇–四 进入。① [09-本地链标准与地址.md](09-本地链标准与地址.md) — **RPC / 前后端接口 / 智能合约地址与 ABI 唯一起点**（Part 1 标准流程，Part 2 端点与地址，Part 3 接口约定，**Part 4 企业级调试前准备与调试工作清单**）；合约以谁为准、环境变量、常见错误；② [TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) — 排错与已知限制；③ [DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md) — 起链、部署、前端、手测清单；④ **[debug/](debug/)** — **调试清单主手册** [DEBUG_PLAYBOOK.md](debug/DEBUG_PLAYBOOK.md)（A–E 分层）+ **证据化问题记录** [INCIDENT_TEMPLATE.md](debug/INCIDENT_TEMPLATE.md)、[CHECKLIST_E2E.md](debug/CHECKLIST_E2E.md)+ **业务/逻辑/显示/流程验证** [SCREENSHOT-FLOW-VERIFICATION.md](debug/SCREENSHOT-FLOW-VERIFICATION.md)；其余见 [13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §一；⑤ **[15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)** — **治理「创建提案」** 表单填写说明与 setLTV 示例（地址与 09 一致；测试治理币时用）。与 **project-upgrade** 关系：阶段清单与打勾测试见 [project-upgrade/11-升级阶段清单-P0至P10.md](../project-upgrade/11-升级阶段清单-P0至P10.md)；设计 02/03/07/09 等见 project-upgrade 内对应编号；docs 内 00–07/09 为**协议设计**（架构/经济/风险/预言机/清算/安全/治理/证据包），非升级阶段执行文档。

**docs 根目录文件列表（00～15 + 治理 16～21）**

| 序号 | 文件名 | 类别 |
|------|--------|------|
| 00 | [00-INDEX.md](00-INDEX.md)（本文档） | 唯一条目、按主题/角色/阶段/命令导航 |
| 01 | [01-README.md](01-README.md) | 入口与约定 |
| 02 | [02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md) | 角色：项目负责人 |
| 03 | [03-08-deployment-runbook.md](03-08-deployment-runbook.md) | 部署/门禁/发布（§8 §9 §10） |
| 04 | [04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md) | 发布证据 |
| 05 | [05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md) | 审计：终审依据 |
| 06 | [06-AUDIT-SUITE.md](06-AUDIT-SUITE.md) | 审计：留证套件 |
| 07 | [07-REPO-HYGIENE.md](07-REPO-HYGIENE.md) | 仓库治理 |
| 08 | [08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md) | 本地演示 |
| 09 | [09-本地链标准与地址.md](09-本地链标准与地址.md) | 本地链唯一标准 |
| 10 | [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 排错与限制 |
| 11 | [11-FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) | 全链路测试/Go-No-Go |
| 12 | [12-PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md) | 协议设计（00–09 合并） |
| 13 | [13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) | docs 全量复核与清理历史 |
| 14 | [14-EN-PORTFOLIO.md](14-EN-PORTFOLIO.md) | 英文作品集 |
| 15 | [15-governance-create-proposal-example.md](15-governance-create-proposal-example.md) | **治理：创建提案**（表单填写、setLTV 示例；与 09 地址一致） |
| 16 | [16-institutional-dao-governance.md](16-institutional-dao-governance.md) | 治理：制度级 DAO（基线） |
| 17 | [17-governance-tier2-dao-gaps-and-roadmap.md](17-governance-tier2-dao-gaps-and-roadmap.md) | 治理：Tier-2 缺口与路线图 |
| 18 | [18-governance-protocol-level-dao.md](18-governance-protocol-level-dao.md) | 治理：协议级 DAO |
| 19 | [19-governance-endstate-dao.md](19-governance-endstate-dao.md) | 治理：终局级 DAO |
| 20 | [20-governance-ultra-endgame.md](20-governance-ultra-endgame.md) | 治理：Ultra-Endgame 哲学与继承 |
| 21 | [21-governance-ultimate-unresolved.md](21-governance-ultimate-unresolved.md) | 治理：终极未解清单 |
| — | [DOCS-ENTERPRISE-COMPLIANCE.md](DOCS-ENTERPRISE-COMPLIANCE.md) | 企业级/顶级符合性留证（本检查报告） |
| — | **子目录** | |
| — | [runbooks/](runbooks/)（incident-response.md、treasury-and-budget.md） | 事故响应、国库与预算（治理运行级） |
| — | [release/](release/)（B4-EVIDENCE-SCHEMA.md 等） | 证据 schema 与示例 |
| — | [diagrams/](diagrams/)（README.md） | 图表说明 |
| — | [debug/](debug/)（README、DEBUG_PLAYBOOK、INCIDENT_TEMPLATE、CHECKLIST_E2E、SCREENSHOT-FLOW-VERIFICATION、ENTERPRISE-FRONTEND-BACKEND-CHECK、ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN、MULTIDIMENSION-CHECK-AND-LOCAL-FRONTEND-CHECKLIST、ORACLE-LTV-UNITS-AND-REGRESSION，共 9 个 .md） | **调试清单主手册 + 证据化问题记录 + 业务/逻辑/显示/流程验证**；与 09 Part 4、p10:gate/evidence-pack 互补；全表见 [13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §一 |
| — | [archive/](archive/)（过程文档、审计留证，已归档） | 含 16-docs-project-upgrade-一致性检查报告、COMMENT-AUDIT-CHANGELOG、ENTERPRISE-DOCS-ASSESSMENT 等；主入口见 § 五、13 §一 |

**说明**：根目录正式序号 **22** 个 .md（00～15 + 治理 16～21）；**企业级/顶级符合性**见 [DOCS-ENTERPRISE-COMPLIANCE.md](DOCS-ENTERPRISE-COMPLIANCE.md)。单一事实源为 09、13 附录。**按主题归类**见 § 〇；**已弃用/已整合/已归档**见 § 五、[13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §四。子目录 runbooks/（2）、debug/（9）、release/、diagrams/、archive/ 全表见 13 §一。

---

## 〇、按主题归类（docs 根目录）

按**主题**快速找到文档，便于整理与查阅。

| 主题 | 文档 | 说明 |
|------|------|------|
| **入口与索引** | [01-README.md](01-README.md)、[00-INDEX.md](00-INDEX.md)（本文档） | 唯一条目；企业级约定 |
| **本地链与运行** | [09-本地链标准与地址.md](09-本地链标准与地址.md)、[08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 本地链 SSOT、演示 Runbook、排错与限制 |
| **治理** | [15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)、[16-institutional-dao-governance.md](16-institutional-dao-governance.md)～[21-governance-ultimate-unresolved.md](21-governance-ultimate-unresolved.md)、[runbooks/incident-response.md](runbooks/incident-response.md)、[runbooks/treasury-and-budget.md](runbooks/treasury-and-budget.md) | 创建提案（15）；制度级→Tier-2→协议级→终局级→Ultra-Endgame（16–20）；终极未解清单（21）；事故/国库 runbook |
| **部署与发布** | [03-08-deployment-runbook.md](03-08-deployment-runbook.md)、[04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md) | 部署/门禁/发布、v1.0 封板证据 |
| **审计与质量** | [05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md)、[06-AUDIT-SUITE.md](06-AUDIT-SUITE.md)、[07-REPO-HYGIENE.md](07-REPO-HYGIENE.md)、[11-FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md)、[13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) | 终审、留证套件、仓库治理、全链路测试、docs 复核 |
| **协议与设计** | [12-PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md) | 协议设计总览（00–09 合并） |
| **角色与概览** | [02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md) | 项目负责人入口、P0–P6 总结 |
| **英文作品集** | [14-EN-PORTFOLIO.md](14-EN-PORTFOLIO.md) | One-Pager、架构摘要、10 分钟脚本、产品作品集 |
| **一致性与检查** | [archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md) | 一次性报告已归档；单一事实源为 09、13 附录；不规范问题检查已并入 13 §六 |
| **子目录** | [runbooks/](runbooks/)、[debug/](debug/)、[release/](release/)、[diagrams/](diagrams/)、[archive/](archive/) | 事故/国库 runbook、调试主手册、证据 schema、图表、归档 |

---

## 一、按角色导航

| 角色 | 入口文档 | 说明 |
|------|----------|------|
| **项目负责人 / 面试官** | **[PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)** | 技术概览与运行、仓库结构与企业标准、P0–P6 阶段总结与评估（原 Technical_Overview、PROJECT_LEAD_REVIEW、P0-P6-Summary 已合并） |
| **学习与面试材料** | **[learning/项目总览架构.md](../learning/项目总览架构.md)**（若存在） | 一文档读懂全项目；已与 v1.0 P0–P10 对齐；0–29 学习文档已参照总览更新 |
| **安全 / 审计** | **[ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md)**（**v1.0 Local-Only 最新终审依据**；结论 **GO**；**含附录：模块化可审计判据**，原 MODULAR-AUDIT-CRITERIA 已合并）、**[AUDIT-SUITE.md](06-AUDIT-SUITE.md)**（**基线+架构+测试+前端** 留证，Part A–D） | **终审**：Enterprise 零信任审计；**审计留证套件**；结论以 ENTERPRISE-ZERO-TRUST、AUTHORITATIVE-RELEASE-EVIDENCE 为准 |
| **发布 / 门禁** | [03-08-deployment-runbook.md](03-08-deployment-runbook.md) §8、§9（v1.0 发布记录与宣言）、根 [RELEASE_CHECKLIST_P10.md](../RELEASE_CHECKLIST_P10.md)、**[04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md)** | P10 门禁、发布记录、**v1.0 Full GO 封板证据**；v1.0 收口结论见 04-AUTHORITATIVE-RELEASE-EVIDENCE（§五） |
| **仓库治理** | **[REPO-HYGIENE.md](07-REPO-HYGIENE.md)** | **Repo Hygiene 与文档治理**（含 Part C 复核与多维度、Part D 仓库内容核对与验收，原 REPO-AUDIT-REPORT、REPO_AUDIT 已合并） |
| **治理（创建提案/测试治理币）** | **[15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)**（序号 15） | 与 [09-本地链标准与地址.md](09-本地链标准与地址.md) 地址一致；Create proposal 表单各字段含义、setLTV 示例与 calldata 生成；配合 scripts/governance/ 使用 |
| **企业技术检查** | [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F | **接口对齐 + 深度多维度 + RPC 与钱包**（原 ENTERPRISE-TECH-CHECKLIST 已合并入 AUDIT-SUITE Part F） |
| **本地演示** | [DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)、根 [LOCAL_RUN.md](../LOCAL_RUN.md) | 起链、部署、前端、MetaMask、手测清单；**含 §8 本地真实运行能力评估（四项能力）**（原 LOCAL-REAL-RUN-ASSESSMENT 已合并） |
| **本地链唯一标准与地址** | **[09-本地链标准与地址.md](09-本地链标准与地址.md)** | **RPC / 前后端接口 / 智能合约地址与 ABI 唯一起点**（Part 1–4，含**企业级调试前准备与调试工作清单**）；合约以谁为准、标准操作顺序、环境变量、常见错误；深度检查见 06 Part F；与此不一致的以该文档为准 |
| **排错 / 环境** | [TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 排错（CreateFileMapping、Tooltip）与已知限制（企业统一口径） |
| **全链路测试清单** | [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) | 本地启动+钱包+四主页面及全部 UI 手测/E2E；**含 §0 执行顺序与 §0.1 E2E 层级与门禁执行流**（原 E2E-TIERS 已合并） |
| **测试执行与发布决策** | [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.2、[TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) | Go/No-Go 决策与测试执行报告（原 GO-NOGO 已合并入 FULL-LINK §0.2）；已知限制见 TROUBLESHOOTING-AND-LIMITATIONS |
| **仓库内容核对** | [REPO-HYGIENE.md](07-REPO-HYGIENE.md) Part D | 跟踪文件与验证步骤、§8 公开分享前检查（原 REPO_AUDIT、ACCEPTANCE_STATUS 已合并） |
| **文档与代码零信任一致性** | [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) 附录、[ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md) | 路径/命令旧→新映射（原 SINGLE-SOURCE-OF-TRUTH-MAPPING 已合并入 DOCS-AUDIT-REPORT 附录）；**Enterprise 防退化审计** |

---

## 二、按 P0–P10 阶段导航

| 阶段 | 说明 | 文档/位置 |
|------|------|-----------|
| **P0–P10 总览** | 企业级阶段清单、打勾测试、关联设计 | [project-upgrade/11-升级阶段清单-P0至P10.md](../project-upgrade/11-升级阶段清单-P0至P10.md) |
| **P0** | 基线、环境、分支 | project-upgrade/11 § P0 |
| **P1–P8** | 代理、模块、资产、治理、预言机、清算、机器人等 | project-upgrade/11 § P1–P8；设计见 project-upgrade/03、04、07、09、12 |
| **P9** | 治理上链、Timelock、提案、Guardian | project-upgrade/11 § P9；P9 归档计划文档（原 archive/P9-ONCHAIN-DEPLOYMENT-AND-GOVERNANCE-BOOTSTRAP-PLAN.md，已不存在） |
| **P10** | 本地最终门禁、evidence-pack、E2E | project-upgrade/11 § P10；[03-08-deployment-runbook.md](03-08-deployment-runbook.md) §8；[AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C |

**project-upgrade 目录**：00–15 与运行/审计/发布对应关系见 [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §四、[REPO-HYGIENE.md](07-REPO-HYGIENE.md)。

---

## 三、按运行命令导航

| 命令 | 用途 | 参考 |
|------|------|------|
| `npm run p10:gate` | 本地唯一验收门禁（起链→部署→治理→**e2e:core**→evidence-pack）；默认 E2E 层级 core，全量 e2e:ui 仅 `E2E_TIER=nightly` 或 `--full` | [03-08-deployment-runbook.md](03-08-deployment-runbook.md) §8、[FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0、§0.1 |
| `npm run demo:chain` | 启动本地链（8545，31337） | [DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md) |
| `npm run demo:frontend` | 启动前端（实际为 `cd frontend && npm run dev`；要 RPC 注入用 `node scripts/demo/start-frontend.mjs`） | [DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md) |
| `npm run deploy:localhost` | 部署 P0–P8 到本地链 | [03-08-deployment-runbook.md](03-08-deployment-runbook.md)、[DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md) |
| `npm run deploy:p9` | P9 治理部署 | [03-08-deployment-runbook.md](03-08-deployment-runbook.md)、project-upgrade/11 § P9 |
| `npm run e2e:ui` | Playwright UI E2E（链需已起） | [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C、scripts/ci/run-e2e-ui.mjs |
| `npm run smoke:e2e` | 烟雾测试（起链+部署+流式验证） | [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C |
| `npm test` | 合约单元+集成测试 | [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part C |
| `npx hardhat compile` | 合约编译 | AUDIT-SUITE Part C |

---

## 四、审计与清理产出

- **审计留证套件（基线+架构+测试+前端+前端 E2E 闭环）**：[AUDIT-SUITE.md](06-AUDIT-SUITE.md)（Part A–D + Part E 前端 E2E 业务闭环与 A–F 17 项验收表；原 AUDIT-*、FRONTEND-E2E-BUSINESS-CLOSURE 已合并）
- **演示 Runbook**：[DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)
- **企业技术检查清单**：[AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F（接口对齐 + 深度多维度 + RPC 与钱包，原 ENTERPRISE-TECH-CHECKLIST 已合并）
- **P0–P6 阶段总结与评估**：[PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md) Part 3（原 P0-P6-Summary 已合并入 PROJECT-LEAD-ENTRY）
- **测试执行与 Go/No-Go**：[FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.2（原 GO-NOGO 已合并）
- **排错与已知限制**：[TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)
- **docs 全量复核与清理约定**：[DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md)（企业级：**22** 个 .md 与 INDEX 归属、断链检查、§四 清理历史、**§六 不规范问题检查摘要**、**附录 单一事实源映射**）
- **docs 与 project-upgrade 一致性**：[archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md)（一次性报告已归档；接口、RPC、前后端、合约地址与 ABI；**§13 企业级一一核对表** docs ↔ project-upgrade 逐项对应；单一事实源 09、06、07、11）
- **协议设计（00–09 合并）**：[PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md)（总览/架构/经济/风险/预言机/清算/安全/治理/证据包）
- **设计/证据/其他**：[03-08-deployment-runbook.md](03-08-deployment-runbook.md) §10（发布与后续、双模式、P8 清算与测试，原 RELEASE-AND-OPS 已合并入 08 §10）、[release/](release/)、[diagrams/README.md](diagrams/README.md)；完整 KEEP 见 [REPO-HYGIENE.md](07-REPO-HYGIENE.md)

---

## 五、Deprecated / Archived 映射表（单一事实源）

**约定**：以下文档若存在，视为已弃用或归档；**以本 INDEX 为准**，当前有效入口见 § 一–四。不 DELETE，仅 ARCHIVE；引用时以表中「当前入口」为准。**完整旧→新映射**见 [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) 附录。

| 类型 | 旧/废弃路径或表述 | 当前入口 / 新（事实源） |
|------|-------------------|--------------------------|
| **Archived** | docs/archive/* | 过程文档；主入口见本 INDEX § 一–四 |
| **Archived** | 16-docs-project-upgrade-一致性检查报告.md（原根目录） | [archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md)；一次性报告，单一事实源仍为 09、13 附录 |
| **Archived** | project-upgrade/archive/* | 历史审计；阶段清单以 [11-升级阶段清单-P0至P10.md](../project-upgrade/11-升级阶段清单-P0至P10.md) 为准 |
| **Archived** | **audits/** | **docs/archive/audits/**（原 audits/* 已迁入；若该目录未提交，P9 等留证以 RELEASE_CHECKLIST_P10、03-08 §8 为准） |
| **Archived** | project-upgrade/misc/* | **project-upgrade/archive/misc/** |
| **Deprecated 表述** | `scripts/deploy.ts` | **scripts/deploy/deploy.ts**；命令：`npm run deploy:localhost` |
| **Deprecated 表述** | `test/SimpleLending.integration.ts` | **test/integration/SimpleLending.integration.ts** |
| **Deprecated 表述** | `tests/` | **test/**（本仓目录名） |
| **Deprecated 表述** | `audits/P9-*`、`audits/threat-model/` 等 | **docs/archive/audits/** 下对应文件（目录可能未提交，见上行） |
| **Deprecated 表述** | `liquidation-bot/`（独立目录） | 本仓无此目录；清算脚本：**scripts/run-liquidation-bot.ts** |
| **Deprecated 表述** | `npx hardhat run scripts/deploy.ts --network localhost` | **npm run deploy:localhost** |
| **替代关系** | 多份“审计/总结”类文档 | 以本 INDEX 所列 AUDIT-SUITE、ENTERPRISE-ZERO-TRUST（含附录判据）、FULL-LINK §0.2（Go/No-Go）为准；发布以 [RELEASE_V1.0_SIGNED.md](../RELEASE_V1.0_SIGNED.md)、[03-08-deployment-runbook.md](03-08-deployment-runbook.md) §8 为准 |
| **已清除** | LOCAL-CHAIN-STARTUP-AND-ALIGNMENT、SCREENSHOT-ERRORS-EXPLAINED、UI-WALLET-HARDHAT-CONNECTIVITY-CHECK、DASHBOARD-*诊断、POOL-READ-DIAGNOSTIC*、RPC-INTERNAL-ERROR-FIX、METAMASK-本地网络设置 | 内容已合并至 [09-本地链标准与地址.md](09-本地链标准与地址.md)；勿再引用 |
| **已清除** | REMAINING-ISSUES-CHECK、PREFLIGHT-NO-WALLET-CHECKLIST、FOUR-PAGE-UI-BUTTON-ALIGNMENT-AUDIT、RELEASE-PROOF-FINAL-*、SHIPPABLE-UI-RELEASE、PRODUCTION-POLISH-RELEASE、PRODUCTION_UI_10_CHECKLIST、FRONTEND-F6-F10-CHANGELOG、WALLET-POPUP-AND-DIAGNOSTICS、DEFI-FRONTEND-10-10-GAP、MAINNET-GO-IMPLEMENTATION-CHECKLIST、ZERO-TRUST-FRONTEND-MAINNET-AUDIT、FINAL-ZERO-TRUST-MAINNET-AUDIT、PROTOCOL-GRADE-ARCHITECTURE-REINFORCEMENT、CODE-STRUCTURE-AND-SIZE-ASSESSMENT | 冗余或一次性文档；主网类为 v1.0 非目标；勿再引用 |
| **已清除** | V1.0-FULL-GO-ZERO-TRUST-FINAL-REVIEW、RELEASE-V1.0-FINAL-PRE-SIGNATURE-VERIFICATION、AUDIT-DOCUMENTATION-ARCHITECTURE-CONSISTENCY-FINAL、AUDIT-PROJECT-UPGRADE-00-15-V1.0-CONSISTENCY、VERIFY-SPLIT-PROVIDER-AND-SEND | 结论已并入 ENTERPRISE-ZERO-TRUST / AUTHORITATIVE-RELEASE-EVIDENCE；文档一致性以 INDEX §四 §五 为准；勿再引用 |
| **已清除** | ZERO-TRUST-CONSISTENCY-AUDIT-REPORT、DEFI-LENDING-UI-MAINNET-GAP-DESIGN | 前者差异清单已并入 DOCS-AUDIT-REPORT 附录、INDEX §五；后者主网 UI 差距为 v1.0 非目标，勿再引用 |
| **已整合** | RPC-AND-NETWORK-CONFIG、TROUBLESHOOTING、KNOWN-LIMITATIONS | 已并入 [09-本地链标准与地址.md](09-本地链标准与地址.md) Part 2、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)；勿再引用原文件 |
| **已清除** | REPO-HYGIENE-FINAL-CHANGE-LIST、REAL-USER-BUSINESS-CLOSURE-VERIFICATION-RESULTS | 执行记录/一次性结果；以 [REPO-HYGIENE.md](07-REPO-HYGIENE.md)、[AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part E 为准 |
| **已清除** | LOCAL-TEST-GAS-AND-STUCK-DIAGNOSIS | 已并入 [TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) § 三「本地 Gas 与卡住排查」；勿再引用 |
| **已整合** | INTERFACE-ALIGNMENT-CHECK、DEEP-MULTIDIMENSION-CHECK | 已合并为 [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F；勿再引用原文件 |
| **已整合** | P0_P6_Summary、P6_Completion_Assessment、P0-P6-Summary-and-Assessment | 已合并为 [PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md) Part 3；勿再引用原文件 |
| **已整合** | FULL-LINK-TEST-EXECUTION-SUMMARY | 已并入 [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0「推荐执行顺序与结果摘要」；勿再引用原文件 |
| **已整合** | P10-GATE-TIER-AND-TIMEOUT | 已并入 [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.1（原 E2E-TIERS 已合并入该文档）；勿再引用原文件 |
| **已整合** | MODULAR-AUDIT-CRITERIA | 已并入 [ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md](05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md) 附录；勿再引用原文件 |
| **已整合** | E2E-TIERS | 已并入 [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.1「E2E 层级与门禁执行流」；勿再引用原文件 |
| **已整合** | REPO-AUDIT-PASS-REPORT、REPO-AUDIT-MULTIDIMENSION、REPO-AUDIT-REPORT | 已合并为 [REPO-HYGIENE.md](07-REPO-HYGIENE.md)（Part A/B + Part C 复核与多维度）；勿再引用原文件 |
| **已整合** | 00-overview、01-architecture、02-economic-model、03-risk-parameters、04-oracle-design、05-liquidation-design、06-security、07-upgrade-governance、09-audit-evidence-pack | 已合并为 [PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md)（00–09）；勿再引用原文件 |
| **已整合** | FRONTEND-E2E-BUSINESS-CLOSURE-AUDIT、REAL-USER-BUSINESS-CLOSURE-VERIFICATION、FRONTEND-E2E-BUSINESS-CLOSURE | 已合并为 [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part E「前端 E2E 业务闭环」；勿再引用原文件 |
| **已整合** | REPO-HYGIENE-AND-GOVERNANCE-AUDIT、REPO-HYGIENE-ZERO-TRUST-FINAL | 已合并为 [REPO-HYGIENE.md](07-REPO-HYGIENE.md)；勿再引用原文件 |
| **已整合** | AUDIT-BASELINE、AUDIT-ARCHITECTURE、AUDIT-TEST-RESULTS、AUDIT-FRONTEND | 已合并为 [AUDIT-SUITE.md](06-AUDIT-SUITE.md)（Part A–D）；勿再引用原文件 |
| **已整合** | ACCEPTANCE_STATUS、REPO_AUDIT、REPO_COMPLIANCE_CHECK | 已并入 [REPO-HYGIENE.md](07-REPO-HYGIENE.md) Part D「仓库内容核对与验收」与 Part E「合规与自述检查」；勿再引用原文件 |
| **已整合** | TEST-EXECUTION-REPORT | 已并入 [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.2「测试执行报告与证据引用」；勿再引用原文件 |
| **已整合** | DEEP-AUDIT-RPC-AND-WALLET | 已并入 [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F「RPC 与钱包深度审计」；勿再引用原文件 |
| **已整合** | DOCS-CLEANUP-SUMMARY | 已并入 [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §四「清理历史与约定」；勿再引用原文件 |
| **已整合** | Technical_Overview_and_Entry、PROJECT_LEAD_REVIEW、P0-P6-Summary-and-Assessment | 已合并为 [PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)；勿再引用原文件 |
| **已整合** | RELEASE-AND-POST-LAUNCH、DUAL_MODE_OPERATION、P8-liquidation-bot-and-tests、RELEASE-AND-OPS | 已合并为 [03-08-deployment-runbook.md](03-08-deployment-runbook.md) §10；勿再引用原文件 |
| **已整合** | ONE-PAGER.en、ARCHITECTURE-WHITEPAPER-SUMMARY.en、SPEAKER_SCRIPT_10MIN.en、PORTFOLIO-PRODUCT-FINISH-EN | 已合并为 [EN-PORTFOLIO.md](14-EN-PORTFOLIO.md)；勿再引用原文件 |
| **已整合** | RELEASE-RECORD-V1.0.0 | 已并入 [03-08-deployment-runbook.md](03-08-deployment-runbook.md) §9「v1.0 发布记录与宣言」；勿再引用原文件 |
| **已整合** | SINGLE-SOURCE-OF-TRUTH-MAPPING | 已并入 [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) 附录「单一事实源映射表」；勿再引用原文件 |
| **已整合** | 本地链标准流程、LOCAL-ENDPOINTS-ADDRESSES | 已合并为 [09-本地链标准与地址.md](09-本地链标准与地址.md)；勿再引用原文件 |
| **已整合** | ENTERPRISE-TECH-CHECKLIST | 已并入 [AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F「企业技术检查清单」；勿再引用原文件 |
| **已整合** | GO-NOGO | 已并入 [FULL-LINK-TEST-CHECKLIST.md](11-FULL-LINK-TEST-CHECKLIST.md) §0.2「Go/No-Go 决策与测试执行报告」；勿再引用原文件 |
| **已整合** | 不规范问题深度检查报告 | 已并入 [DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §六「不规范问题检查摘要」；勿再引用原文件 |
| **已整合** | SCREENSHOT_FLOW_VERIFICATION、Screenshot flow verification | 已并入 [debug/SCREENSHOT-FLOW-VERIFICATION.md](debug/SCREENSHOT-FLOW-VERIFICATION.md)；业务/逻辑/显示/流程验证；勿再引用根目录旧文件 |
| **已归档** | docs/README.md（旧 doc 索引，6 文件时代） | 当前入口：[01-README.md](01-README.md)、[00-INDEX.md](00-INDEX.md)；勿再引用 docs/README.md |
| **已归档** | ENTERPRISE-DOCS-ASSESSMENT.md（企业级 docs 检查报告） | 已移至 [archive/ENTERPRISE-DOCS-ASSESSMENT.md](archive/ENTERPRISE-DOCS-ASSESSMENT.md)；整改后以 00-INDEX/02/07 为准 |
| **已归档** | COMMENT-AUDIT-CHANGELOG.md（注释与文档英文化留证） | 已移至 [archive/COMMENT-AUDIT-CHANGELOG.md](archive/COMMENT-AUDIT-CHANGELOG.md)；术语与变更表见该文档；release/PRE-RELEASE-AUDIT-REPORT 引用此路径 |
| **已归档** | docs-project-upgrade-一致性检查报告.md（原根目录 16） | 当前入口：[archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md)；根目录 16 现为 16-institutional-dao-governance.md |

**长期一致性**：文档与归档以 **docs/00-INDEX.md** 及 **13-DOCS-AUDIT-REPORT.md**（含附录映射）为准；新增或下线文档时更新本表与 § 一–四，确保可审计与防退化。

---

## 六、v1.0 Full GO 封板与对外作品集（英文）

**状态**：v1.0 已封板为 **Full GO（Gate-Complete + Release-Signable）**；权威发布证据已固化于 [04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md)。以下为可投递国际 Web3 Protocol 岗位的完整工程作品集入口。

| 文档 | 用途 |
|------|------|
| **[04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md)** | **Authoritative Release Evidence**：封板 SHA256 + 四锚点；唯一事实源 |
| **[EN-PORTFOLIO.md](14-EN-PORTFOLIO.md)** | **English Portfolio**：One-Pager + 架构摘要 + 10 分钟脚本 + 产品作品集（原四份英文文档已合并） |

---

---

## 七、10/10+ 加固已完成清单（面试/审计观感）

以下 gate 已达成，便于 reviewer 一眼确认交付质量。

| 项目 | 状态 | 说明 |
|------|------|------|
| **RPC 按 chainId 分桶** | ✅ | rpcHealth 使用 Map&lt;chainId, ChainState&gt;，切链/多 tab 不混计；sessionStorage 按 chainId 存 failCount |
| **usePreflight 无 exhaustive-deps 禁用** | ✅ | 使用稳定 preflightKey (useMemo) + requestId 防竞态，无 eslint-disable |
| **Dropped 判定与取证** | ✅ | wait 超时后 getTransaction 存在性探测，droppedReason (timeout/notFound/rpcDegraded)，sessionEvidence TxFail |
| **Activity/TxStatus 可复制行** | ✅ | Replaced: replacementHash + 复制按钮；Dropped: droppedReason 文案一行 |
| **Session 取证链** | ✅ | RpcFallback / RpcRecovered / DataStale 写入 sessionEvidence；gate-release-evidence 含 rpcHealthSnapshotSchema、runtimeRiskSnapshotSchema |
| **Preflight estimateGas 去抖** | ✅ | amountText debounce 300ms，用户停输后才 estimateGas |
| **Diagnostics Copy debug bundle** | ✅ | 一键复制 version、fingerprint、rpc tier、blocksBehind、runtimeRiskSnapshot、rpcHealthSnapshot、last tx/outcome |
| **单测防回归** | ✅ | rpcHealth: blockNumber/blockDrift 分支、fallback 分支；tx: droppedReason rpcDegraded |
| **E2E fallback RPC 可见性** | ✅ | diagnostics-rpc.spec 中用例（需 E2E_SIMULATE_FALLBACK_RPC=1 + 坏 primary URL 启动前端）断言 "Using fallback RPC" |

**验收**：`npm run ci:local` 全绿；Evidence Pack 含 gate-release-evidence.txt 及上述 schema 行。

---

**与现有 docs/01-README.md 关系**：本文档为「按角色 / P0–P10 / 运行命令」三种导航的扩展索引及 Deprecated/Archived 映射唯一来源；[01-README.md](01-README.md) 声明「以 INDEX 为准」；详见 README 首段。
