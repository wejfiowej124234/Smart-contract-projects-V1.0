# Coding Test Assignment - Web3 engineer：验收清单（Checklist）

> 按“必须交付 / 明确边界（不要求）/ 加分项”三块整理，逐项对照打勾即可。

## ✅ 一、必须交付（验收项）— 做不到就不算完成

### A. 技术栈边界（硬性）

- [ ] 前端必须使用 React
- [ ] 前端必须使用 TypeScript
- [ ] 前端合约交互必须使用 ethers.js v6
- [ ] 智能合约语言：Solidity（0.8.19），并使用 Hardhat 本地链部署

> 以上是题面写死的 Required Tech Stack / Hardhat Setup。

### B. 合约搭建与部署（Part 1 Mandatory）

- [ ] Hardhat 项目已建立，并包含提供的合约文件（TestToken.sol、SimpleLending.sol）
- [ ] 能在本地 Hardhat network 跑起来（默认 chainId 31337）
- [ ] 部署脚本要求：
  - [ ] 部署 USD8 与 WETH 测试代币
  - [ ] 部署 SimpleLending 合约
  - [ ] 为测试账户分发初始代币（seed）
- [ ] 导出 ABI 与地址供前端使用

### C. 前端：钱包与网络（Part 2 Mandatory）

- [ ] 前端可通过 MetaMask 连接钱包（ethers v6 BrowserProvider + signer）
- [ ] 自动网络切换到：
  - [ ] 本地 Hardhat（chainId: 31337）或你选择的 EVM testnet
- [ ] 连接状态持久化（刷新页面后仍能显示已连接账号/网络）
- [ ] UI 必须展示：
  - [ ] Connected account（地址）
  - [ ] Network（链/chainId）

### D. 前端：代币交互（Part 2 Mandatory）

- [ ] 展示用户 USD8 余额
- [ ] 展示用户 WETH 余额
- [ ] Supply 之前必须实现 Approve 流程
- [ ] UI 必须展示“对 lending 合约的授权状态”（allowance 是否足够）

### E. 前端：Lending Dashboard 展示项（Part 2 Mandatory）

必须能从合约读到并展示：

池子（Pool）
- [ ] total supply
- [ ] total borrow
- [ ] utilization rate
- [ ] supply rate
- [ ] borrow rate

用户（User Position）
- [ ] supplied amount
- [ ] borrowed amount
- [ ] health factor（必须颜色编码显示）
- [ ] maximum withdrawable amount
- [ ] maximum borrowable amount

### F. 前端：交易功能（Part 2 Mandatory）

必须能发起并成功完成这些交易（并可在 UI 上看到结果变化）：

- [ ] Supply：存入 USD8（必须带 approve 检查）
- [ ] Withdraw：提取 USD8（必须健康因子检查 / 或失败提示）
- [ ] Borrow：借出 USD8（必须健康因子 + 流动性检查 / 或失败提示）
- [ ] Repay：偿还 USD8

### G. 实时更新与交易状态（Part 2 Mandatory）

- [ ] 每次交易后：余额和仓位数据都会更新
- [ ] 通过合约事件监听更新 UI（Supplied/Withdrawn/Borrowed/Repaid）
- [ ] UI 必须展示交易状态：
  - [ ] pending
  - [ ] confirmed
  - [ ] failed

### H. 交付物（Deliverables Mandatory）

- [ ] 一个完整 GitHub Repo（合约 + 部署脚本 + 前端）
- [ ] README 必须包含：
  - [ ] 如何运行本地节点
  - [ ] 如何部署合约
  - [ ] 如何启动前端
  - [ ] 合约地址（如果上 testnet）
  - [ ] 假设/架构决策列表（Assumptions / Decisions）

## ⭐ 二、加分项（Bonus，可选）

- [ ] 至少 2 个合约交互集成测试（Hardhat test）
- [ ] 更完善的错误处理（4 类）：
  - [ ] 余额不足
  - [ ] allowance 不足
  - [ ] health factor 违规
  - [ ] 网络错误 / RPC 错误
- [ ] 所有异步操作都有 loading 状态
- [ ] 可选：部署到 testnet + 前端上 Vercel/Netlify（并提供演示）

## ✅ 最严格的“验收方式”（交付前自检顺序）

- [ ] hardhat node 能跑
- [ ] deploy script 一键部署成功，并生成 ABI+地址文件
- [ ] 打开前端：MetaMask 能连上 + 自动切到 31337
- [ ] 页面显示：USD8/WETH 余额正确
- [ ] 点 Supply：会先提示/执行 approve，然后 supply 成功
- [ ] Borrow/Repay/Withdraw 都能跑通（失败时 UI 给出合理提示）
- [ ] 每次 tx：UI 显示 pending→confirmed/failed，并在确认后数据自动更新（事件监听触发刷新）
- [ ] README：新机器照着步骤能复现
