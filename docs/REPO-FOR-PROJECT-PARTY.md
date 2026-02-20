# 项目方仓库边界说明

**目的**：若本仓库面向**项目方**（客户/交付对象/项目负责人/审查方），以下内容**建议不放入仓库**或仅保留在内部/本地，以保持交付仓简洁、专业。

---

## 一、适合项目方仓库的内容（建议保留）

| 类型 | 说明 |
|------|------|
| **代码** | `contracts/`、`frontend/`、`scripts/`（部署与门禁所需）、`test/` |
| **根文档** | `README.md`、`SECURITY.md`、`PROJECT_OVERVIEW.md`、`LOCAL_RUN.md`、`CONTRIBUTING.md`（若有） |
| **docs 主文档** | `docs/00-INDEX.md`、`01-README.md`、`02-PROJECT-LEAD-ENTRY.md`、`09-本地链标准与地址.md`、`08-DEMO-RUNBOOK-LOCAL.md`、`10-TROUBLESHOOTING-AND-LIMITATIONS.md`、`07-REPO-HYGIENE.md`（Part D）、`06-AUDIT-SUITE.md`、`03-08-deployment-runbook.md`、治理 15～21、`runbooks/`、`debug/`、`release/`、`diagrams/` |
| **配置与部署** | `deployments/`、`hardhat.config.ts`、`package.json`、前端 `config/`、ABI 等 |
| **发布说明** | 可保留**一份**精简的发布说明（如 `RELEASE_V1.0_SIGNED.md` 或合并到 `docs/03-08-deployment-runbook.md` §9），其余内部清单可不放入 |

---

## 二、建议不放入项目方仓库的内容

| 路径/文件 | 说明 |
|-----------|------|
| **learning/** | 学习与面试材料（图解、代码与合约、部署测试、证据与验收等）；面向个人学习/面试，非交付物 |
| **project-upgrade/** | 升级过程、阶段清单、内部设计/审计过程文档；内部规划用 |
| **docs/archive/** | 过程审计、历史报告、COMMENT-AUDIT-CHANGELOG、ENTERPRISE-DOCS-ASSESSMENT 等；已由 00-INDEX § 五 说明，无需在交付仓中保留正文 |
| **evidence/**、**evidence-pack/**（运行产物） | 本地留证、CI 输出、截图、manifest；地址应以 `deployments/<chainId>.json` 为准，运行产物易过期且占体积 |
| **e2e/evidence/** | E2E 运行产生的截图与输出 |
| **test-results/** | Playwright 失败截图、error-context 等；生成物，不应作为交付内容 |
| **slides/** | 面试 deck、演讲稿、优化报告、录制指南等；若仅内部/学习用，可不放入项目方仓 |
| **RELEASE_CHECKLIST_P10.md** | 内部发布清单（详细步骤）；可保留一份精简版或合并到 docs，详细版建议内部保留 |
| **docs/V1-REPO-SYNC-REPORT.md** | 内部同步/对比报告；仅运维用 |
| **DOCS-ENTERPRISE-COMPLIANCE**（若为过程文档） | 整改过程文档；结果已体现在 00–21，过程可内部保留 |
| **liquidation-bot/**、**scenarios/**、**monitoring/**（若仅内部/运维） | 视是否对项目方公开；若仅内部运维，可不放入交付仓 |
| **CODING_TEST_PITFALLS_AND_OPTIMIZATIONS.md**、**README_CODING_TEST_CHECKLIST.md**、**AUDIT_LOCAL.md**、**docs/ACCEPTANCE_STATUS.md** | 内部开发/考试/验收过程；已在 .gitignore 的保持不跟踪 |

---

## 三、落地方式建议

### 方案 A：当前仓库即“项目方仓”——从仓库中移除上述内容

1. **补充 .gitignore**：将 `learning/`、`project-upgrade/`、`evidence/`、`evidence-pack/`、`test-results/`、`e2e/evidence/` 等列入，避免再次被跟踪。
2. **从 Git 中移除（保留本地文件）**：  
   `git rm -r --cached learning/ project-upgrade/ evidence/ evidence-pack/ test-results/`（以及需排除的其他路径），然后提交并推送。
3. **文档**：可保留 `RELEASE_V1.0_SIGNED.md` 或一份精简发布说明；`RELEASE_CHECKLIST_P10.md`、`docs/V1-REPO-SYNC-REPORT.md` 等建议移除跟踪或移入内部仓。

### 方案 B：双仓策略

- **内部仓**：保留当前完整内容（学习材料、升级过程、evidence、test-results、内部清单等）。
- **项目方仓**：仅包含“一、适合项目方仓库的内容”，不包含“二”中列出的路径与文件；可通过单独 clone + 稀疏检出、或单独仓库同步所需路径实现。

---

## 四、当前 .gitignore 已覆盖的部分

以下已在本项目 `.gitignore` 中，**不会**被提交到仓库（若之前未跟踪）：

- `docs/archive/`
- `slides/` 及部分 slides 相关脚本与产出
- `evidence-pack/deployments-*.json`、`evidence-pack/evidence-summary.json`、`evidence-pack/*.txt`、`evidence-pack/screenshots/`
- `AUDIT_LOCAL.md`、`README_CODING_TEST_CHECKLIST.md`、`docs/ACCEPTANCE_STATUS.md`
- 部分内部脚本（如 `scripts/move-docs-to-archive.cjs`、slides 生成脚本等）

**仍被跟踪但建议从“项目方视角”移除的**：`learning/`、`project-upgrade/`、`evidence/`（根下）、`evidence-pack/manifest.json` 等、`test-results/`、以及可选：`RELEASE_CHECKLIST_P10.md`、`docs/V1-REPO-SYNC-REPORT.md`。按上面方案 A 或 B 处理即可。

---

**交付仓说明**：本交付仓（V1）**不包含** `project-upgrade/` 与 `docs/archive/`；文档中对这两处的引用为历史/内部版约定，运行与验证以 [09-本地链标准与地址](09-本地链标准与地址.md)、[03-08-deployment-runbook](03-08-deployment-runbook.md)、[00-INDEX](00-INDEX.md) 为准。

---

*文档版本：与 00-INDEX、01-README 一致；项目方 = 客户/交付对象/项目负责人/审查方。*
