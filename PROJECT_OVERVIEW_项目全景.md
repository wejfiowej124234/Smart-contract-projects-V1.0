# 项目全景 — 全方位了解

本文档从**考试题来源、技术栈、目录结构、合约、前端、脚本、测试、文档与面试材料**等维度，对本地项目做一次性梳理，便于后续任何修改或讲解都基于同一份认知。

---

## 一、项目定位与来源

- **性质**：Web3 全栈 Coding Test 实现（面试官给的考试题）。
- **考试题文件**：根目录 `Coding Test Assignment - Web3 engineer.pdf`（或 `docs/CODING_TEST_ASSIGNMENT.txt` 文本版）。
- **要求概要**：
  - **Part 1（必做）**：Hardhat 项目、部署 USD8/WETH/SimpleLending、seed 测试账户、导出 ABI 与地址给前端。
  - **Part 2（必做）**：React + TypeScript + ethers v6 前端，MetaMask 连接、自动切链 31337、展示余额/池子/用户仓位、Supply/Withdraw/Borrow/Repay、Approval 流程、交易状态（pending/confirmed/failed）、事件监听并更新 UI。
  - **Part 3（加分）**：至少 2 个集成测试、错误处理（余额/allowance/健康因子/网络）、异步 loading 状态。
- **本仓库**：严格按上述要求实现，并增加企业级加固（交易状态机、三层刷新、安全组件、可复现流水线等），用于面试演示与录屏讲解。

---

## 二、技术栈（与考试题一致 + 工具链）

| 层级 | 技术 | 说明 |
|------|------|------|
| 链/节点 | Hardhat 本地链 | chainId 31337，RPC `http://127.0.0.1:8545` |
| 合约 | Solidity 0.8.19 | 合约在 `contracts/`，OpenZeppelin 安全库 |
| 部署/脚本 | Hardhat + TypeScript | `scripts/deploy.ts`，`scripts/_lib/export.ts` |
| 前端 | React + TypeScript + Vite | `frontend/`，ethers v6（BrowserProvider + Contract） |
| 测试 | Hardhat + Mocha/Chai | `test/SimpleLending.integration.ts` |
| 幻灯片/讲稿 | Marp (Markdown→HTML/PDF) | `slides/`，中文 PDF + 逐页演讲稿 |

---

## 三、目录结构（核心部分）

```
Smart contract projects/
├── contracts/                    # 智能合约
│   ├── SimpleLending.sol         # 单币种借贷协议（USD8），LTV 75%，事件 Supplied/Withdrawn/Borrowed/Repaid
│   └── TestToken.sol             # 最小 ERC20（USD8、WETH 测试代币）
├── scripts/
│   ├── deploy.ts                 # 一键部署 USD8、WETH、SimpleLending + seed + 导出
│   ├── _lib/
│   │   ├── export.ts             # 写 deployments/*.json、frontend 的 deployments.json 与 abis/*.json
│   │   └── fs.ts                 # 写 JSON 的 fs 封装
│   ├── smoke-e2e.mjs             # E2E 烟雾测试：起节点→部署→执行 approve→supply→borrow→repay→withdraw
│   └── generate-pdf*.{ps1,mjs,bat}  # 幻灯片 PDF 生成（可选）
├── deployments/
│   └── 31337.json                # 当前链部署结果：chainId, usd8Address, wethAddress, simpleLendingAddress
├── frontend/
│   └── src/
│       ├── abis/                 # 从部署脚本导出的 ABI（TestToken.json, SimpleLending.json）
│       ├── config/              # network.ts（链配置）, runtime.ts（确认数、超时、backfill 块数等）
│       ├── contracts/            # deployments.json、deployments.ts、contracts.ts、write.ts、abis.ts
│       ├── hooks/                # useWallet、useDashboard、useActions、useAllowance、useTokenMetadata
│       ├── state/                # tx.ts（交易状态机）、txStore.ts、errors.ts
│       ├── utils/                # amount.ts、format.ts、assert.ts
│       ├── components/          # ErrorBoundary 等
│       ├── types/                # ethereum.d.ts（EIP-1193）
│       ├── App.tsx               # 主界面：连接、仪表盘、Supply/Withdraw/Borrow/Repay、交易状态
│       └── main.tsx
├── test/
│   └── SimpleLending.integration.ts  # 集成测试：闭环 + 超借 revert + 不健康取款 revert
├── docs/                         # 需求映射、walkthrough、生产级路线图等
├── learning/                     # 中文学习与面试材料（零基础到面试话术）
├── slides/                       # 面试用 PDF 与逐页讲稿
│   ├── INTERVIEW_DECK.zh-cn.md   # 中文幻灯片源
│   ├── INTERVIEW_DECK.en.md      # 英文幻灯片源
│   ├── VIDEO_SCRIPT_逐页版.md    # 录制用逐页演讲稿（与 PDF 页码对应）
│   ├── assets/*.svg              # 架构图、LTV、流水线、刷新策略、状态机等
│   └── dist/                     # 生成的 HTML/PDF（如 INTERVIEW_DECK.zh-cn.html 等）
├── hardhat.config.ts             # Solidity 0.8.19，localhost 31337
├── package.json                  # 根脚本：compile、node、deploy:localhost、test、smoke:e2e、ci:local、slides:* 等
└── README.md                     # 复现步骤、自检清单、企业加固说明
```

