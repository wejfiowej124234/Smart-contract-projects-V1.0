# 入门：区块链、Solidity 与 DeFi 借贷

> 零基础必读：区块链与智能合约概念、Solidity 要点、DeFi 借贷与 LTV。实现与验收见 [项目总览架构](项目总览架构.md)。

---

## 1. 区块链与智能合约

- **区块链**：公共账本、去中心化、不可篡改、透明；读链（Provider）= 查状态不花 gas，写链（Signer）= 发交易改状态要确认。
- **智能合约**：部署在链上的自动执行代码；代码即规则，无人工仲裁。
- **本项目**：用户通过钱包与前端与合约交互；合约发出事件，前端监听后刷新 UI。

---

## 2. Solidity 要点（本项目用到的）

- **合约组成**：状态变量、函数（view/pure 只读、写函数改状态）、修饰器（require 检查）、事件（emit）、继承（OpenZeppelin：Ownable、Pausable、ReentrancyGuard、SafeERC20）。
- **执行流程**：用户签名 → 广播交易 → 合约执行（require 检查）→ 改状态 + emit 事件 → 确认。
- **版本**：`pragma solidity ^0.8.19`；本项目合约见 [项目总览架构](项目总览架构.md) §4。

---

## 3. DeFi 借贷与 LTV

- **DeFi 借贷**：无银行中介，抵押品锁在合约里，按规则借还；利率由算法/利用率决定。
- **单币种借贷**：同一 token（本项目 USD8）既作抵押又作借出资产。
- **LTV（Loan-to-Value）**：最大可借 = 抵押×比例。本项目 **LTV=75%**：
  - **Borrow**：`userBorrow + amount ≤ userSupply × 75%`
  - **Withdraw**：取款后 `borrowed ≤ newSupply × 75%`，否则 revert。
- **健康因子**：maxBorrowable/borrowed，用于前端展示风险；borrowed=0 时显示 No debt。

---

## 4. 一张图：本项目四动作

- **Supply**：用户 approve → 合约 transferFrom → 更新 userSupply/totalSupply。
- **Borrow**：合约检查 LTV 与流动性 → transfer 给用户 → 更新 userBorrow。
- **Repay**：用户 approve → 合约 transferFrom → 更新 userBorrow。
- **Withdraw**：合约检查健康（取款后仍满足 LTV）→ transfer 给用户。

---

## 5. 本项目 v1.0 范围（与总览对齐）

当前仓库为 **v1.0 升级版借贷协议**，除上述四动作外还包括：**代理升级**、**预言机**（价格）、**清算**、**Treasury**、**治理**（Governor + Timelock + 提案/投票）、**紧急暂停**；前端含 Dashboard / Governance / Markets / Activity / Settings / Diagnostics / Admin。  
完整业务范围、合约模块与前端路由见 [项目总览架构](项目总览架构.md) §3、§4、§5。

下一步：看图解 [01-图解与核心概念](01-图解与核心概念-交易与approve与LTV.md)，再动手 [04-动手实验](04-动手实验.md)。学习顺序见 [06-目录与导航](06-目录与导航-学习与面试从哪里开始.md)。
