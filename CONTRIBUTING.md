# Contributing

Conventions: follow these entry points and rules before changing code or docs so the repo stays clean and reproducible.

## Documentation

- **Doc index**: [docs/README.md](docs/README.md)
- **Design and implementation (P0–P6)**: [docs/P0_P6_Summary.md](docs/P0_P6_Summary.md)
- **Assignment and acceptance**: Root [README_CODING_TEST_CHECKLIST.md](README_CODING_TEST_CHECKLIST.md); [docs/archive/ASSESSMENT_MAPPING.md](docs/archive/ASSESSMENT_MAPPING.md) when needed

## Code

- **Frontend**: Follow [frontend/FRONTEND_STYLE_GUIDE.md](frontend/FRONTEND_STYLE_GUIDE.md) (naming, exports, ethers bigint, error normalization, tx state machine, event listeners)
- **Contracts**: Solidity 0.8.x, Hardhat compile and test
- **Before commit**: `npm run ci:local` passes; no new hardcoding (copy/colors/chain ID from config and design-tokens)

## Doc maintenance

- New docs: add a line in the right section of [docs/README.md](docs/README.md)
- Deprecated docs: move to **docs/archive/** and note “archived” in the index
- Cleanup and archive notes: see docs in [docs/archive/](docs/archive/) when needed

## Security and release

- Security policy: [SECURITY.md](SECURITY.md)
- Before public release: self-check with [PUBLIC_RELEASE_CHECKLIST.md](PUBLIC_RELEASE_CHECKLIST.md)
