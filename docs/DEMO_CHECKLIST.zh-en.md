# Demo Checklist（演示流程 / Demo Walkthrough）

> CN：这是一页“演示操作说明书”。按顺序执行并截图即可。
>
> EN: This is a one-page demo runbook. Follow in order; screenshots are optional.

---

## 1) 启动项目 / Start Project

**EN (commands)**

```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

cd frontend
npm run dev
```

**CN（说明）**
- 启动本地 Hardhat 链（31337）
- 部署合约并导出 ABI/地址到前端
- 启动前端开发服务器

---

## 2) 连接钱包 / Connect Wallet

**操作 / Action**
- 打开前端页面
- 点击 **Connect MetaMask**

**期望结果 / Expected**
- 自动切换到 Hardhat 网络（chainId `31337`），必要时自动添加网络
- 页面显示当前账户地址（Account）与 chainId
- 若网络错误：出现 **Wrong network** 提示，并且交易按钮禁用

---

## 3) 仪表盘加载 / Dashboard Loaded

**你应该看到 / You should see**
- USD8 / WETH balances
- Pool stats: totalSupply / totalBorrow / utilization / rates
- User position: supplied / borrowed / healthFactor（颜色编码）
- maxBorrow / maxWithdraw

---

## 4) Supply（含 Approve）/ Supply (with Approve)

**操作 / Action**
- 在 Supply 输入数量（例如 `10`）
- 如果 allowance 不足：UI 会显示 `Needs approve`（同时展示 allowance 数值）
- 点击 **Supply**（内部流程：approve-if-needed → supply）

**期望结果 / Expected**
- Tx 状态显示：`signing → pending → confirmed`（含 hash）
- confirmed 后 dashboard 自动更新（余额/仓位变化）

---

## 5) Borrow / Repay / Withdraw

**操作 / Action**
- Borrow：输入数量并点击 **Borrow**
- Repay：输入数量并点击 **Repay**（同样会 approve-if-needed）
- Withdraw：输入数量并点击 **Withdraw**

**期望结果 / Expected**
- 每笔交易都有 tx 状态（pending/confirmed/failed）
- healthFactor 随借贷变化
- UI 自动刷新（confirmed + events），无需手动刷新

---

## 6) 实时更新机制（Mandatory + 兜底）/ Real-time Updates (Mandatory + Fail-safe)

**本项目三层刷新 / Three-layer refresh**
1) Tx confirmed → refresh（`tx.wait()` 之后强制刷新）
2) Contract events → refresh（监听 `Supplied/Withdrawn/Borrowed/Repaid`，Mandatory）
3) Block listener fail-safe → refresh（可选兜底：`provider.on('block')`，约 3 秒节流）

**目的 / Goal**
- 避免演示时出现“链上已变、UI 没刷新”的常见翻车点
- 兜底刷新不是主逻辑，不会刷爆 RPC

---

## 7) 边界说明（避免误解）/ Non-goals

**CN**
- 不做钱包私钥/助记词管理（本题只对接 MetaMask）
- 不依赖后端服务
- 不扩展合约功能（清算/预言机/多资产等不在题面范围）

**EN**
- No private key / seed phrase management (MetaMask only)
- No backend dependency
- No contract feature expansion beyond the assignment scope

---

✅ End of Demo
