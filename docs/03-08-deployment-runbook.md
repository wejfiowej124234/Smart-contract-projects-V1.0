# 08 部署与运行手册（Deployment Runbook）

> 目标仓库首次部署与升级流程的可执行手册。**Dual-Mode · 本地优先**：默认 MODE=mock，本地门禁与演示在 localhost(31337) 完整可测可跑可留证；MODE=real 仅作未来上线配置，不得成为本地门禁前置。首次部署前必须完成「首次部署前检查清单」并打勾；实现合约升级与回滚见 project-upgrade《12-升级流程》。

---

## 1) 首次部署前检查清单（12 §7）

**适用范围**：新网络/新环境**第一次**部署代理与实现（非「已有代理、换实现」）。执行部署脚本前逐项打勾。

| 类别 | 检查项 | 打勾 |
|------|--------|------|
| **环境与网络** | 当前网络与 project-upgrade《01-当前项目现状》§2 环境与网络清单一致（local/testnet/mainnet）；chainId、RPC 正确；.env 或 hardhat.config 的 defaultNetwork 与目标环境一致 | [ ] |
| **依赖与版本** | Node/Hardhat/Solidity 版本符合项目要求；`npm ci` 或 `npm install` 已执行；无已知漏洞依赖（可选：npm audit） | [ ] |
| **Key 与权限** | 部署用私钥或 KMS 已就绪；testnet/mainnet 与 local 的 key 隔离；多签/Timelock 地址（若需）已确定 | [ ] |
| **Config** | scripts/config（reserves）、configs/profiles（profile）下当前环境的配置文件存在（如 reserves.31337.json、profile.json）；资产列表、LTV/LT、Oracle 映射等与 project-upgrade《02-资产清单-抵押与借贷》《15-Mock与测试环境清单》对齐；储备路径见 profile.reservesConfigPath 或 scripts/config/reserves.\<chainId\>.json（与 docs/09 一致） | [ ] |
| **Mock（本地）** | 若为 local：Mock 合约与《15-Mock与测试环境清单》§1、§2 一致；价格/代币初始化参数已设 | [ ] |
| **部署顺序** | 部署顺序已明确：实现合约 → 代理 → 初始化；或按本 runbook「首次部署」章节执行 | [ ] |
| **导出与前端** | 部署脚本写 deployments/\<chainId\>.json，**scripts/_lib/export.ts** 同步到 **frontend/src/contracts/deployments.json** 并写出 ABI（与 docs/09 一致）；前端 RPC 与当前环境一致 | [ ] |
| **主网权限移交（H1 / Final Gate B1–B3）** | **主网部署前**：ProxyAdmin.owner、**Pool (LendingPool).owner**、PoolConfigurator.admin 须移交多签或 Timelock；不得长期由 EOA 控制；执行移交并记录（见 docs/archive/audits/final-security-gate-mainnet.md） | [ ] |

- **全部打勾后再执行首次部署**；详细步骤见下文「首次部署步骤」。实现合约升级与回滚见 project-upgrade《12-升级流程》§3–§4。

---

## 1.1) 主网/测试网发布前检查清单（Governance Entry Resolution EC-3）

**适用范围**：任何**主网或测试网**发布（含 P0–P8 部署产物或治理相关发布）。执行发布前逐项打勾。

| 检查项 | 打勾 |
|--------|------|
| 已在本机或 CI 兼容环境下执行 `npm run ci:local:release`（需先启动 `npx hardhat node`），且**全部步骤通过**（Deploy → Smoke → Test → C3a deviation test → Security Gate，exit 0） | [ ] |
| 发布清单本项已勾选，且负责人/日期已记录 | [ ] |

- **未通过不得发布**；见 `docs/archive/PRE-P9-RISK-ACCEPTANCE-STATEMENT.md` §4 与 `docs/archive/GOVERNANCE-ENTRY-RESOLUTION-P9.md` 第三条 EC-3。

---

## 2) 首次部署步骤（简要）

