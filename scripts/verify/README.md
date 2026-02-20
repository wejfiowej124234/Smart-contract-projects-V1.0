# 链上验证（06 结构）

用于在 Etherscan/区块浏览器上验证已部署合约源码。

- 可在此目录添加 `verify.ts`（或 `.js`），调用 `hardhat verify --network <net> <address> <ctor-args>`。
- 与 project-upgrade《06-升级后目录结构》scripts/verify 对应。
- 多合约验证可依部署导出（如 `deployments/<chainId>.json`）循环调用。
