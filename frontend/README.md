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

## MetaMask auto-switch / auto-add (demo-ready)

The app switches to the expected chainId from `frontend/src/contracts/deployments.json` (default: `31337`).

For a smooth local demo, this repo includes `frontend/.env.development` (no secrets) to enable one-click chain add when MetaMask doesn’t have the local Hardhat chain yet:
- `VITE_LOCAL_RPC_URL` (used only for `wallet_addEthereumChain`)
- `VITE_AUTO_ADD_CHAIN=true`
- optional `VITE_EXPECTED_CHAIN_NAME`

To override locally, create `frontend/.env.local`.

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