1. 确认上述检查清单全部打勾。
2. **Dual-Mode（本地优先）**：默认 **MODE=mock**；所有 deploy/governance/security-gate 仅通过 **loadProfile(chainId)** 取配置，禁止散落 env 分支。**本地**：`npm run deploy:localhost`；**未来上线**：MODE=real 时 `npx hardhat run scripts/deploy/deploy.ts --network sepolia`（详见 **§10.2**）。
3. 部署脚本按 profile 注入 Token/Oracle/治理参数；实现合约 → 代理 → 初始化 → PoolConfigurator → aToken/variableDebtToken → Oracle → Liquidation/Treasury；按 **profile.reservesConfigPath** 或 **scripts/config/reserves.\<chainId\>.json** 驱动 setLTV/setLiquidationThreshold。**deployments/\<chainId\>.json 仅存链上结果**。
4. 部署脚本写 deployments/\<chainId\>.json，**scripts/_lib/export.ts** 同步到 **frontend/src/contracts/deployments.json** 并写出 ABI；确认前端 RPC 与当前环境一致。
5. 可选：跑冒烟测试 `npm run smoke:e2e` 或 `npx hardhat test` 验证。
6. **主网/生产（Final Gate C3）**：部署后规定时间内（建议 24h 或首笔价格更新前）设置 PriceBoundGuard anchor；部署时校验并记录 LTV ≤ LT（或明确接受 LTV>LT 的产品决策）。

### 2.1 本地门禁与演示验收（MODE=mock，打勾用）

| 命令 | 验收标准 |
|------|----------|
| `npm run p10:gate` | **必须 exit 0**，生成 evidence-pack，含 manifest sha256 锚点（如 `EVIDENCE-PACK-MANIFEST-SHA256`）。 |
| `npm run scenario:crash50-demo` | 可重复复现：建仓 → crash50 → 可清算 → 清算成功 → 关键读值输出。前置：已 `deploy:localhost`。 |

MODE=real **不参与**上述本地门禁与演示验收。

---

## 3) 实现合约升级与回滚

- **升级**：见 project-upgrade《12-升级流程》§3（准备 → 部署新实现 → 提案 → Timelock 执行 → 链上验证）。
- **回滚**：见 project-upgrade《12-升级流程》§4（Pause → upgrade 指回上一实现 → 验证 → 事后分析）。

---

## 4) 与本仓库文档关系

- **project-upgrade/12-升级流程.md**：升级与回滚的权威描述；本 runbook 的检查清单与 12 §7 一致。
- **project-upgrade/11-升级阶段清单-P0至P10**：每 P 打勾测试通过后再进入下一 P；部署前应完成 12 §7 检查。

---

## 5) 故障排查：HH506（编译/测试无法运行）

**现象**：`npx hardhat compile` 或 `npx hardhat test` 报错 `Error HH506: Error running solcjs`。

**根因**：
- Hardhat 默认会下载或使用缓存中的 Solidity 编译器（原生或 WASM）。在部分环境（如 Windows 无写权限到 `%LOCALAPPDATA%\hardhat-nodejs\Cache\compilers-v2`、或 CI/沙箱限制子进程/文件访问）下，运行 solcjs 会失败并触发 HH506。

**本仓库修复（已落位）**：
- **hardhat.config.ts** 中已覆盖 `TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD`，当 solidity 版本为 **0.8.19** 时，直接使用 **node_modules/solc/soljson.js** 作为编译器，不再依赖全局缓存或原生下载。
- 确保项目内已安装 `solc`（如 `"solc": "^0.8.19"`）；`npm ci` 后即可直接执行 `npx hardhat compile` 与 `npx hardhat test`。

**若仍报 HH506**：
- 在**受限环境**（如部分 IDE 沙箱）下，运行编译/测试时需赋予进程访问 node_modules 与执行子进程的权限。
- 可选传统方案：在具备写权限的环境执行一次 `node scripts/seed-solc-cache.cjs`，将 solc 注入 Hardhat 缓存（需可写 `getCompilersDir()` 目录），再于本机执行 compile/test。

---

## 6) 本地与 L2 主网：Security Gate B4 与切换条件

**策略**：B4（SequencerUptimeGuard）在**本地可跳过**，在 **L2 主网上线不可绕过**。

### 6.1 环境与 B4 行为

