# 本地运行步骤（解决「Contract read failed」/ 余额不显示）

## 重要概念

- **重启 Hardhat 节点 = 整条链清空**，之前的合约和代币都会消失，所以「之前的币」在新链上确实没了。
- **不需要退出/重新登录 MetaMask**。同一个账户在重新部署后会被脚本再次铸造 10,000 USD8 + 10,000 WETH。
- 仪表盘报错「Contract read failed」或余额一直是 "—"，多半是：**节点重启后没重新部署**，或**前端用了旧的合约地址（缓存）**。

---

## 正确顺序（每次重启节点后都要做）

### 1. 启动节点（保持不关）

在**终端 1**：

```bash
cd "c:\Users\plant\Desktop\Smart contract projects"
npx hardhat node
```

保持这个窗口开着，不要关。

### 2. 部署合约（在节点已启动的前提下）

在**终端 2**（新开一个）：

```bash
cd "c:\Users\plant\Desktop\Smart contract projects"
npx hardhat run scripts/deploy.ts --network localhost
```

看到输出里有 `USD8 address`、`SimpleLending address` 和 `Seeded 0x7099...` 即表示成功。

### 3. 重启前端并强刷页面

- 若前端是用 `npm run dev` 跑的：**关掉当前 dev 进程**，再在 `frontend` 目录执行一次 `npm run dev`（这样会重新读最新的 `deployments.json`）。
- 在浏览器里对仪表盘做**强制刷新**：`Ctrl + Shift + R`（或 Ctrl+F5），避免用旧的前端缓存。

### 4. 确认网络

在 MetaMask 里选 **Hardhat Local (31337)**，账户保持 0x7099...79C8 即可，无需重新登录。

### 5. 若页面余额正确、但 MetaMask 里仍显示旧余额（例如 9,994 而不是 10,000）

重启节点后链是新的，但 MetaMask 会按「网络 + 代币地址」缓存余额，有时不会自动更新。**可靠做法**：

1. 在 MetaMask 中：**设置（Settings）→ 高级（Advanced）→ 重置账户（Reset account）**。
2. 只重置当前网络（Hardhat Local），不会动主网或其他网络。
3. 重置后 MetaMask 会重新从节点拉取余额，页面和钱包就一致了。

无需删除网络、无需切换网络，刷新页面即可。

---

## 小结

| 问题 | 答案 |
|------|------|
| 智能合约重新节点部署了，之前的币就没用了？ | 是。重启节点后旧链状态清空，需要重新部署，脚本会再给该账户铸 10k USD8 + 10k WETH。 |
| 要重新登录钱包吗？ | 不用。同一账户即可。 |
| 刷新了还是不出来？ | 先确认节点在跑 → 再执行一次 deploy → 重启前端 dev → 浏览器强制刷新。 |
| 页面 10,000、MetaMask 还是 9,994？ | 在 MetaMask：设置 → 高级 → 重置账户（仅影响当前网络，余额会重新从节点拉取）。 |