---

## 四、合约（业务与安全）

### 4.1 TestToken.sol

- 最小 ERC20：`balanceOf`、`allowance`、`approve`、`transfer`、`transferFrom`，decimals=18，构造函数给 deployer 铸 1_000_000 * 10^18。
- 用途：部署为 USD8 和 WETH，USD8 参与借贷，WETH 仅前端展示余额。

### 4.2 SimpleLending.sol

- **单币种**：仅绑定一个 token（本项目为 USD8）。
- **常量**：`LTV_RATIO = 75`（75%），`LIQUIDATION_THRESHOLD = 80`，`BASE_RATE`、`UTILIZATION_MULTIPLIER` 用于利率。
- **状态**：`totalSupply`、`totalBorrow`、`utilizationRate`、`supplyRate`、`borrowRate`；每用户 `userSupply`、`userBorrow`，以及 `positions`（含 healthFactor 等）。
- **写函数**（均为 whenNotPaused、nonReentrant，且用 SafeERC20）：
  - `supply(amount)`：transferFrom 用户→合约，更新 userSupply/totalSupply，发 Supplied。
  - `withdraw(amount)`：检查取款后仍满足 LTV（健康），再 transfer 合约→用户，发 Withdrawn。
  - `borrow(amount)`：检查流动性 + 不超过 LTV 借款上限，transfer 合约→用户，发 Borrowed。
  - `repay(amount)`：transferFrom 用户→合约，减少 userBorrow/totalBorrow，发 Repaid。
- **视图**：`getUserPosition`、`getPoolInfo`、`calculateMaxWithdraw`、`calculateMaxBorrow`。
- **安全**：Ownable、Pausable、ReentrancyGuard、SafeERC20；无预言机、清算、多资产（刻意不做）。

---

## 五、前端（读写分离与交易状态机）

### 5.1 钱包与网络

- **useWallet.ts**：EIP-1193（MetaMask），连接后自动切链到 `deployments.chainId`（31337），支持 `wallet_switchEthereumChain` 与 4902 时 `wallet_addEthereumChain`，连接状态持久化（如 localStorage），监听 account/chain 变化。
- **config/network.ts**：预期 chainId、RPC URL、是否自动添加链等（可从 env 读）。

### 5.2 读模型（Dashboard）

- **useDashboard.ts**：provider + view 调用，拉取 USD8/WETH 余额、getPoolInfo、getUserPosition、calculateMaxWithdraw、calculateMaxBorrow；暴露 `refresh()`。
- **刷新策略（三层）**：
  1. **Tx 确认后强制刷新**：`onConfirmed` 回调里调 `refresh()`（满足“交易后更新”）。
  2. **事件监听**：监听合约 Supplied/Withdrawn/Borrowed/Repaid，收到后 `refresh()`（满足“Listen for contract events and update UI”）。
  3. **兜底**：节流 `provider.on("block")` + 小范围 `queryFilter` 历史事件（EVENT_BACKFILL_MAX_BLOCKS=2000），防止事件丢失导致 UI 不更新。
- **config/runtime.ts**：TX_CONFIRMATIONS、TX_PENDING_TIMEOUT_MS、POST_STATE_MAX_WAIT_MS、EVENT_BACKFILL_MAX_BLOCKS。

### 5.3 写模型（交易流）

- **useActions.ts**：approve（exact/infinite，可选 USDT 风格 approve(0)→approve(amount)）、supply、withdraw、borrow、repay；内部用 `runTxDetailed`，在确认后调用 `onConfirmed` 触发 dashboard 刷新。
- **state/tx.ts**：交易状态机 `idle → signing → pending → stuck/confirmed/failed`，支持超时、replacement（TRANSACTION_REPLACED）、post-state 校验（best-effort）。
- **state/txStore.ts**：持久化 pending tx（如 chainId+account+hash），用于刷新页面后恢复 pending 状态。
- **state/errors.ts**：归一化错误（UserRejected、Revert、Rpc 等），便于 UI 展示。

### 5.4 其他

- **useAllowance.ts**：查询用户对 lending 合约的 allowance，供 Supply/Repay 前判断是否需要 approve。
- **utils/amount.ts**：严格 decimal 解析、bigint 一以贯之，避免 number 精度问题；Max(safe) 使用 maxBorrow/maxWithdraw 减 1 wei 等保守策略。
- **contracts/write.ts**：基于 signer 的 Contract 实例（写用）；contracts/contracts.ts 基于 provider（读用）。

