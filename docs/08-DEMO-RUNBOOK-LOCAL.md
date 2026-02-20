# 本地可演示链路 Runbook（Local-Only）

**目标**：本地启动链 + 部署 + 前端，用浏览器 + MetaMask 完成全功能手测闭环。  
**推断依据**：`package.json` 脚本、`frontend/vite.config.ts`（未覆盖 port）、`hardhat.config.ts`、`scripts/demo/*.mjs`。

---

## 1. 环境与端口

| 项 | 值 |
|----|-----|
| 本地链 RPC | `http://127.0.0.1:8545` |
| Chain ID | `31337`（Hardhat 默认） |
| 前端本地地址 | `http://127.0.0.1:5173`（Vite 默认，`vite.config.ts` 中 server.port 5173、host 127.0.0.1） |

---

## 2. 启动本地链

**方式 A（推荐）**：一键起链（阻塞，保持运行）

```bash
npm run demo:chain
```

- 实际执行：`node scripts/demo/start-local-chain.mjs`
- 行为：`npx hardhat node`，等待 `eth_chainId === 0x7a69` 后打印就绪；需保持该终端运行。

**方式 B**：手动起链

```bash
npx hardhat node
```

- 默认监听 `127.0.0.1:8545`（见 `hardhat.config.ts` networks.localhost）。

**证据**：终端出现 `Local chain ready at http://127.0.0.1:8545 (chainId 31337)...` 或 Hardhat 账户列表即表示链已就绪。

---

## 3. 部署并导出（含 P9）

**方式 A（一键门禁，推荐用于验收）**  
确保端口 8545 未被占用，然后：

```bash
npm run p10:gate
```

- 会起链、执行 p10:ci（deploy:localhost → deploy:p9 → governance 全流程 → e2e:ui）、生成 evidence-pack，exit 0 即全通过。
- **E2E 前置**：首次运行或报 `Executable doesn't exist ... chromium_headless_shell` 时，请先执行 `npx playwright install chromium`（脚本内也会自动尝试安装）。
- 若 8545 已被占用，门禁会检测到并 exit 1，不覆盖已有链。

**方式 B（分步，用于演示/调试）**  
链已在另一终端运行于 8545 时：

```bash
# 1) 部署 P0–P8
npm run deploy:localhost

# 2) 部署 P9 + 治理（按需）
npm run deploy:p9
# 可选：governance:transfer-admin, first-proposal, verify-p9, verify-guardian, second-proposal-setlt, proxy-upgrade-drill

# 3) 导出到前端（若脚本会写 frontend 的 deployments）
# 仓库中 deploy 脚本会写 deployments/<chainId>.json；需同步到 frontend 的 deployments（见 scripts/_lib/export.ts / 部署文档）。通常 p10:ci 或 release 脚本会拷贝/生成 frontend/src/contracts/deployments.json。
```

- 本地演示若已有 `frontend/src/contracts/deployments.json` 含 31337，可跳过导出；否则需用仓库约定的方式把 `deployments/31337.json` 同步到前端的 `deployments.json`（或多链 key `31337`）。

---

## 4. 启动前端

**实际命令（由 package.json 推断）**  
`npm run demo:frontend` 当前解析为**最后一条** `demo:frontend`，即：

```bash
cd frontend && npm run dev
```

- 即直接在前端目录执行 `npm run dev`（Vite），**不会**注入 `VITE_LOCAL_RPC_URL`。

**推荐**：若需前端连接本地链 8545，有两种方式：

1. **显式用 demo 脚本（注入 RPC）**  
   ```bash
   node scripts/demo/start-frontend.mjs
   ```
   - 会设置 `VITE_LOCAL_RPC_URL=http://127.0.0.1:8545` 再启动前端（见 `scripts/demo/start-frontend.mjs`）。

2. **手动设置环境变量后启动**  
   ```bash
   cd frontend
   set VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
   npm run dev
   ```
   - Windows CMD 用 `set`；PowerShell 用 `$env:VITE_LOCAL_RPC_URL="http://127.0.0.1:8545"; npm run dev`。

**前端本地网址**：启动后控制台会打印，默认为 **http://127.0.0.1:5173**（`vite.config.ts` 中 server.port 5173、host 127.0.0.1）。

---

## 5. MetaMask 连接指引