| 环境 | chainId 示例 | B4 行为 | 说明 |
|------|----------------|--------|------|
| **本地** | 31337 | **[Skip]** | 本地验证不要求 L2 预言机路径；Gate 输出明确提示「B4 required for L2 mainnet」。 |
| **L2 测试网** | 421614（Arbitrum Sepolia）等 | **[Skip]** | 测试网可跳过；上线 L2 主网前必须满足 B4。 |
| **L2 主网** | 10, 42161, 8453, 534352（Opt / Arbitrum / Base / Scroll） | **必须 [Pass]**，否则 **[Fail]** 且 exit code=1 | 未实现或未配置 SequencerUptimeGuard 时 Gate 直接失败，不得绕过。 |
| **非 L2** | 1, 137, 5, 11155111 等 | **[Skip]** | B4 不适用。 |

### 6.2 本地验收（仅做本地链：RPC http://127.0.0.1:8545、Chain ID 31337）

1. 启动节点：`npx hardhat node`。
2. 部署：`npm run deploy:localhost`。
3. 跑 Gate：`npx hardhat security-gate --network localhost`。
4. **预期**：B4 为 `[Skip]`，提示「Local only (chainId=31337). B4 required for L2 mainnet — see docs/03-08-deployment-runbook.md §6.」；其余项按当前配置 Pass/Fail；若仅 B4 为 Skip，exit code=0。

### 6.3 从本地切换到 L2 主网前的条件

在**任意 L2 主网**（chainId 10 / 42161 / 8453 / 534352）部署或发布前，必须完成以下一项，使 B4 可 Pass：

| 选项 | 验收步骤 |
|------|----------|
| **A. 链上实现** | Oracle 路径中接入 SequencerUptimeGuard（或等效）：`OracleRouter.feeds(asset)` 指向的 feed 或其 `source()` 实现 `isSequencerUp()`，且 sequencer 正常时返回 `true`。部署后再次运行 `npx hardhat security-gate --network <l2-mainnet>`，B4 须为 [Pass]。 |
| **B. 签名证据文件（可验证、防伪、不可绕过）** | 提供 **已签名** 的 `docs/release/B4-L2-evidence-<chainId>.json`，且 Gate 校验通过。证据必须包含：`chainId`、`commitSha`、`deploymentsHash`、`timestamp`、`signature`；Gate 会校验其与**当前构建**的 commit、当前 `deployments/<chainId>.json` 的 SHA256 一致，并验签（签名者须在 `b4EvidenceSigners` 或 `B4_EVIDENCE_SIGNERS` 中）。**仅文件存在而校验不通过（如 commit/部署变更、签名无效）一律判 B4 [Fail]**。详见 docs/release/B4-EVIDENCE-SCHEMA.md。 |

若两项均未满足，Gate 在 L2 主网上会输出 B4 [Fail] 且 **exit code=1**，不得以“仅做本地验证”为由绕过上线。

### 6.4 L2 主网验收步骤（上线前必做）

1. 确认目标链为 L2 主网（chainId 10 / 42161 / 8453 / 534352）。
2. 完成 6.3 中选项 A 或 B。若选 B：
   - 在**当前 commit** 与**当前 deployments 文件**下执行：`CHAIN_ID=<chainId> B4_SIGNER_PRIVATE_KEY=0x... npx hardhat run scripts/release/sign-b4-evidence.ts`，生成 `docs/release/B4-L2-evidence-<chainId>.json`。
   - 在 `scripts/config/security-gate-<chainId>.json` 中配置 `b4EvidenceSigners: ["<签名者地址>"]`（或 CI 中设置 `B4_EVIDENCE_SIGNERS`）。
3. 执行：`npx hardhat security-gate --network <l2-mainnet>`（需在 hardhat.config 中配置对应 RPC 与 chainId）。
4. **必须**：B4 为 [Pass]，且 Gate 无其他 [Fail]；exit code=0 后方可视为通过。
5. CI 集成（见 6.6）：发布流水线中在**同一构建**内生成证据或使用已提交证据，并运行 Gate 校验。

### 6.5 参考

- **Gate 定义与否证**：docs/archive/audits/final-security-gate-mainnet.md §3 B4、§5 C2。
- **Gate 可执行说明**：docs/archive/SECURITY_GATE_VERIFICATION.md。
- **B4 证据格式与校验**：docs/release/B4-EVIDENCE-SCHEMA.md。
- **证据文件示例**：docs/release/B4-L2-evidence-42161.example.json。

