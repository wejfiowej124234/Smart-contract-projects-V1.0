# 面试技术视频讲稿（可照读，7–10 分钟）

> 建议录制方式：
> - 镜头：你本人 + 屏幕共享
> - 屏幕：左边幻灯片，右边 VS Code / 浏览器
> - 节奏：每页 20–40 秒，不要超过 10 分钟

---

## 0:00–0:20 开场

“Hi, I’m XXX. 今天我用 7–10 分钟演示一个可复现的 Web3 full-stack coding test 项目：Hardhat + Solidity 合约 + React/TypeScript 前端 + ethers v6。重点是完整交易闭环以及工程可靠性。”

---

## 0:20–1:00 电梯版概述

“这个项目是单币种借贷 demo：用户存入 USD8，按 LTV=75% 借出 USD8。borrow 和 withdraw 都由合约硬约束，超限会 revert。前端支持 MetaMask 自动切链 31337，交易状态机展示 pending/confirmed/failed，并用 confirmed + events 实现实时刷新。”

---

## 1:00–2:00 架构图（重点讲设计）

“我先从架构讲起：左边是 Hardhat 工程，包含 contracts、deploy 脚本与 tests。deploy 脚本会一键部署、seed 测试账户，并导出 ABI 和地址到前端。右边是 React 前端，读写分离：provider 做读模型、signer 做写模型。钱包交互走 MetaMask（EIP-1193）。链上状态变化通过事件驱动刷新，同时保留小的兜底机制。”

---

## 2:00–3:00 合约（规则与安全）

“合约核心就是两条规则：LTV=75%，borrow 不得超过 maxBorrow；withdraw 后仓位仍要健康，否则直接 revert。安全上，我加了 ReentrancyGuard、Pausable/Ownable 与 SafeERC20 作为 baseline hardening。并明确 scope：不做预言机/清算/多资产，保持题面范围。”

---

## 3:00–4:30 前端（可靠性是亮点）

“前端最大工程点是可靠性：交易不是发出去就完事，而是一个生命周期。我们用状态机管理 signing/pending/confirmed/failed/stuck，并处理用户拒绝、pending 很久、replacement（加速）以及 RPC 读延迟。刷新策略三层：confirmed 后强制 refresh；事件监听是主路径；再加一个节流 block listener + 小区间 backfill 做兜底，避免演示翻车。”

---

## 4:30–5:30 Approve 与错误处理

“Supply/Repay 都需要 ERC20 allowance。前端会先读 allowance，够就跳过，不够再 approve。支持 exact/infinite 两种模式，并用 approve(0)->approve(amount) 兼容 USDT 风格。错误处理做了归一化：用户拒绝、合约 revert、网络/RPC 超时等，保证 UI 能讲清楚发生了什么。”

---

## 5:30–6:30 测试与可复现

“测试上用集成测试覆盖完整闭环，并且验证两类关键 revert（超额借款、取款不健康）。同时提供 smoke:e2e 脚本，在 UI 不稳时可以一键跑链上闭环作为证据。”

---

## 6:30–结束 现场 demo（如果你要录屏操作）

“接下来我按顺序演示：Connect → Supply（approve）→ Borrow → Repay（approve）→ Withdraw。每一步都能看到 tx 状态与自动刷新。如果 MetaMask 临场出问题，我会用 `npm run smoke:e2e` 直接跑闭环输出作为 backup。”

---

## 收尾

“以上是项目的架构、关键设计与演示策略。欢迎继续 deep dive：合约安全、前端交易可靠性、或事件驱动刷新机制。”
