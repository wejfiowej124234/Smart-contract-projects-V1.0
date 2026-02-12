# Contributing

Conventions: follow these entry points and rules before changing code or docs so the repo stays clean and reproducible.

## Documentation

- **Doc index**: [docs/README.md](docs/README.md)
- **Design and implementation (P0–P6)**: [docs/P0_P6_Summary.md](docs/P0_P6_Summary.md)

## Code

- **Frontend**: Follow [frontend/FRONTEND_STYLE_GUIDE.md](frontend/FRONTEND_STYLE_GUIDE.md) (naming, exports, ethers bigint, error normalization, tx state machine, event listeners)
- **Contracts**: Solidity 0.8.x, Hardhat compile and test
- **Before commit**: `npm run ci:local` passes; no new hardcoding (copy/colors/chain ID from config and design-tokens)

## Doc maintenance

- New docs: add a line in the right section of [docs/README.md](docs/README.md)
- Deprecated docs: remove from the index or note “archived” in [docs/README.md](docs/README.md)

## Security and release

- Security policy: [SECURITY.md](SECURITY.md)
- Before public release: run `npm run ci:local` and self-check (see local release checklist if needed).