---

## 六、部署与导出流程

1. **启动链**：`npx hardhat node`（默认 127.0.0.1:8545，chainId 31337）。
2. **部署**：`npx hardhat run scripts/deploy.ts --network localhost`。
   - 部署 TestToken("USD8","USD8")、TestToken("Wrapped Ether","WETH")、SimpleLending(usd8Address)。
   - 对前 N 个 signer 及可选 `SEED_ADDRESS` 做 seed（USD8/WETH 转账 + 可选 ETH 用于 gas）。
   - 调用 `exportArtifacts`：写 `deployments/31337.json`、`frontend/src/contracts/deployments.json`、`frontend/src/abis/TestToken.json`、`frontend/src/abis/SimpleLending.json`。
3. **前端**：`cd frontend && npm run dev`（默认 Vite 5173），读取 `deployments.json` 与 abis，连接 MetaMask 并自动切到 31337。

---

## 七、测试与 CI

- **test/SimpleLending.integration.ts**：Hardhat + ethers v6，部署 TestToken + SimpleLending，测：
  - 完整闭环：approve → supply → borrow → repay → withdraw，并校验最终 position 归零。
  - 超借 revert（Exceeds borrowing limit）。
  - 不健康取款 revert（Withdrawal would make position unhealthy）。
- **scripts/smoke-e2e.mjs**：若本地无节点则起 Hardhat node，执行 deploy，再用导出的 ABI/地址跑一遍 approve→supply→borrow→repay→withdraw（脚本化，不依赖浏览器）。
- **package.json**：`npm run test`（合约测试），`npm run smoke:e2e`，`npm run ci:local`（compile + test + frontend lint + build）。

---

## 八、文档与面试材料

- **docs/ASSESSMENT_MAPPING.md**：考试题每一条要求与本仓库实现的对应关系及证据文件。
- **docs/WALKTHROUGH.zh-en.md**、**docs/PRODUCTION_GRADE_ROADMAP.md**、**docs/ENGINEERING_RATIONALE.zh-cn.md** 等：walkthrough、范围边界、工程取舍。
- **README_CODING_TEST_CHECKLIST.md**：按题面逐项自检清单。
- **CODING_TEST_PITFALLS_AND_OPTIMIZATIONS.md**：常见坑与在“不越界”前提下的优化建议。
- **learning/**：从零基础到面试的系列中文笔记（合约、前端、部署、测试、面试话术、证据点、图解等）。
- **slides/**：
  - **INTERVIEW_DECK.zh-cn.md / .en.md**：面试用幻灯片（架构、LTV、状态机、刷新策略、安全、流水线等）。
  - **VIDEO_SCRIPT_逐页版.md**：与 PDF 页码一一对应的中文讲稿，用于录制“按页讲解项目”；内容已按考试题对齐并强调金融级表述。
  - **录制视频使用指南.md**、**考试题对齐检查报告.md**：录制与对齐说明。

---

## 九、常用命令速查

| 目的 | 命令 |
|------|------|
| 安装依赖 | `npm ci`（根目录）；`cd frontend && npm ci` |
| 编译合约 | `npx hardhat compile` |
| 启动本地链 | `npx hardhat node` |
| 部署并导出 | `npx hardhat run scripts/deploy.ts --network localhost` |
| 跑合约测试 | `npm run test` |
| 跑 E2E 烟雾 | `npm run smoke:e2e` |
| 本地 CI（编译+测试+前端 lint+build） | `npm run ci:local` |
| 启动前端 | `cd frontend && npm run dev` |
| 生成中文幻灯片 HTML | `npm run slides:html` |
| 生成中文幻灯片 PDF | `npm run slides:pdf`（依赖 Marp CLI，可能需本机 Puppeteer） |

---

## 十、面试/录屏时如何一句话串起来

- **项目**：按考试题 `Coding Test Assignment - Web3 engineer.pdf` 实现的 DeFi 借贷仪表盘；技术栈 Hardhat + Solidity + React + TypeScript + ethers v6，本地链 31337。
- **合约**：单币种（USD8），LTV 75%，Supply/Withdraw/Borrow/Repay，事件驱动；安全用 ReentrancyGuard、Pausable、Ownable、SafeERC20。
- **前端**：读写在架构上分离（provider 读 / signer 写）；交易状态机（idle→signing→pending→confirmed/failed）；三层刷新（确认后刷新 + 事件监听 + 节流+backfill 兜底）；approve-if-needed、错误归一化、金额 bigint 安全。
- **交付**：一键部署+seed+导出、集成测试覆盖闭环与关键 revert、smoke-e2e 脚本、README 复现步骤、slides 与逐页讲稿用于录屏讲解。

如果你之后要改某一块（例如只改演讲稿、只改合约注释、只加一个前端按钮），可以说“基于 PROJECT_OVERVIEW_项目全景.md 的哪一节”来限定范围，我可以按该全景做针对性修改。
