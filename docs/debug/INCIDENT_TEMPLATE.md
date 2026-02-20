# 问题记录模板（Incident Template）

**用法**：每遇到一个 bug，复制本模板为独立文件并填空，便于可复现、可交接、可回归。与 [DEBUG_PLAYBOOK.md](DEBUG_PLAYBOOK.md) 配套使用；本目录入口见 [README.md](README.md)。

**保存建议**：可建 `docs/debug/incidents/` 或项目根 `incidents/`，文件名示例：`YYYY-MM-DD-[local][borrow]-repay-reverted.md`。

---


## 标题

示例：`[local][borrow] repay reverted after approve`

---

## 现象（Symptom）

- **期望**：
- **实际**：
- **频率**：必现 / 偶现
- **影响范围**：页面/功能

---

## 环境（Environment）

| 项 | 值 |
|----|-----|
| OS |  |
| Node |  |
| chainId | 31337（本地）/ 其他 |
| RPC | http://127.0.0.1:8545（本地）/ 其他 |
| commit |  |
| MetaMask 版本 |  |

---

## 复现步骤（Repro Steps）

1.
2.
3.

---

## 证据（Evidence）

- **前端 console（关键片段）**：
- **Hardhat node log**：
- **交易 hash**：
- **revert reason**：
- **截图路径**：

---

## 定位（Root Cause）

- **归因层级**：UI / ethers / RPC / contract / config
- **根因描述**：

---

## 修复（Fix）

- **改动点**：
- **风险**：
- **兼容性**：

---

## 回归（Regression Checklist）

| 项 | Pass |
|----|------|
| supply |  |
| borrow |  |
| repay |  |
| withdraw |  |
| governance / pausable（如有） |  |
| E2E 全绿（`npm run p10:gate` 或 `npm run e2e:core`） |  |
