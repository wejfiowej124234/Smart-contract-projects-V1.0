# V1.0 仓库与本地升级版对比报告

**V1.0 仓库**: https://github.com/wejfiowej124234/Smart-contract-projects-V1.0/tree/main  
**对比基准**: 本地当前工作区（项目升级版）  
**结论**: V1.0 上 **代码、test、scripts、contracts、frontend、根 README/package 等均不是最新**；仅 **docs** 曾部分更新，且本地 docs 后续还有优化（如 COMMENT-AUDIT 归档、DOCS-ENTERPRISE-COMPLIANCE）。需将本地**已升级的完整内容**提交并推送到 V1.0。

---

## 一、V1.0 当前内容（远程 v1/main）

| 区域 | V1.0 现有内容 | 说明 |
|------|----------------|------|
| **contracts/** | 仅 `SimpleLending.sol`、`TestToken.sol` | 旧版 2 个合约 |
| **test/** | `SimpleLending.integration.ts`（根目录）、`business-flow-scenarios.md` | 无 test/integration/、test/unit/、test/fuzz/、test/invariants/ |
| **scripts/** | `deploy.ts`（根目录）、`_lib/export.ts`、`_lib/fs.ts`、`smoke-e2e.mjs`、README | 无 scripts/deploy/、scripts/governance/、scripts/ci/、scripts/demo/、scripts/security-gate/ 等 |
| **docs/** | 00-INDEX～21、debug/、release/、runbooks/、diagrams/；根目录含 COMMENT-AUDIT-CHANGELOG | 缺 DOCS-ENTERPRISE-COMPLIANCE、debug/SCREENSHOT-FLOW-VERIFICATION；COMMENT-AUDIT 未归档 |
| **frontend/** | 旧结构：SimpleLending/TestToken ABIs，无 Governance/Markets/Activity 页，无 GovToken/GovernorP9 | 非 P0–P10 升级版前端 |
| **根目录** | README 为 v0.1.0、指向 docs/README.md、Technical_Overview、P0_P6_Summary、REPO_AUDIT 等旧路径 | 与当前 README（v1.0.0、00-INDEX、02-PROJECT-LEAD-ENTRY、p10:gate）不一致 |
| **package.json** | 无 deploy:localhost → scripts/deploy/deploy.ts、无 deploy:p9、无 p10:gate、无 e2e:ui 等 | 旧脚本与命令 |

---

## 二、本地升级版应有内容（当前工作区）

| 区域 | 本地应有内容 | 说明 |
|------|----------------|------|
| **contracts/** | core/、oracle/、tokens/、governance/、libs/、mocks/、interfaces/、test/、ImportProxy.sol、SimpleLending.sol 等 | 代理、储备、利率、清算、治理、预言机等完整模块 |
| **test/** | test/integration/（SimpleLending.integration.ts、governance-lifecycle.integration.ts）、test/unit/、test/fuzz/、test/invariants/、README.md、business-flow-scenarios.md | 集成/单元/模糊/不变式测试 |
| **scripts/** | scripts/deploy/deploy.ts、deploy-p9.ts；scripts/governance/*；scripts/ci/*（含 p10-local-only-gate.mjs）；scripts/demo/、scripts/security-gate/、scripts/release/、scripts/ops/、scripts/config/ 等 | 部署、治理、门禁、证据包、演示等 |
| **docs/** | 00-INDEX～21、DOCS-ENTERPRISE-COMPLIANCE、debug/（含 SCREENSHOT-FLOW-VERIFICATION）、release/、runbooks/、diagrams/、archive/（含 COMMENT-AUDIT-CHANGELOG 等） | 企业级索引与合规留证、业务/逻辑/显示验证 |
| **frontend/** | 多页（Dashboard、Governance、Markets、Activity）、GovToken/GovernorP9 ABI、Layout、治理组件、风险面板等 | P0–P10 升级版前端 |
| **根目录** | README v1.0.0、RELEASE_CHECKLIST_P10、RELEASE_V1.0_SIGNED、REPO_DESCRIPTION、CHANGELOG 等；package.json 含 p10:gate、deploy:localhost、deploy:p9、e2e:ui 等 | 与 v1.0 发布与门禁一致 |

---

## 三、差异摘要

- **contracts**：V1.0 仅 2 个文件；本地为完整升级版（30+ 文件），**不一致**。  
- **test**：V1.0 仅根目录 1 个集成测试；本地为 integration/、unit/、fuzz/、invariants/ 多目录，**不一致**。  
- **scripts**：V1.0 为根目录 deploy.ts；本地为 deploy/、governance/、ci/ 等子目录及 p10:gate 等，**不一致**。  
- **docs**：V1.0 为新结构但缺最新调整（如合规报告、SCREENSHOT-FLOW、COMMENT 归档）；本地更完整，**需同步**。  
- **frontend**：V1.0 为旧单页与旧 ABI；本地为多页与治理等，**不一致**。  
- **根 README / package.json**：V1.0 为 v0.1.0 与旧链接；本地为 v1.0.0 与 p10:gate 等，**不一致**。

---

## 四、建议操作（使 V1.0 与本地升级版一致）

1. **在本地提交当前升级版**  
   - 将当前所有变更（contracts、test、scripts、frontend、docs、根 README/package 等）提交到本地 main（或单独分支如 `release/v1.0`）。  
   - 若需保留 learning/ 仅在学习仓，可保持 .gitignore 忽略 learning，或提交后再从 V1.0 中排除 learning。

2. **推送到 V1.0**  
   - 将上述提交推送到远程 `v1` 的 `main`：  
     `git push v1 main:main`  
   - 若 V1.0 不允许快进（历史与本地不同），可使用：  
     `git push v1 main:main --force`  
   - 若希望 V1.0 **不包含** learning/：先建分支从当前 main 删除 learning/ 再推该分支为 v1/main。

3. **推送后自检**  
   - 在 GitHub 上确认：contracts/、test/、scripts/、docs/、frontend/、README、package.json 与本地一致。  
   - 克隆 V1.0 后执行 `npm run p10:gate`（或文档中的验证步骤）确认可复现。

---

## 五、当前本地状态说明

- 本地 **main** 相对 **v1/main** 为 behind 2 commits，且存在**大量未提交变更**（M/D/??）。  
- 升级版内容（contracts/core、test/integration、scripts/deploy 等）多数为**未跟踪或已修改未提交**。  
- 因此需先**提交**这些变更，再**推送**到 v1，V1.0 才会与“真实项目升级版”一致。

本文档可作为 V1.0 同步的留证与操作依据。
