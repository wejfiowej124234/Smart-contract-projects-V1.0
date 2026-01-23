# Walkthrough / 教学文档（中英双语）

> 说明 / Note
>
> - 本 `docs/` 文件夹为“教学/讲解”附加内容，不是题面交付硬要求。
> - 交付硬要求仍以根目录 README 为准（可复现即可）。

---

## 1) 项目目标 / Project Goal

**CN**：本项目演示如何使用 **Hardhat(31337) + React/TypeScript + ethers.js v6** 对接一个简单的 DeFi 借贷合约（单币种），完成：部署、连接钱包、读链仪表盘、写链交易、事件监听与交易状态展示。

**EN**: This project demonstrates how to build a small DeFi dashboard using **Hardhat (31337) + React/TypeScript + ethers.js v6**: deployment, wallet connection, read-only dashboard, write transactions, event-driven updates, and tx status.

---

## 2) 仓库结构 / Repository Structure

**CN**：
- `contracts/`：Solidity 合约（`TestToken.sol`、`SimpleLending.sol`）
- `scripts/`：部署脚本（部署 USD8/WETH/Lending + seed + 导出 ABI/地址）
- `deployments/`：部署产物（chainId → address）
- `frontend/`：前端（React + TS + ethers v6）
- `docs/`：本教学文档（可选，加分项）

**EN**:
- `contracts/`: Solidity contracts (`TestToken.sol`, `SimpleLending.sol`)
- `scripts/`: deployment scripts (deploy USD8/WETH/Lending + seed + export ABI/addresses)
- `deployments/`: deployment outputs (chainId → addresses)
- `frontend/`: frontend app (React + TS + ethers v6)
- `docs/`: optional learning/walkthrough docs

---

## 3) 如何运行 / How to Run

**CN**（从仓库根目录）：
1) 安装依赖：`npm i`
2) 启动本地链：`npx hardhat node`
3) 部署并导出：`npx hardhat run scripts/deploy.ts --network localhost`
4) 启动前端：`cd frontend && npm run dev`

**EN** (from repo root):
1) Install: `npm i`
2) Start local chain: `npx hardhat node`
3) Deploy + export: `npx hardhat run scripts/deploy.ts --network localhost`
4) Start frontend: `cd frontend && npm run dev`

---

## 4) “演示 / Demo”到底是什么？ / What does “Demo” mean here?

**CN**：题目里的 Demo 指的是：别人 clone 你的仓库 → 按 README 跑命令 → 打开网页 → 点几下操作 → 看到预期 UI 与链上交易效果。一般**不要求录视频/做 PPT/截图**。

**EN**: “Demo” means: someone clones your repo → follows the README → opens the app → clicks through flows → sees correct UI + on-chain tx behavior. Usually **no video/PPT/screenshots required**.

如果你愿意截屏（可选加分），建议截 4 张：
1) Connect 后显示 account + chainId=31337
2) Wrong network 提示 + 按钮禁用
3) Supply：Need approve → pending → confirmed
4) Borrow/Repay/Withdraw 任意一个成功 + UI 自动更新

---

## 5) 合约快速理解（面向钱包工程师）/ Contract Quick Primer (for wallet engineers)

### 5.1 TestToken（USD8/WETH）

**CN**：`TestToken` 是最简 ERC20 子集：`balanceOf/allowance/approve/transfer/transferFrom`，decimals 固定 18，构造函数给 deployer 铸造 1,000,000 * 10^18。

**EN**: `TestToken` is a minimal ERC20 subset with `balanceOf/allowance/approve/transfer/transferFrom`, fixed 18 decimals, and mints to the deployer in the constructor.

### 5.2 SimpleLending（核心）

**CN**：`SimpleLending` 是**单币种**借贷协议：同一个 token 既用于 supply 也用于 borrow（本项目选择 USD8）。

关键点：
- `LTV_RATIO = 75`：最大借款额度 = supplied * 75%
- `healthFactor`：当 borrowed=0 时为 `uint256 max`（无风险）；否则是 `(maxBorrowable * 100) / borrowed`
- 事件：`Supplied/Withdrawn/Borrowed/Repaid`（前端必须监听并刷新 UI）

**EN**: `SimpleLending` is a **single-asset** lending contract: the same token is used for supply and borrow (we use USD8 here).

Key points:
- `LTV_RATIO = 75`: max borrow = supplied * 75%
- `healthFactor`: if borrowed=0 then `uint256 max` (infinite), else `(maxBorrowable * 100) / borrowed`
- Events: `Supplied/Withdrawn/Borrowed/Repaid` (frontend listens and refreshes UI)

---

## 6) 前端架构 / Frontend Architecture

**CN**：本项目把链上交互拆成 “读模型 / 写模型”，并把错误与 tx 状态统一。

- `frontend/src/hooks/useWallet.ts`：MetaMask 连接、自动切链、持久化连接状态、监听 accountsChanged/chainChanged
- `frontend/src/hooks/useDashboard.ts`：读链：余额、pool、user position、maxBorrow/maxWithdraw；并监听合约事件触发 refresh
- `frontend/src/hooks/useActions.ts`：写链：approve(if needed) + supply/withdraw/borrow/repay；统一 tx 状态机
- `frontend/src/state/tx.ts`：tx 状态（idle/signing/pending/confirmed/failed）
- `frontend/src/state/errors.ts`：错误归一化
- `frontend/src/contracts/write.ts`：不引入 TypeChain 也能保留强类型的写接口（wrapper）

**EN**: The frontend is split into a read-model and a write-model, with unified error and tx state.

---

## 7) 数据刷新策略 / Refresh Strategy

**CN**：
1) `tx.wait()` confirmed 后 refresh（强一致）
2) 合约事件 refresh（实时更新，Mandatory）
3) 可选兜底：`provider.on('block')` 3 秒节流 refresh（防事件丢失，不作为主逻辑）

**EN**:
1) Refresh after `tx.wait()` confirmation (strong correctness)
2) Refresh on contract events (real-time, mandatory)
3) Optional fail-safe: throttled `provider.on('block')` refresh (~3s) for missed events (not the primary refresh path)

---

## 8) 常见问题 / FAQ

**Q（CN）**：我不懂合约，会不会影响面试？
**A（CN）**：不会。本题重点是“能正确对接合约 + 正确处理交易/状态/错误/刷新”。教学文档的价值在于：你能把系统讲清楚，面试官会更放心。

**Q (EN)**: I’m not a smart contract specialist. Is that a problem?
**A (EN)**: Usually no. This assignment mainly evaluates correct integration and engineering practices (tx flow, state, errors, refresh). A clear walkthrough is a plus.
