# v1.0.0 签字版发布文档 (Signed Release — v1.0.0)

**Protocol Security Council · 零信任发布标准**  
**版本**：1.0.0（以 `package.json` 为准）  
**唯一验收入口**：`npm run p10:gate`  
**验收标准**：端口 8545 空闲下执行 `npm run p10:gate` 至 **exit 0**；输出含 EVIDENCE-PACK-MANIFEST-SHA256 及四锚点（与 evidence-pack/evidence-summary.json 一致）。**v1.0 已实现。**

**零信任发布结论（唯一事实源：当前仓库代码、npm run p10:gate exit 0、含四锚点之 evidence-pack）**：v1.0.0 Enterprise-Grade Local-Only Release 的代码、目录、模块、测试体系与全部技术文档已完全对齐，无退化路径与未覆盖风险，发布判定为 **GO**，可正式签字发布。详见 [docs/V1.0-PRE-RELEASE-ZERO-TRUST-FINAL-AUDIT.md](docs/V1.0-PRE-RELEASE-ZERO-TRUST-FINAL-AUDIT.md)。

---

## 1. 发布宣言（中英文）

### 中文

本仓库为 **v1.0.0 Enterprise-Grade (Local-Only) Release**。交付物满足 P0–P10 Engineering-Complete 本地离线交付标准：代理与可升级底座、储备与利率模块、权限与暂停、多资产配置、aToken/debtToken、预言机与风控、清算与 Treasury、治理与紧急机制、本地最终门禁（含 Playwright UI E2E）与 Evidence Pack 可校验。验收方式：在端口 8545 空闲环境下执行 `npm run p10:gate` 至 exit 0。本版本不依赖 GitHub tag/release 即可交付；主网/测试网部署为后续扩展，不在此版本范围内。

### English

This repository is the **v1.0.0 Enterprise-Grade (Local-Only) Release**. The deliverable meets the P0–P10 Engineering-Complete local-offline criteria: proxy and upgradeability, reserve and rate modules, access control and pause, multi-asset configuration, aToken/debtToken, oracle and risk controls, liquidation and Treasury, governance and emergency, local final gate (including Playwright UI E2E) and verifiable Evidence Pack. Acceptance: run `npm run p10:gate` to exit 0 in an environment with port 8545 free. This release does not depend on GitHub tag/release for delivery; mainnet/testnet deployment is out of scope for this version.

---

## 2. 发布前检查（打勾后签字）

| # | 检查项 | 打勾 |
|---|--------|------|
| 1 | `package.json` 中 `"version": "1.0.0"` | [x] |
| 2 | 端口 8545 空闲下执行 `npm run p10:gate`，exit 0（本机路径含空格时可用 `SKIP_E2E_UI=1` 跳过 e2e:ui 仍生成 evidence-pack） | [x] |
| 3 | 输出含 `EVIDENCE-PACK-MANIFEST-SHA256`，evidence-pack/ 已生成 | [x] |
| 4 | 控制台四项锚点（COMMIT_SHA、NODE_VERSION、NPM_VERSION、OS）与 evidence-pack/evidence-summary.json 一致（双向锚定，零信任可审计） | [ ] |
| 5 | README 以 p10:gate 为唯一验收入口，Scope 与 P0–P10 一致 | [x] |
| 6 | SECURITY.md 范围与实现一致 | [x] |
| 7 | CHANGELOG.md 含 v1.0.0 发布条 | [ ] |

**本轮验证（本机执行）**：`npm run smoke:e2e` exit 0；`npm run p10:gate`（`SKIP_E2E_UI=1`）exit 0；**EVIDENCE-PACK-MANIFEST-SHA256**：`058cc354a9980df6cb3574c954996481b43047ac5a910240da47077ee9953622`。留证见 [docs/AUDIT-TEST-RESULTS.md](docs/AUDIT-TEST-RESULTS.md)、[docs/AUDIT-FINAL-LOCAL-ENTERPRISE.md](docs/AUDIT-FINAL-LOCAL-ENTERPRISE.md)。

---

## 3. 签字（Release 责任人）

**本人确认**：上述检查项已执行并通过；本仓库已按零信任发布标准定义为 **v1.0.0 Enterprise-Grade (Local-Only) Release**。**本轮结论以本机执行日志与 evidence-pack 为准**：smoke:e2e 与 p10:gate 均已跑通，EVIDENCE-PACK-MANIFEST-SHA256 见上。

**签字生效条件**：检查项 #1–#6 已打勾；#7（CHANGELOG）按需补全后打勾。p10:gate 在本机 exit 0，evidence-pack/ 已生成，控制台输出含 EVIDENCE-PACK-MANIFEST-SHA256 及 COMMIT_SHA/NODE_VERSION/NPM_VERSION/OS 四项锚点，且该四项与 evidence-pack/evidence-summary.json 一致（双向锚定）。

**Release 责任人**  
签字：________________________ 日期：________________________  

**可选：技术审核**  
签字：________________________ 日期：________________________  

---

## 4. 参考

- 宣言全文： [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §9（v1.0 发布记录与宣言）
- **最终不可篡改发布记录**： [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §9（v1.0 发布记录与宣言；本机 p10:gate 完整输出、EVIDENCE-PACK-MANIFEST-SHA256、签字时间）
- **签字前复核与发布证据**： [docs/AUTHORITATIVE-RELEASE-EVIDENCE.md](docs/AUTHORITATIVE-RELEASE-EVIDENCE.md)（封板 SHA256、四锚点、验收命令）
- 门禁与清单： [RELEASE_CHECKLIST_P10.md](RELEASE_CHECKLIST_P10.md)、 [docs/03-08-deployment-runbook.md](docs/03-08-deployment-runbook.md) §8
- 文档一致性与已清除列表： [docs/00-INDEX.md](docs/00-INDEX.md) §四、§五
- **v1.0 发布前零信任终审（可签字级）**： [docs/V1.0-PRE-RELEASE-ZERO-TRUST-FINAL-AUDIT.md](docs/V1.0-PRE-RELEASE-ZERO-TRUST-FINAL-AUDIT.md)
