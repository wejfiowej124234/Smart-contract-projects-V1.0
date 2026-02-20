# 调试清单主手册（Debug Playbook）

**约定**：本文档为**调试清单 + 证据化回归**的主手册，与 [09-本地链标准与地址.md](../09-本地链标准与地址.md) Part 4（调试前准备与调试工作）、[10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md)、[03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8（p10:gate / evidence-pack）互补。

**使用顺序**：① 每次调试前先过 **A**；② 问题定位与回归按 **B→E** 分层；③ 每次问题用 [INCIDENT_TEMPLATE.md](INCIDENT_TEMPLATE.md) 记录。本目录入口见 [README.md](README.md)。

---


## A. 基础一致性（必须先过）

| 项 | 本仓约定 | 验收 |
|----|----------|------|
| **当前环境** | local（31337）/ testnet / mainnet-fork | 明确当前为 **local** 或 testnet；本地链即 31337 |
| **chainId 一致** | Hardhat node、MetaMask、前端 config 均为 **31337** | 前端 `frontend/src/config/network.ts` 之 LOCAL_CHAIN_ID；Hardhat `hardhat.config.ts`；MetaMask 网络 Chain ID = 31337 |
| **RPC 一致** | 前端读链、脚本、hardhat node 统一 **http://127.0.0.1:8545** | 前端通过 getRpcUrl(chainId)；脚本 `--network localhost`；不写 localhost:8545 |
| **合约地址来源唯一** | **deployments/31337.json**（部署脚本写入）；前端用 **frontend/src/contracts/deployments.json**（由 scripts/_lib/export.ts 同步） | 禁止在业务代码硬编码地址；getDeployments(chainId) 读取 |
| **前端 ABI 与合约编译一致** | ABI 来自 **frontend/src/contracts/abis.ts**，与编译产物一致；无旧 ABI | 合约升级或接口变更后需同步 ABI 与 deployments.json |
| **账户与余额** | 测试账户（如 Hardhat seed 0x7099...79C8）；ETH 与测试 token（USD8 等）充足 | deploy:localhost 会 seed；余额不足时 supply/borrow 会 revert |

**验收**：打开 **http://127.0.0.1:5173/diagnostics**，三项 Yes（Read chainId、Wallet chainId、Deployments）；或 `npm run verify:consistency` exit 0。

---

## B. 合约层（先单测，后联调）

| 项 | 命令/要点 | 验收 |
|----|------------|------|
| **单测全绿** | `npx hardhat test` 或 `npm test` | 全部通过，无 skip（除非明确标注） |
| **关键 happy path** | supply / borrow / repay / withdraw | 单元或集成测试覆盖；见 test/unit、test/integration |
| **revert 路径** | 至少：余额不足、allowance 不足、权限不足、暂停（paused） | 有对应测试或已知文档化 |
| **事件** | 前端依赖的 event 均正确 emit | 与 frontend 监听/解析一致（如 Transfer、Supply、Borrow） |

---

## C. 交易流程层（Web3 最常见故障点）

| 项 | 要点 | 验收 |
|----|------|------|
| **approve → 再执行** | 先 approve，等确认后再 supply/repay；不能抢跑 | 前端 Preflight / 流程为 Approve → 等待 → 主操作 |
| **allowance / decimals** | 统一 BigInt、parseUnits、formatUnits；避免精度与溢出 | 与合约 decimals 一致（如 8、18） |
| **gas / 估算失败** | estimateGas 失败时给出可解释提示（如 insufficient liquidity、revert reason） | 不暴露裸 revert 给用户；见 10-TROUBLESHOOTING |
| **错误解析** | 能区分 user rejected / revert / rpc error | 前端 tx 状态：rejected、failed、success；RPC 错误见 Part 2 §5 |

---

## D. 前端状态层（React）

| 项 | 要点 | 验收 |
|----|------|------|
| **provider/signer 时机** | 获取时机正确，避免页面加载即弹窗 | 按需连接钱包；避免 useEffect 空依赖即请求账户 |
| **useEffect 依赖** | 依赖正确，避免死循环或漏刷新 | 链/账户/部署变更后刷新余额与仓位 |
| **状态齐全** | loading / pending / success / failed | 与 TxStatus、PreflightModal、Toast 等一致 |
| **错误边界** | ErrorBoundary + 可操作提示 | 不白屏；可复现路径可记录到 INCIDENT_TEMPLATE |
| **数据刷新** | tx confirmed 后刷新余额、仓位、health factor | 不依赖仅定时轮询；关键路径以事件/确认驱动 |

---

## E. E2E 与回归（企业级门禁）

| 项 | 本仓约定 | 验收 |
|----|----------|------|
| **门禁** | **`npm run p10:gate`**（端口 8545 空闲下必须 exit 0） | 含起链 → deploy:localhost → deploy:p9 → governance → **e2e:core**（默认）→ evidence-pack |
| **E2E 层级** | smoke → core-flow → full（e2e:ui）；p10:gate 默认 e2e:core；全量 E2E 为 `E2E_TIER=nightly` 或 `npm run p10:gate -- --full` | 见 [11-FULL-LINK-TEST-CHECKLIST.md](../11-FULL-LINK-TEST-CHECKLIST.md) §0.1 |
| **Playwright** | 关键用例：连接钱包、切链、四大操作（Supply/Borrow/Repay/Withdraw）、事件/UI 更新 | e2e/ 下 spec；状态轮询见 e2e/fixtures.ts |
| **证据包** | **evidence-pack/**：manifest.json、evidence-summary.json、deployments-31337.json、p10-gate-output.txt；控制台输出 **EVIDENCE-PACK-MANIFEST-SHA256** | 见 [03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8、[04-AUTHORITATIVE-RELEASE-EVIDENCE.md](../04-AUTHORITATIVE-RELEASE-EVIDENCE.md) |

**可选**：E2E 专项清单见 [CHECKLIST_E2E.md](CHECKLIST_E2E.md)。

---

## 与本目录及 docs 关系

| 文档 | 用途 |
|------|------|
| [README.md](README.md) | 本目录入口与阅读顺序 |
| [INCIDENT_TEMPLATE.md](INCIDENT_TEMPLATE.md) | 每次 bug 的**证据化记录模板**（现象、环境、复现、证据、根因、修复、回归） |
| [CHECKLIST_E2E.md](CHECKLIST_E2E.md) | E2E 专项打勾（对应本节 §E） |
| [09-本地链标准与地址.md](../09-本地链标准与地址.md) Part 4 | 调试**前**准备与问题发生时的**调试工作**顺序 |
| [10-TROUBLESHOOTING-AND-LIMITATIONS.md](../10-TROUBLESHOOTING-AND-LIMITATIONS.md) | 已知限制、CreateFileMapping、本地 Gas 与卡住 |
| [08-DEMO-RUNBOOK-LOCAL.md](../08-DEMO-RUNBOOK-LOCAL.md) | 起链、部署、前端、手测步骤 |
| [11-FULL-LINK-TEST-CHECKLIST.md](../11-FULL-LINK-TEST-CHECKLIST.md) | 全链路手测与 E2E 层级、门禁执行流 |
| [03-08-deployment-runbook.md](../03-08-deployment-runbook.md) §8 | 门禁与 evidence-pack 定义 |