| 项 | 值 |
|----|-----|
| 网络名称 | 本地随意（如 "Hardhat Local"） |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| 货币符号 | 随意（如 ETH） |
| 区块浏览器 | 留空 |

**导入测试账户（可选）**  
Hardhat 默认账户 #0 私钥（仅测试网/本地，勿用于主网）：

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

- 对应地址：`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`，余额 10000 ETH。  
- 其他账户见 `npx hardhat node` 启动时输出的 Accounts 列表。

**水龙头**：无需；本地链预填 10000 ETH/账户。

---

## 6. 功能验收手测 Checklist

- [ ] **Connect**：连接钱包，前端识别 chainId 31337，显示“Hardhat Local”或 31337。
- [ ] **切链**：若曾连其他链，切回 31337，余额/合约地址正确。
- [ ] **余额显示**：仪表盘显示 ETH 与抵押品/借贷代币余额。
- [ ] **Supply**：先 Approve（若需要）→ Supply；余额/抵押率/健康因子更新。
- [ ] **Borrow**：在健康因子允许范围内 Borrow；借贷余额与利率显示正确。
- [ ] **Repay**：部分或全部 Repay；借贷余额与健康因子更新。
- [ ] **Withdraw**：在健康因子与 LTV 允许范围内 Withdraw；抵押余额更新。
- [ ] **治理页面**（如有）：提案列表/状态可见；可查看提案详情。
- [ ] **紧急暂停**（如有）：执行 pause 后，Supply/Borrow/Withdraw 等被阻断；unpause 后恢复。

发现问题可记录到 [10-TROUBLESHOOTING-AND-LIMITATIONS.md](10-TROUBLESHOOTING-AND-LIMITATIONS.md) 或项目 issue（复现步骤、截图路径、严重级别）。

---

## 7. 小结

| 步骤 | 命令/操作 |
|------|------------|
| 1. 起链 | `npm run demo:chain` 或 `npx hardhat node` |
| 2. 部署 | `npm run p10:gate`（推荐）或 分步 `deploy:localhost` + `deploy:p9` + 前端部署同步 |
| 3. 前端 | `node scripts/demo/start-frontend.mjs` 或 `cd frontend && npm run dev`（必要时设 `VITE_LOCAL_RPC_URL`） |
| 4. 打开 | http://127.0.0.1:5173 |
| 5. 钱包 | MetaMask 添加网络：Chain ID 31337、RPC http://127.0.0.1:8545；导入测试私钥（可选） |
| 6. 手测 | Connect → 切链 → 余额 → Supply（Approve+Supply）→ Borrow → Repay → Withdraw → 治理 → Pause/Unpause |

---

## 8. 本地真实运行能力评估（四项能力）

*本节由原 LOCAL-REAL-RUN-ASSESSMENT.md 合并而来。*

**结论：YES（已完全满足）** — 本地环境下已完整实现：① 启动 Hardhat 并部署全部合约；② 前端连接真实钱包并使用真实私钥签名；③ 四页面（Dashboard、Markets、Governance、Activity）业务功能在本地链上完成真实交互闭环；④ 全链路不依赖远程主网或前端模拟数据即可独立运行。

| 能力项 | 结论 | 证据摘要 |
|--------|------|----------|
| ① 本地 Hardhat 与全部合约部署 | ✅ | `npm run demo:chain` / `deploy:localhost` + `deploy:p9`（或 `p10:gate`）；LendingPool、Oracle、Liquidation、Treasury、P9 治理；deployments/31337.json 与 frontend 同步。 |
| ② 真实钱包与真实 Signer | ✅ | useWallet 使用 `window.ethereum`，无 mock；useActions/GovernancePage/PauseUnpauseBar 均 `provider.getSigner()` 发交易。 |
| ③ 四页面真实交互闭环 | ✅ | Supply/Borrow/Repay/Withdraw、Delegate/Propose/Vote/Queue/Execute、Activity 交易记录与链上一致。 |
| ④ 独立于主网与模拟数据 | ✅ | 链与 RPC 为 8545/31337；deployments 由脚本生成；MODE=mock 为链上 Mock Oracle，非前端 mock。 |

**最基础运行前置**：起链 → deploy:localhost + deploy:p9 → 前端 + MetaMask 连接 → **/diagnostics 三项确认**（Deployments=Yes、RPC 正常、Lending 为有效 0x 地址）。详见 [09-本地链标准与地址.md](09-本地链标准与地址.md)。