### 6.6 CI 集成（L2 主网发布级校验）

- **原则**：证据与当前构建绑定（commitSha + deploymentsHash）；Gate 在**同一构建/同一 commit** 下校验证据，否则判 Fail。
- **方式一（推荐）**：在发布流水线中，部署完成后在同一 job 内：① 生成 `deployments/<chainId>.json`（或从 artifact 恢复）；② 使用受控密钥运行 `npm run release:sign-b4-evidence`（或 `npx hardhat run scripts/release/sign-b4-evidence.ts`），将 `B4_EVIDENCE_SIGNERS` 或 `b4EvidenceSigners` 配置为对应签名者；③ 运行 `npx hardhat security-gate --network <l2-mainnet>`，必须 exit 0。
- **方式二**：证据文件随仓库提交（在固定 commit 下生成并提交）。CI 中在该 commit 上运行 Gate 时，`BUILD_SHA`/`GITHUB_SHA` 与证据内 `commitSha` 一致、deployments 未改则通过。若之后 commit 或 deployments 变更，Gate 将 Fail，保证不可绕过。
- **环境变量**：CI 中可设 `GITHUB_SHA`（GitHub Actions 自动）、`BUILD_SHA` 或 `COMMIT_SHA` 与当前 commit 一致；`B4_EVIDENCE_SIGNERS` 为允许的签名者地址列表（逗号分隔）。

---

## 7) Mock 场景与演示闭环（仅 MODE=mock，本地优先）

