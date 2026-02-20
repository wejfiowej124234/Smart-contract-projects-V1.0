# Contributing

Conventions: follow these entry points and rules before changing code or docs so the repo stays clean and reproducible.

## Documentation

- **Doc index**: [docs/01-README.md](docs/01-README.md) (entry); full index by role/P0–P10/run command: [docs/00-INDEX.md](docs/00-INDEX.md)
- **Design and implementation (P0–P6)**: [docs/02-PROJECT-LEAD-ENTRY.md](docs/02-PROJECT-LEAD-ENTRY.md) Part 3

## Local-chain debugging (前后端联调)

- **SSOT**: [docs/09-本地链标准与地址.md](docs/09-本地链标准与地址.md) 为唯一入口。严格按 **node → deploy →（必须）重启前端 → MetaMask 31337 → /diagnostics 三项 Yes** 最短闭环执行；所有问题**先过 GATE 五项**门禁并走最短修复路径，**再**按 [docs/debug/DEBUG_PLAYBOOK.md](docs/debug/DEBUG_PLAYBOOK.md) 分层（合约 → 交易 → 前端 → E2E）定位改代码；按统一 **Evidence Pack** 留证，确保可复现、可回归、可审计。详见 09 总纲「可引用原文」与「联调执行约定」。

## Code

- **Frontend**: Follow [frontend/FRONTEND_STYLE_GUIDE.md](frontend/FRONTEND_STYLE_GUIDE.md) (naming, exports, ethers bigint, error normalization, tx state machine, event listeners)
- **Contracts**: Solidity 0.8.x, Hardhat compile and test
- **Before commit**: `npm run ci:local` passes; no new hardcoding (copy/colors/chain ID from config and design-tokens)

## Doc maintenance

- New docs: add a line in the right section of [docs/00-INDEX.md](docs/00-INDEX.md) (full index); overview in [docs/01-README.md](docs/01-README.md)
- Deprecated docs: remove from the index or note “archived” in [docs/00-INDEX.md](docs/00-INDEX.md) §五

## Security and release

- Security policy: [SECURITY.md](SECURITY.md)
- Before public release: run `npm run ci:local` and self-check (see local release checklist if needed).
