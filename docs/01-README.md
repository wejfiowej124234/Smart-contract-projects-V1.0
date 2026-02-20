# Project documentation (docs)

**企业级约定**：所有文档以 **[00-INDEX.md](00-INDEX.md)** 为唯一条目；本地链以 [09-本地链标准与地址.md](09-本地链标准与地址.md) 为准；已清除/已整合见 [00-INDEX.md](00-INDEX.md) § 五。**文档数量与规范**：根目录 22 个 .md（00～15 + 治理 16～21）、子目录 runbooks/debug/release/diagrams/archive 以 00-INDEX 开篇表为准；与 project-upgrade 的对应与引用约定见 [archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md) §0 规范摘要与 §13。

**Convention**: Essential docs for lead/review and **P0–P10** release. **v1.0 已实现**；唯一验收：端口 8545 空闲下 **`npm run p10:gate` exit 0**（见根 [RELEASE_CHECKLIST_P10.md](../RELEASE_CHECKLIST_P10.md)、[RELEASE_V1.0_SIGNED.md](../RELEASE_V1.0_SIGNED.md)）。**Full index** (by role / P0–P10 / run command): [00-INDEX.md](00-INDEX.md). **Local demo runbook**: [08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md).

**文档与归档以 [00-INDEX.md](00-INDEX.md) 为准**：角色/阶段/命令导航、Deprecated/Archived/已清除 映射见 [INDEX § 五](00-INDEX.md)；清理历史与约定见 [13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §四。

---

## docs 文档分类总览

以下与 [00-INDEX.md](00-INDEX.md) 文档分类总览保持一致（docs 根目录 **22** 个 .md：**00～15** + **治理 16～21**，以 [00-INDEX.md](00-INDEX.md) 为准）。

| 类别 | 入口节 | 说明 |
|------|--------|------|
| **按主题归类** | **[INDEX § 〇](00-INDEX.md)** | **本地链、治理、部署、审计、协议、角色、英文、一致性** 等主题快速查找 |
| 入口与约定 | 根 README、[INDEX](00-INDEX.md)、本文档 | 唯一条目；企业级约定 |
| 角色导航 | [INDEX § 一](00-INDEX.md) | 项目负责人、安全/审计、发布/门禁、仓库治理、**治理（创建提案）**、企业技术检查、本地链/演示/排错/测试/全链路/E2E |
| 阶段与命令 | [INDEX § 二](00-INDEX.md)、[§ 三](00-INDEX.md) | P0–P10、运行命令（p10:gate、demo、deploy、e2e、test、compile） |
| 审计与清理产出 | [INDEX § 四](00-INDEX.md) | 审计留证套件、前端 E2E 闭环、演示 Runbook、企业技术检查、P0–P6 总结、Go/No-Go、排错、docs 全量复核、协议设计(PROTOCOL-DESIGN)、设计/证据/其他 |
| 英文作品集 | [INDEX § 六](00-INDEX.md) | [14-EN-PORTFOLIO.md](14-EN-PORTFOLIO.md)、AUTHORITATIVE-RELEASE-EVIDENCE |
| 已弃用/已整合 | [INDEX § 五](00-INDEX.md) | 重定向、已清除、已整合映射；勿再引用旧路径 |

**文档归类一览**（按主题）：入口与索引(00-01) → 本地链与运行(08-10) → **治理(15～21、runbooks)** → 部署与发布(03-04) → 审计与质量(05-07、11、13) → 协议与设计(12) → 角色与概览(02) → 英文作品集(14) → 一致性与检查(archive) → 子目录（runbooks、debug、release、diagrams、archive）。**根目录按序号 00～15 + 治理 16～21**，完整条目与 § 〇 按主题表见 **[00-INDEX.md](00-INDEX.md)**。

---

## v1.0 Release (P10 Local-Only)

- **[03-08-deployment-runbook.md](03-08-deployment-runbook.md)** §9 — v1.0 发布记录与宣言（原 RELEASE-RECORD 已合并）。
- **[03-08-deployment-runbook.md](03-08-deployment-runbook.md)** §8 — P10 gate and Path A commands.
- **Root**: [RELEASE_V1.0_SIGNED.md](../RELEASE_V1.0_SIGNED.md) (signed release checklist).

---

## For reviewers

- **Quick start**: [02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)（技术概览、仓库结构、P0–P6 总结，原三份已合并）.
- **What’s in the repo**: [07-REPO-HYGIENE.md](07-REPO-HYGIENE.md) Part D（tracked files and verification steps，原 REPO_AUDIT 已合并）.
- **排错与已知限制**: [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)（CreateFileMapping、Tooltip、已知限制统一口径）。
- **本地链唯一标准与地址**（合约以谁为准、标准操作顺序、RPC/端口/Chain ID/合约地址、环境变量、常见错误；**Part 4 企业级调试前准备与调试工作清单**）: [09-本地链标准与地址.md](09-本地链标准与地址.md)。与此不一致的以该文档为准。
- **治理（创建提案/测试治理币）**（表单填写、setLTV 示例；地址与 09 一致，序号 15）: [15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)。
- **深度审计**（硬编码对齐、RPC 畅通、UI 跳转钱包）: [06-AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F（不弹窗/RPC 排查见 [09-本地链标准与地址.md](09-本地链标准与地址.md) Part 2 §5、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)）。
- **Local test: Gas 与卡住说明**（本地不需真实 Gas、卡住原因、全功能含治理）已并入 [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) § 三。
- **企业技术检查**（接口对齐 + 深度多维度 + RPC 与钱包）: [06-AUDIT-SUITE.md](06-AUDIT-SUITE.md) Part F。

---

## Where to start (project lead)

You only need these **2**:

1. **[00-INDEX.md](00-INDEX.md)** — 唯一条目、按角色/阶段/命令导航。
2. **[02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)** — Repo structure, standards, P0–P6 summary, self-check（原 PROJECT_LEAD_REVIEW、Technical_Overview、P0-P6-Summary 已合并）。

---

## 技术文档入口（Essential docs）

| 文档 | 用途 |
|------|------|
| **[00-INDEX.md](00-INDEX.md)** | **唯一索引入口**：按角色 / P0–P10 / 命令 / 审计 / 发布；已清除与归档见 § 五 |
| **[09-本地链标准与地址.md](09-本地链标准与地址.md)** | **本地链联调 SSOT**：唯一起动标准与 RPC/端口/合约地址；Part 4 调试前准备与调试工作。联调严格执行 最短闭环 + GATE 五项 + [debug/DEBUG_PLAYBOOK](debug/DEBUG_PLAYBOOK.md) 分层 + Evidence Pack 留证（见 09 总纲） |
| **[debug/](debug/)**（DEBUG_PLAYBOOK、INCIDENT_TEMPLATE、CHECKLIST_E2E、SCREENSHOT-FLOW-VERIFICATION 等，共 9 个 .md） | **调试清单主手册** + **证据化问题记录** + **业务/逻辑/显示/流程验证**；全表见 [13-DOCS-AUDIT-REPORT.md](13-DOCS-AUDIT-REPORT.md) §一；与 p10:gate/evidence-pack 互补 |
| **[runbooks/](runbooks/)**（incident-response、treasury-and-budget） | 事故响应、国库与预算（治理运行级） |
| **[03-08-deployment-runbook.md](03-08-deployment-runbook.md)** | 部署与 P10 门禁（§8） |
| **[02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)** | 技术栈、仓库结构、P0–P6 总结与自检（原三份已合并） |
| **[07-REPO-HYGIENE.md](07-REPO-HYGIENE.md)** Part D | 跟踪文件与验证步骤（原 REPO_AUDIT 已合并） |

完整列表见 **00-INDEX.md** § 一–四。

---

## Archive

**Note**: `docs/archive/` 存放过程文档与审计留证（如 COMMENT-AUDIT-CHANGELOG、一致性检查报告、ENTERPRISE-DOCS-ASSESSMENT）；主入口以 [00-INDEX.md](00-INDEX.md) § 一–四、§ 五 为准。是否跟踪 archive 以 .gitignore 与仓库策略为准；核心文档见上表 + INDEX § 一–四。

---

## Public clone

Anyone who clones this repository gets the tracked files. The repo is ready for reviewers to run and verify (see [07-REPO-HYGIENE.md](07-REPO-HYGIENE.md) Part D).

---

## Items in .gitignore (not for lead/interviewer)

The following may be in **`.gitignore`** and not tracked; they do **not** appear on GitHub if ignored. You can keep them locally.

| Type | Description |
|------|-------------|
| **.cursorrules** | Cursor IDE rules, internal tool config |
| **docs/archive/**（若未跟踪） | 过程文档、审计留证；若已跟踪则见 INDEX § 五 |
| **learning/** | 学习与面试材料（本地目录，可能未入仓）。**当前 v1.0 权威入口**：若存在则为 [learning/项目总览架构.md](../learning/项目总览架构.md)（已与 P0–P10 对齐；0–29 学习文档已参照总览更新）。其余栈与运行见 [02-PROJECT-LEAD-ENTRY.md](02-PROJECT-LEAD-ENTRY.md)、[09-本地链标准与地址.md](09-本地链标准与地址.md)、[12-PROTOCOL-DESIGN.md](12-PROTOCOL-DESIGN.md)、[15-governance-create-proposal-example.md](15-governance-create-proposal-example.md)、根 README 与 [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md)。 |
| **slides/dist/** | Exported slide HTML, QA screenshots (_pagecheck_*) |
| **Slides internal** | Content checks, final review, optimization/speaker/review reports, PDF and recording notes |
| **Root** | generate-pdf.bat, GeneratePDF.bat (local only when needed) |

**Slides** kept in the repo: `INTERVIEW_DECK.en.md`, `README.md`, `assets/*.svg` (Chinese deck and speaker script are local-only, not in repo).