本地链部署后可用 **scenarios/** 复现预设：`npm run scenario:crash50`、`scenario:stale`、`scenario:high-util`、`scenario:reset`。**演示闭环**：`npm run scenario:crash50-demo` 必须可重复复现「建仓 → crash50 → 可清算 → 清算成功 → 关键读值输出」。详见 **§10.2** 命令矩阵与验收标准。

---

## 8) P10 Engineering-Complete · Local-Only 最终门禁

- **定义**：P10 = **Engineering-Complete**（本地离线交付）。不依赖 GitHub tag/release。
- **一条命令**：`npm run p10:gate` — 端口占用检查（8545 已有 RPC 则 exit 1）→ 启动本地链 → **eth_chainId** 就绪（0x7a69）→ **p10:ci**（含 **e2e:ui**：启动前端 → Playwright 跑 UI E2E → 失败则 **exit 1**）→ evidence-pack → 结尾输出 **EVIDENCE-PACK-MANIFEST-SHA256** 作为人工验收锚点；失败即阻断；结束时杀进程树。
- **可选**：终端 1 `npx hardhat node`，终端 2 `npm run p10:ci`（不自动起/停节点）。
- **可签字清单**：根目录 **RELEASE_CHECKLIST_P10.md**；详见 project-upgrade/11-升级阶段清单-P0至P10.md P10 节。

### 8.1 路径 A：一键本地演示与 E2E 门禁

| 用途 | 命令 | 说明 |
|------|------|------|
| 一键起链 | `npm run demo:chain` | 起本地链（8545），chainId 0x7a69 就绪后常驻；无外网。 |
| 一键起前端 | `npm run demo:frontend` | 设置 VITE_LOCAL_RPC_URL 等，前端 dev 起于 5173；MetaMask 接 RPC http://127.0.0.1:8545、Chain ID 31337；前端读 **frontend/src/contracts/deployments.json**（由 deploy 经 scripts/_lib/export.ts 同步自 deployments/31337.json）。 |
| UI E2E | `npm run e2e:ui` | 需链已起；脚本起前端、等待就绪、跑 Playwright（lending-flow + pause-governance），失败 exit 1。 |
| P10 门禁 | `npm run p10:gate` | 含 e2e:ui 步骤；**E2E 失败 → exit 1**，门禁不通过。 |

---

## 9) v1.0 发布记录与宣言（原 RELEASE-RECORD-V1.0.0 已合并）

- **宣言**：本仓库为 **v1.0.0 Enterprise-Grade (Local-Only) Release**。交付物满足 P0–P10 Engineering-Complete 本地离线交付标准；唯一验收：端口 8545 空闲下 **`npm run p10:gate` exit 0**，输出含 EVIDENCE-PACK-MANIFEST-SHA256 及四锚点。**v1.0 已实现**。
- **封板证据**：**[04-AUTHORITATIVE-RELEASE-EVIDENCE.md](04-AUTHORITATIVE-RELEASE-EVIDENCE.md)**；签字版见根 [RELEASE_V1.0_SIGNED.md](../RELEASE_V1.0_SIGNED.md)。
- **签字与锚点**（示例）：签字时间、EVIDENCE-PACK-MANIFEST-SHA256、Gate Run ID、Evidence Pack 生成时间 — 以门禁执行后生成的 evidence-pack 与 AUTHORITATIVE-RELEASE-EVIDENCE 为准。
- **证据链**：evidence-pack/manifest.json 含 gateRunId、gateManifestSha256、files 及各文件 sha256；manifest 整文件 SHA256 与 stdout 输出之 EVIDENCE-PACK-MANIFEST-SHA256 一致即验收通过。
- **生成/更新本记录**：执行 `npm run p10:gate` 保存完整输出后，可运行 `node scripts/ci/finalize-release-record.mjs [输出文件路径]` 生成或更新发布记录文档；日常以 AUTHORITATIVE-RELEASE-EVIDENCE 为权威证据入口。

---

## 10) 发布与运维（原 RELEASE-AND-OPS 已合并）

**前提**：P0–P10 已达 Engineering-Complete，`npm run p10:gate` exit 0。

### 10.1 发布与后续（原 RELEASE-AND-POST-LAUNCH）

- **仅本地交付**：以 p10:gate + 根 RELEASE_CHECKLIST_P10 签字为准，无需 GitHub tag/release。
- **路径 A（可选）**：正式 tag/release 时 — RELEASE_CHECKLIST_P10 签字 → 定版号、CHANGELOG → `git tag -a v1.0.0 -m "..."` → 创建 Release、可附 evidence-pack → 归档 evidence-pack 与签字清单。
- **路径 B：多网络与前端 P11–P20**：目标链配置（hardhat.config + scripts/config）→ 按本 runbook 部署并导出 deployments/\<chainId\>.json → Security Gate（MODE=real 时 B1–B4/R1 强制）→ 多链 evidence-pack（CHAIN_ID=… EVIDENCE_PACK_DIR=… generate-evidence-pack）。前端 P11–P20 与 project-upgrade/11 对应，按需执行。

### 10.2 双模式 Mock ↔ Real（原 DUAL_MODE_OPERATION）

- **本地优先**：默认 **MODE=mock**；本地门禁与演示在 localhost(31337) 完整可测可跑可留证；MODE=real 不得成为本地门禁前置。
- **原则**：未设 MODE 时按 mock；`npm run p10:gate` 仅依赖 mock；所有 deploy/governance/security-gate 仅通过 **loadProfile(chainId)** 取配置。
- **配置**：`configs/profiles/mock/profile.json`、`configs/profiles/real/profile.json`；唯一读取 `scripts/config/loadProfile.ts`。
- **命令**：本地门禁 `npm run p10:gate`；部署 `npm run deploy:localhost`、`npm run deploy:p9`；演示闭环 `npm run scenario:crash50-demo`。real 部署/门禁不参与本地验收。
- **安全门禁**：mock/local 允许 B4/R1 Skip；real/mainnet/L2 强制 B4、R1。

### 10.3 P8 清算机器人与测试（原 P8-liquidation-bot-and-tests）

- **清算机器人**：`scripts/run-liquidation-bot.ts`。运行：`npx hardhat run scripts/run-liquidation-bot.ts`（或先起链并 deploy:localhost 后改脚本连本地 RPC）。验收：退出码 0，链上债务减少、清算人获得抵押+bonus。
- **不变量测试**：`test/invariants/invariants.ts`；`npm test` 或 `npx hardhat test --grep "Invariants"`。
- **Fuzz**：`test/fuzz/fuzz.ts`，`FUZZ_ITERATIONS` 控制迭代；`npm test` 或 `--grep "Fuzz"`。
- **场景**：Partial Liquidation 已覆盖；Crash 50% 可预言机调价 + 清算脚本复现。
