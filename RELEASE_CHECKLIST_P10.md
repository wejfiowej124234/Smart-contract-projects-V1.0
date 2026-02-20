# P10 Engineering-Complete · Local-Only 交付清单（可签字）

**定义**：P10 = **Engineering-Complete**（本地离线交付）。不依赖 GitHub tag/release；交付物为本地链可复现证明 + Evidence Pack。

**网络**：localhost / chainId 31337。主网/测试网为后续扩展，非本阶段范围。

---

## 1. 前置条件（P0–P9 已收口）

| 项 | 状态 | 说明 |
|----|------|------|
| P0–P8 部署与打勾 | ✅ | 见 project-upgrade/11-升级阶段清单-P0至P10.md |
| P9 全勾（含 Guardian E2E、12 参数变更、12 实现升级） | ✅ | docs/archive/audits/P9-ONCHAIN-GOVERNANCE-ACTIVATION-FINAL-CHECK.md §3.1–§3.7 |
| verify-p9-complete.ts exit 0，V1–V8 通过 | ✅ | 留证见 docs/archive/audits §3.4 |

---

## 2. Local-Only 最终门禁（一条命令从零 → evidence-pack）

**命令**：`npm run p10:gate`

**含义**：一条命令完成：**端口检查** → **从零启动本地链** → **RPC 就绪（eth_chainId=0x7a69）** → **跑 p10:ci**（含 **e2e:ui**，或 SKIP_E2E_UI=1 跳过）→ **生成 evidence-pack** → **校验 evidence-summary 四锚点（commitSha/node/npm/os）** → **输出 EVIDENCE-PACK-MANIFEST-SHA256 及 COMMIT_SHA/NODE_VERSION/NPM_VERSION/OS**；任一步失败即阻断（exit non-zero）。**v1.0 唯一验收标准**：端口 8545 空闲下 `npm run p10:gate` **exit 0**。

- **端口占用策略**：若 8545 已有 RPC 响应则打印**实际 chainId**（eth_chainId），写入 evidence/p10-gate-output.txt 后 **exit 1 阻断**，不启动第二节点。
- **杀进程树**：结束时对本次启动的 node 进程做**进程树终止**（Windows: taskkill /F /T /PID；Unix: kill 进程组），避免残留。
- **RPC 就绪判定**：使用 **eth_chainId**，预期 `0x7a69`（31337）再继续。
- **人工验收锚点**：成功时结尾输出 `EVIDENCE-PACK-MANIFEST-SHA256: <hex>` 及四锚点（COMMIT_SHA、NODE_VERSION、NPM_VERSION、OS），与 evidence-pack/evidence-summary.json 一致；便于人工或脚本核对。

**可选（双终端方式）**：终端 1 运行 `npx hardhat node`，终端 2 运行 `npm run p10:ci`，效果等价，但不自动起/停节点。

| 检查项 | 打勾 | 备注 |
|--------|------|------|
| `npm run p10:gate` 从零跑通，exit 0 | [x] | Local-Only 最终门禁（含 UI E2E）；当轮 2026-02-17 |
| **UI E2E**：`npm run e2e:ui` 在链已起时跑通（或通过 p10:gate 内 e2e:ui 步骤） | [x] | 15 passed（Forensic A1–F17 + lending-flow + markets-cta-prefill + pause-governance） |
| **一键演示**：`npm run demo:chain`、`npm run demo:frontend` 可分别一键起链、起前端 | [ ] | 无外网；MetaMask + 前端接 RPC http://127.0.0.1:8545、Chain ID 31337 |
| evidence/p10-ci-output.txt 已生成 | [x] | 含各步 tx/block/[EVIDENCE] 输出 |
| evidence-pack/ 已生成（manifest 含 gateRunId、gateManifestSha256、files 含 p10-gate-output.txt sha256） | [x] | Engineering-Complete 交付物 |
| evidence/p10-gate-output.txt、evidence-pack/p10-gate-output.txt 与 manifest 双向绑定 | [x] | 门禁输出纳入 pack，manifest 记录 sha256 |
| evidence-summary.json 含 genesisBlockHash（链就绪时采集） | [x] | 与 gate 就绪时链一致 |

### F10 当轮证据（Release-Signable）

| 项目 | 值 |
|------|-----|
| 执行日期 | 2026-02-17 |
| EVIDENCE-PACK-MANIFEST-SHA256 | `1c7b758cf9fc645ba598015c38f2fb4747ad43796a8deb613a96661c2bcbcb0e` |
| COMMIT_SHA | `9101e124660b6ec00947dec34a49e92c85c9445a` |
| NODE_VERSION | `v22.14.0` |
| NPM_VERSION | `10.9.2` |
| OS | `win32/10.0.26100` |
| 产物路径 | `evidence-pack/`、`e2e/evidence/playwright-test-results/`、`e2e/evidence/forensic/` |
| 状态 | **Release-Signable** |

---

## 3. Evidence Pack 内容

| 文件 | 说明 |
|------|------|
| evidence-pack/manifest.json | 版本、chainId、生成时间、各文件 sha256；**gateRunId**、**gateManifestSha256**（manifest 自身 sha256）；files 含 **p10-gate-output.txt**（sha256） |
| evidence-pack/p10-gate-output.txt | 门禁完整输出（与 evidence/p10-gate-output.txt 一致），manifest 中记录 sha256 双向绑定 |
| evidence-pack/deployments-31337.json | 部署地址快照（Pool、Configurator、ProxyAdmin、Governor、Timelock、EmergencyModule 等） |
| evidence-pack/evidence-summary.json | 关键 tx hash、区块号、关键读值快照；**genesisBlockHash**；**四锚点** commitSha、node、npm、os（门禁只读打印，双向锚定） |

---

## 4. 签字（Release 责任人）

**本人确认**：P10 已达 **Engineering-Complete**（本地离线交付）。已通过 Local-Only 最终门禁（`npm run p10:gate` 或等价 p10:ci 从零复跑），Evidence Pack 已生成；P0–P9 打勾与留证齐全。**不依赖 GitHub tag/release**；交付物以 evidence-pack/ 与本清单为准。**F10 当轮门禁已通过，状态为 Release-Signable。**

**Release 责任人**  
签字：________________________ 日期：________________________  

**可选：技术审核**  
签字：________________________ 日期：________________________  

---

## 5. 签字后（可选扩展）

**本阶段仅做本地离线交付**，无需 GitHub tag/release。若后续需对外发布或扩展：

- **多网络 / 前端 P11–P20**：见 **docs/03-08-deployment-runbook.md** §10（发布/扩展清单与验收标准）路径 B。
- 若需 tag/release 归档：见 **docs/03-08-deployment-runbook.md** §10 路径 A（可选）。

## 6. 参考

- **Release & Post-Launch**：docs/03-08-deployment-runbook.md §10（发布/扩展清单与验收标准）  
- **11 清单**：project-upgrade/11-升级阶段清单-P0至P10.md  
- **P9 留证**：docs/archive/audits/P9-ONCHAIN-GOVERNANCE-ACTIVATION-FINAL-CHECK.md  
- **12 流程**：project-upgrade/12-升级流程.md  
- **Governance 脚本**：scripts/governance/README.md  
