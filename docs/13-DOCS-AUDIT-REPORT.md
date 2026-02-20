# docs/ 全量复核报告（企业级）

**复核标准**：唯一条目 INDEX；所有 .md 均在 INDEX § 一–四 或 § 五/§ 六 有归属；无引用已删除文档的断链；已合并/已重定向以 § 五 为准。

**复核时间**：按执行日填写  
**结论**：**通过** — docs 内 **22** 个根目录 .md 已全部与 INDEX 映射；站内引用无断链。（**本轮整理**：不规范问题深度检查报告已并入本文 §六；16-docs-project-upgrade-一致性检查报告已移至 **archive/**；根目录 00～15 + 治理 16～21 共 22 个 .md。）

---

## 一、docs 文件清单与 INDEX 归属

| 文件 | INDEX 归属 | 说明 |
|------|-------------|------|
| 00-INDEX.md | — | 唯一条目入口 |
| 01-README.md | § 一 约定、企业级约定 | 文档入口 |
| 13-DOCS-AUDIT-REPORT.md | § 四（本文档） | 全量复核 + §四 清理历史 + **附录 单一事实源映射**（原 SINGLE-SOURCE-OF-TRUTH-MAPPING） |
| 02-PROJECT-LEAD-ENTRY.md | § 一 项目负责人 | 技术概览+仓库结构+P0–P6 总结（原 Technical_Overview、PROJECT_LEAD_REVIEW、P0-P6-Summary 已合并） |
| 05-ENTERPRISE-ZERO-TRUST-AUDIT-REPORT.md | § 一 安全/审计、§ 四 | 终审依据（含附录：模块化可审计判据） |
| 06-AUDIT-SUITE.md | § 一 安全/审计、§ 二 P10、§ 三、§ 四 | Part A–E + Part F 企业技术检查清单（原 ENTERPRISE-TECH-CHECKLIST 已合并） |
| 03-08-deployment-runbook.md | § 一 发布/门禁、§ 二 P10、§ 三、§ 四 | 部署与 P10 门禁 + **§9 v1.0 发布记录与宣言** + **§10 发布与运维**（原 RELEASE-RECORD、RELEASE-AND-OPS 已合并） |
| 04-AUTHORITATIVE-RELEASE-EVIDENCE.md | § 一 发布/门禁、§ 六 | 封板证据 |
| 07-REPO-HYGIENE.md | § 一 仓库治理 | 治理 + Part C 复核与多维度 + **Part D 仓库内容核对与验收**（原 REPO_AUDIT 已合并） |
| 08-DEMO-RUNBOOK-LOCAL.md | § 一 本地演示、§ 三、§ 四 | 演示 Runbook（含 §8 本地真实运行能力评估） |
| 09-本地链标准与地址.md | § 一 本地链唯一标准与地址 | 标准流程+端点与地址（原 本地链标准流程、LOCAL-ENDPOINTS 已合并） |
| 10-TROUBLESHOOTING-AND-LIMITATIONS.md | § 一 排错/环境、§ 四 | 排错与已知限制 |
| 11-FULL-LINK-TEST-CHECKLIST.md | § 一 全链路测试清单、§ 三、§ 四 | 清单 + §0 + §0.1 E2E 层级与门禁 + §0.2 Go/No-Go（原 GO-NOGO 已合并） |
| 12-PROTOCOL-DESIGN.md | § 四 协议设计 | 00–09 合并 |
| 14-EN-PORTFOLIO.md | § 四 设计/证据/其他、§ 六 | 英文作品集（One-Pager+架构+10分钟脚本+产品作品集，原四份英文已合并） |
| 15-governance-create-proposal-example.md | § 一 治理（创建提案）、§ 〇 | 创建提案表单填写、setLTV 示例（与 09 地址一致） |
| 16-institutional-dao-governance.md | § 一 治理、§ 〇 | 制度级 DAO 基线 |
| 17-governance-tier2-dao-gaps-and-roadmap.md | § 一 治理、§ 〇 | Tier-2 缺口与路线图 |
| 18-governance-protocol-level-dao.md | § 一 治理、§ 〇 | 协议级 DAO |
| 19-governance-endstate-dao.md | § 一 治理、§ 〇 | 终局级 DAO |
| 20-governance-ultra-endgame.md | § 一 治理、§ 〇 | Ultra-Endgame 哲学与继承 |
| 21-governance-ultimate-unresolved.md | § 一 治理、§ 〇 | 终极未解清单 |
| archive/16-docs-project-upgrade-一致性检查报告.md | § 〇 一致性与检查、§ 四、INDEX §五 | 一次性报告已归档；docs 与 project-upgrade 接口/前后端/合约一致性 |
| runbooks/incident-response.md | § 一 治理、§ 〇 治理 | 事故响应 runbook |
| runbooks/treasury-and-budget.md | § 一 治理、§ 〇 治理 | 国库与预算 runbook |
| release/B4-EVIDENCE-SCHEMA.md | § 四 设计/证据/其他 | B4 证据 schema |
| diagrams/README.md | § 四 设计/证据/其他 | 图表说明 |
| debug/README.md | § 一 调试入口、§ 〇 子目录 | debug 目录说明 |
| debug/DEBUG_PLAYBOOK.md | § 一 调试入口、§ 〇 子目录 | 调试清单主手册（A–E 分层） |
| debug/INCIDENT_TEMPLATE.md | § 一 调试入口、§ 〇 子目录 | 证据化问题记录模板 |
| debug/CHECKLIST_E2E.md | § 一 调试入口、§ 〇 子目录 | E2E 检查清单 |
| debug/ENTERPRISE-FRONTEND-BACKEND-CHECK.md | § 一 调试入口、§ 〇 子目录 | 企业级前后端核对 |
| debug/ENTERPRISE-AUDIT-TROUBLESHOOTING-RUN.md | § 一 调试入口、§ 〇 子目录 | 企业级审计排错执行 |
| debug/MULTIDIMENSION-CHECK-AND-LOCAL-FRONTEND-CHECKLIST.md | § 一 调试入口、§ 〇 子目录 | 多维度检查与本地前端清单 |
| debug/ORACLE-LTV-UNITS-AND-REGRESSION.md | § 一 调试入口、§ 〇 子目录 | 预言机 LTV 单位与回归 |
| debug/SCREENSHOT-FLOW-VERIFICATION.md | § 一 调试入口、§ 〇 子目录 | 业务/逻辑/显示/流程验证（原 SCREENSHOT_FLOW_VERIFICATION 已并入） |
| archive/COMMENT-AUDIT-CHANGELOG.md | § 四 审计留证、INDEX §五 | 注释与文档英文化留证（术语表与变更表）；release/PRE-RELEASE-AUDIT-REPORT 引用 |
| archive/ENTERPRISE-DOCS-ASSESSMENT.md | INDEX §五 | 企业级 docs 检查报告（整改前）；整改后以 00-INDEX/02/07 为准 |
| DOCS-ENTERPRISE-COMPLIANCE.md | 00-INDEX 根目录表 | 企业级/顶级符合性留证（本检查报告）；非序号文档 |

**排序与子目录**：根目录已按 **00–15** + **治理 16–21** 排序；推荐阅读顺序与文件列表见 [00-INDEX.md](00-INDEX.md) 开篇；子目录 **runbooks/**、**release/**、**diagrams/**、**debug/**、**archive/** 名称保持不变。

**可合并与已清理**：当前根目录 **22** 个 .md；已清除/已整合见 §四、INDEX §五；《不规范问题深度检查报告》已并入本文 §六。§一 已登记 **runbooks/**（2 个 .md）、**debug/**（9 个 .md）、**archive/**（COMMENT-AUDIT-CHANGELOG、16-docs-project-upgrade-一致性检查报告、ENTERPRISE-DOCS-ASSESSMENT 等），子目录文档均在 INDEX/§ 〇 有归属。

**本轮复核（可删除/可合并）**：① **已修复断链**：根 README、RELEASE_V1.0_SIGNED 中指向已删除文档（RELEASE-V1.0-DECLARATION、ONE-PAGER.en、ARCHITECTURE-WHITEPAPER-SUMMARY.en、SPEAKER_SCRIPT_10MIN.en、MAINNET_READY、MAINNET_LAUNCH_GO_NOGO、AUTHORITATIVE-RELEASE-EVIDENCE 旧路径）已改为 03-08 §9、14-EN-PORTFOLIO、04-AUTHORITATIVE-RELEASE-EVIDENCE、docs/archive 或 03-08 §10；02-PROJECT-LEAD-ENTRY 内 INDEX.md→00-INDEX.md。② **建议可删除（可选）**：无；docs 根目录 22 个 + runbooks/release/diagrams/debug 已为最小集。③ **已执行**：project-upgrade/00-文档0-15与真实代码同步修正记录 已并入 **00-与当前代码对齐说明 §5**，原文件已删除。④ **已执行**：§四「历史合并」已精简为「完整列表见 00-INDEX §五；本轮优化：RELEASE-AND-OPS→03-08 §10」及简要登记。

---

## 二、引用与断链检查

- **已合并/已删除文档**：站内无引用指向已删除文件（含本轮二次优化删除的 Technical_Overview_and_Entry、PROJECT_LEAD_REVIEW、P0-P6-Summary-and-Assessment、RELEASE-AND-POST-LAUNCH、DUAL_MODE_OPERATION、P8-liquidation-bot-and-tests、ONE-PAGER.en、ARCHITECTURE-WHITEPAPER-SUMMARY.en、SPEAKER_SCRIPT_10MIN.en、PORTFOLIO-PRODUCT-FINISH-EN、REPO_AUDIT、RELEASE-RECORD-V1.0.0、SINGLE-SOURCE-OF-TRUTH-MAPPING、FRONTEND-E2E-BUSINESS-CLOSURE）；仅 INDEX § 五、本文 §四、合并后文档内说明中出现，属合规。
- **已删除文档**：本轮删除 本地链标准流程、LOCAL-ENDPOINTS-ADDRESSES、ENTERPRISE-TECH-CHECKLIST、GO-NOGO（内容见 09-本地链标准与地址、AUDIT-SUITE Part F、FULL-LINK §0.2）。此前删除的 14 份及 MODULAR-AUDIT-CRITERIA、E2E-TIERS、00–09 等见 INDEX § 五。

**结论**：无断链。

---

## 三、企业级约定符合性

| 项 | 状态 |
|----|------|
| 唯一条目 | ✅ 00-INDEX.md 为唯一导航；01-README 声明以 INDEX 为准 |
| 本地链单一文档 | ✅ 09-本地链标准与地址（原 本地链标准流程、LOCAL-ENDPOINTS 已合并） |
| 已清除/已整合 | ✅ INDEX § 五 完整；13-DOCS-AUDIT-REPORT §四 清理历史与约定及本文附录（原 SINGLE-SOURCE 已合并）同步 |
| 发布证据单一 | ✅ 04-AUTHORITATIVE-RELEASE-EVIDENCE；宣言在 03-08-deployment-runbook §9 |
| 无孤立文档 | ✅ 所有根目录 **22** 个 .md + 子目录 .md 已在 § 一–四 或 § 五/§ 六 或本表「设计/证据/其他」中登记 |

---

## 四、清理历史与约定（原 DOCS-CLEANUP-SUMMARY）

**约定**：技术文档以 **[00-INDEX.md](00-INDEX.md)** 为唯一入口。

- **按角色 / 阶段 / 命令 / 审计 / 发布** 见 INDEX § 一–四。
- **已清除或已归档文档** 见 INDEX § 五（Deprecated / Archived / 已清除 / 已整合）。
- 本地链唯一标准与地址：[09-本地链标准与地址.md](09-本地链标准与地址.md)（含标准流程、RPC/端口/地址、环境变量、常见错误）。
- 排错与已知限制：[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)。
- **历史合并**：完整列表见 **00-INDEX.md § 五**；本轮优化：RELEASE-AND-OPS → **03-08-deployment-runbook §10**；此前一次～四次优化（MODULAR-AUDIT-CRITERIA、E2E-TIERS、00–09→PROTOCOL-DESIGN、PROJECT-LEAD-ENTRY、EN-PORTFOLIO、09-本地链标准与地址、AUDIT-SUITE Part F、GO-NOGO、RELEASE-AND-OPS 等）均已登记于 INDEX § 五。已清除/已整合以 INDEX § 五 为准。

---

## 五、与 project-upgrade 对照及调试入口（防混乱）

- **docs 与 project-upgrade 分工**：**project-upgrade** 为升级阶段与执行（00–15、11 阶段清单、02 资产清单、03 五大模块、07 合约清单、09 安全设计等）；**docs** 为运行/审计/发布入口与协议设计（00–07/09 为协议设计：overview/architecture/economic-model/risk/oracle/liquidation/security/governance/evidence-pack）。二者编号不对应：docs/02=economic-model，project-upgrade/02=资产清单；阶段与打勾以 **project-upgrade/11** 为准。
- **调试前后端唯一入口**（避免文档过多导致调试出问题）：仅用 3 个文档 — [09-本地链标准与地址.md](09-本地链标准与地址.md)、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md)、[08-DEMO-RUNBOOK-LOCAL.md](08-DEMO-RUNBOOK-LOCAL.md)。INDEX 已在上方「调试前后端唯一入口」标明；其余文档按角色/阶段从 § 一–四 进入，不用于日常排错。

---

## 附录：单一事实源映射表（原 SINGLE-SOURCE-OF-TRUTH-MAPPING 已合并）

**约定**：以当前仓库代码、package.json 脚本、p10:gate exit 0、evidence-pack 为唯一事实源。引用以「新」列为准。

### 路径与目录

| 旧 / 模糊表述 | 新（本仓事实） |
|---------------|----------------|
| `scripts/deploy.ts` | `scripts/deploy/deploy.ts`；命令 `npm run deploy:localhost` |
| `scripts/deploy-p9.ts` | `scripts/deploy/deploy-p9.ts`；`npm run deploy:p9` |
| `test/SimpleLending.integration.ts` | `test/integration/SimpleLending.integration.ts` |
| `tests/` | `test/` |
| `audits/` | `docs/archive/audits/` |
| `liquidation-bot/` | 本仓无此目录；清算脚本 `scripts/run-liquidation-bot.ts` |
| `project-upgrade/misc/` | `project-upgrade/archive/misc/` |

### 命令

| 旧 / 模糊表述 | 新（本仓事实） |
|---------------|----------------|
| `npx hardhat run scripts/deploy.ts --network localhost` | `npm run deploy:localhost` |
| 验收「跑 deploy 再 e2e」 | 本地唯一验收：`npm run p10:gate`（exit 0） |

### Deprecated / 已清除 与 INDEX 一致

见 **docs/00-INDEX.md** § 五「已清除」「已整合」行；本轮已整合见 §四 清理历史。本表与 INDEX § 五 同步。

---

---

## 六、不规范问题检查摘要（原《不规范问题深度检查报告》已合并）

**检查范围**：根目录、docs/、project-upgrade/、frontend/、scripts/、e2e/、configs/、test/ 等。**约定**：RPC/Chain ID/目录名/文档名以 [09-本地链标准与地址.md](09-本地链标准与地址.md)、[00-INDEX.md](00-INDEX.md)、[03-08-deployment-runbook.md](03-08-deployment-runbook.md) 及 [archive/16-docs-project-upgrade-一致性检查报告.md](archive/16-docs-project-upgrade-一致性检查报告.md) 为准。

- **已修复项**：docs/01-README 中 docs/archive 表述、project-upgrade 内 misc/→archive/misc/、runbook→03-08、14-企业级审计报告与 13-审计与对照 中 archive/misc/ 已统一。
- **已符合规范**：RPC/Chain ID（127.0.0.1:8545、31337）、test/ 目录名、deploy 路径（scripts/deploy/deploy.ts、npm run deploy:localhost）、reserves.31337.json、03-08-deployment-runbook、前端 ABI、00-INDEX 索引入口均已统一。
- **保留现状**：project-upgrade/archive、docs/archive 内历史表述按约定不修改；e2e/evidence 自动生成内容可不改。
- **各目录抽查**：docs/、project-upgrade/（非 archive）、frontend/、scripts/、e2e/、configs/、test/ 已按 09 与 INDEX 核对。

**报告依据**：全仓 grep/read 扫描；若规范更新请以 09 与 00-INDEX 为准。

---

## 七、企业级审计结论（本轮整理后）

| 检查项 | 结果 |
|--------|------|
| 文件数量与 INDEX 一致 | ✅ docs 根目录 **22** 个 .md（00～15 + 治理 16～21）；runbooks/、release/、diagrams/、debug/、archive/ 见 INDEX；与 00-INDEX 文件清单一致 |
| 无指向已删除文档的引用 | ✅ 全库已无 RELEASE-AND-OPS、RELEASE-AND-POST-LAUNCH、DUAL_MODE_OPERATION、P8-liquidation-bot 等断链 |
| 唯一条目与单一事实源 | ✅ INDEX 为唯一条目；03-08 §10 为发布与运维唯一入口；附录映射与 INDEX § 五 同步 |
| 清理历史可追溯 | ✅ § 四 含历史优化记录；不规范问题检查已并入 §六；一致性报告已移至 archive/，根目录 16 现为 16-institutional-dao-governance |

**审计结论**：通过。文档体系 **22** 个 .md（00～15 + 治理 16～21），已合并《不规范问题深度检查报告》、一致性报告已归档，全库链接与 00-INDEX 一致，符合企业级单一入口与可审计要求。

**签字**（可选）  
执行人：________________ 日期：________________
