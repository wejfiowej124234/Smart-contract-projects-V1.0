# 仓库治理与 Repo Hygiene（合并文档）

本文档由原 **REPO-HYGIENE-AND-GOVERNANCE-AUDIT.md**（全量 Repo Hygiene 与文档治理审计、KEEP/ARCHIVE/DELETE 清单）与 **REPO-HYGIENE-ZERO-TRUST-FINAL.md**（零信任终态结构、变更清单与 Git 提交方案）合并而成。**事实源**：当前代码、`npm run p10:gate` exit 0、evidence-pack（四锚点）。**结论**：见 Part A § 唯一发布级结论；终态与 Git 方案见 Part B。

---

# Part A：治理审计（范围与原则）

## 一、审计范围

docs/ 全部 .md（00～15 + 治理 16～21）、runbooks/、release/、diagrams/、debug/、archive/；project-upgrade/ 00–15、README、前端专项、archive/；frontend/ README；scripts/、test/ README；根目录 .md；evidence-pack/ 保留。排除：合约/脚本/测试源码、node_modules、learning/（已 .gitignore）。

## 二、唯一事实源原则

- 保留/更新/归档/删除的唯一依据：当前代码、p10:gate exit 0、evidence-pack、v1.0 Local-Only Release 定义。
- 不得保留：与代码不一致的文档、旧路径/升级前状态、无引用价值的学习/临时资料。
- 不改变：代码运行路径、p10:gate 行为、evidence-pack 生成与校验。

## 三、三类清单摘要

