# Part 2 — Frontend (React + TypeScript + ethers v6)

This frontend connects to the local Hardhat chain (chainId `31337`) and interacts with:

- `USD8` (ERC20)
- `WETH` (display-only balance)
- `SimpleLending` (single-asset lending using USD8)

## Run

From repo root, start the local node and deploy/export ABIs:

```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

Then run the frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Commands

```bash
npm run lint
npm run build
```

## Scope & assumptions

- `WETH` is display-only and does not participate in lending math.
- The protocol is intentionally simplified for the assignment and is not intended for mainnet use.

## Architecture (minimal, production-minded)

- `src/contracts/`: deployments + ABI + contract factory helpers
- `src/hooks/`: wallet / read-model / write-model hooks
- `src/state/`: tx state machine + error normalization
- `src/utils/`: pure helpers