- **KEEP**：v1.0 发布/审计/门禁/治理相关，或 INDEX 引用到的正式文档。根 README、SECURITY、RELEASE_V1.0_SIGNED、RELEASE_CHECKLIST_P10、CHANGELOG、LOCAL_RUN、PROJECT_OVERVIEW、CONTRIBUTING、REPO_DESCRIPTION；docs/ 01-README、00-INDEX、02-PROJECT-LEAD-ENTRY、06-AUDIT-*、03-08-deployment-runbook（含 §10 发布与运维）、08-DEMO-RUNBOOK、12-PROTOCOL-DESIGN、14-EN-PORTFOLIO、07-REPO-HYGIENE、15～21 治理、runbooks/、release/、diagrams/、debug/、archive/；project-upgrade/ README、00–15、11、archive/；scripts/、test/、frontend/ README；evidence-pack/*。**完整 KEEP 表**见原 REPO-HYGIENE-AND-GOVERNANCE-AUDIT §3.1（已合并）；以 **docs/00-INDEX.md** 为文档体系唯一入口。
- **ARCHIVE**：过程文档、历史审计 → docs/archive/ 或 project-upgrade/archive/；在 INDEX § 五 登记。
- **DELETE**：仅空目录与一次性脚本（如 move-remaining.ps1）；无正式文档删除。

## 四、唯一发布级结论

v1.0 发布后仓库治理收口已完成：KEEP/ARCHIVE/DELETE 已执行；引用与路径以现仓为准；单一文档入口 **docs/00-INDEX.md**；发布以 04-AUTHORITATIVE-RELEASE-EVIDENCE、RELEASE_V1.0_SIGNED 为准。

---

# Part B：零信任终态与 Git 方案

## 一、最小化终态仓库结构

根：README、SECURITY、RELEASE_V1.0_SIGNED、RELEASE_CHECKLIST_P10、CHANGELOG、LOCAL_RUN、PROJECT_OVERVIEW、CONTRIBUTING、REPO_DESCRIPTION、.gitignore、package.json、hardhat.config.ts 等。公开分享/推送前检查见 docs/release/MULTIDIMENSION-CHECK.md、PRE-RELEASE-AUDIT-REPORT.md。  
contracts/、scripts/（deploy/deploy.ts、deploy-p9.ts、governance/、ci/、demo/、release/、config/、_lib/）、test/（unit/、integration/、fuzz/、invariants/）、frontend/、deployments/、evidence-pack/。  
docs/：01-README、00-INDEX（★）、02-PROJECT-LEAD-ENTRY、03-08（含 §10）、08-DEMO-RUNBOOK、06-AUDIT-*、14-EN-PORTFOLIO、12-PROTOCOL-DESIGN、07-REPO-HYGIENE、15～21 治理、runbooks/、release/、diagrams/、debug/、archive/（audits/）。  
project-upgrade/：README、00–15、11、archive/misc/。  
已移除空目录：audits/、project-upgrade/misc/（无编号文档现位于 **project-upgrade/archive/misc/**）。

## 二、文档层级与命名规范

入口：根 README → docs/01-README → docs/00-INDEX。命名：大写下划线/连字符、数字前缀（如 03-08-deployment-runbook、09-本地链标准与地址）；当前入口为 00-INDEX～15、治理 16～21，见 00-INDEX 开篇文件列表及 § 一–四；§ 五 为已弃用/归档映射。归档：docs/archive/*、project-upgrade/archive/*；INDEX § 五 映射。引用：部署 scripts/deploy/deploy.ts；测试 test/integration/SimpleLending.integration.ts；P9 留证 docs/archive/audits/P9-ONCHAIN-*（若该目录未提交，留证以 RELEASE_CHECKLIST_P10、03-08 §8 为准）。

## 三、.gitignore 策略

不提交：node_modules、artifacts、cache、.env、*.log、frontend/dist、learning/、slides/。docs/archive/ 可选随仓。**v1.0 主仓跟踪**：CHANGELOG.md 已从 .gitignore 移除。公开分享/推送前检查见 docs/release/MULTIDIMENSION-CHECK.md、PRE-RELEASE-AUDIT-REPORT.md。内部仅用：ACCEPTANCE_STATUS、AUDIT_LOCAL 等保持忽略。

## 四、变更清单与 Git 提交方案

- **第一轮**：ARCHIVE 过程文档与 audits/、**project-upgrade/archive/misc/**（无编号文档现位于此处）；更新 RELEASE_CHECKLIST_P10、INDEX § 五。
- **第二轮**：删除空目录 audits/、project-upgrade/misc/（若曾存在）；.gitignore 移除 CHANGELOG；本文档（REPO-HYGIENE.md）替代原两份。公开分享清单已收口至 docs/release/（MULTIDIMENSION-CHECK、PRE-RELEASE-AUDIT-REPORT）。
- **建议 commit**：`chore(repo): archive and path updates per hygiene`；`chore(repo): zero-trust final hygiene — empty dirs, .gitignore, merged REPO-HYGIENE`。
- **发布前**：再次 `npm run p10:gate` exit 0；确认无敏感/临时文件。

---

# Part C：复核与多维度审计（原 REPO-AUDIT-REPORT 已合并）

**结论**：**通过**。路径/命令/引用与现仓一致；INDEX § 一–五 覆盖完整；package.json 与文档一致（deploy:localhost、deploy:p9、p10:gate、e2e:ui 等）；.gitignore 与追踪策略见 Part B §三；术语与命名：唯一验收 `npm run p10:gate` exit 0、部署入口 scripts/deploy/deploy.ts、测试 test/integration/、归档 docs/archive/。建议：新增/下线文档时同步 INDEX 与 REPO_AUDIT；发布前再次 p10:gate exit 0。

---

---

# Part D：仓库内容核对与验收（原 REPO_AUDIT 已合并）

**用途**：项目负责人/面试官查看「仓库里有什么、如何验证」的单一入口。

- **Tracked 结构**：.github/workflows/ci.yml、contracts/、deployments/、docs/（以 INDEX 为准）、frontend/、scripts/（deploy/、governance/、ci/、demo/、config/、_lib/）、test/（unit/、integration/、invariants/、fuzz/）、hardhat.config.ts、package.json、根 README/LOCAL_RUN/SECURITY/PROJECT_OVERVIEW/CONTRIBUTING 等。
- **脚本**：scripts/deploy/deploy.ts（deploy:localhost）、deploy-p9.ts（deploy:p9）；scripts/ci/p10-local-only-gate.mjs（p10:gate）；smoke-e2e.mjs；npm scripts：compile、node、deploy:localhost、deploy:p9、p10:gate、test、smoke:e2e、e2e:ui、ci:local。
- **合约与测试**：contracts/ 含 core/、oracle/、tokens/、governance/ 等；test/ 含 integration/SimpleLending.integration.ts、invariants/、fuzz/。
- **CI**：.github/workflows/ci.yml — push/PR 时 npm ci、compile、test（合约）、frontend lint/build；无 deploy 或 secrets。
- **验证清单**：① `npm ci` 后 `npm run ci:local`；② 起链 + deploy:localhost + frontend dev，MetaMask 31337，跑 supply/borrow/repay/withdraw；③ 可选 `npm run smoke:e2e`；④ 可选 `npm run audit:prod`。
- **Content policy**：无「assignment/coding test/exam」表述；CHANGELOG 已跟踪；公开分享/推送前检查见 docs/release/；无中文 slides；package.json 不引用缺失或内部文件。
- **§8 公开分享前检查（原 ACCEPTANCE_STATUS）**：分享前 push 含 docs；面试官可 clone → npm ci → npm run ci:local；运行：node + deploy:localhost + frontend dev，31337 + MetaMask，supply/borrow/repay/withdraw；合规：项目仅用、英文自述、链接有效、CI 与一键验证就绪。

---

# Part E：合规与自述检查（原 REPO_COMPLIANCE_CHECK 已合并）

**用途**：公开/面试官仓库自述与合规速查。

- **Tracked 内容**：仅项目相关；根 docs、docs/（以 00-INDEX 为准）、scripts/、frontend/、contracts/、test/、CI；无 internal/process-only 文档在仓。
- **敏感措辞**：自述中无 “assignment” / “coding test” / “exam”；SECURITY.md 用 “reproduction details / attack steps”，不用 “exploit”。
- **链接**：README 与 docs 内链目标均为已跟踪文件；无指向 docs/archive/ 或缺失文件的链接。
- **package.json scripts**：deploy:localhost、smoke:e2e、ci:local、p10:gate、e2e:ui 等仅引用仓内存在脚本；无引用 .gitignore 或缺失文件。
- **面试官 clone-and-verify**：README 声明自包含、公开；一键验证 `npm ci` + `npm run ci:local`；三终端运行（node、deploy、frontend）已文档化；REPO-HYGIENE Part D 列出跟踪文件与步骤。

**结论**：满足公开分享与面试官克隆验证要求；合规项见 Part D §8。

---

**文档版本**：1.0（合并版）  
**依据**：原 REPO-HYGIENE-AND-GOVERNANCE-AUDIT、REPO-HYGIENE-ZERO-TRUST-FINAL、REPO-AUDIT-REPORT、REPO_AUDIT、REPO_COMPLIANCE_CHECK；当前代码与 p10:gate + evidence-pack。
