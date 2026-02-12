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

## Demo / interview notes

- **Wallet language:** The app UI is in English. Transaction and approval prompts (e.g. “Confirm”, “Expenditure limit”) are shown by the **wallet** (e.g. MetaMask). Their language follows the wallet or browser locale, not the app. For an English demo, set MetaMask (and/or the browser) to English.
- **Amount after confirm:** After a transaction is confirmed, the amount input for that action (Supply / Withdraw / Borrow / Repay) is cleared automatically.
- **Amount in wallet vs app:** The wallet may display a rounded amount (e.g. 11.11) while the app shows 11.111. The value sent on-chain is the exact amount entered; the difference is only how the wallet chooses to display it.
- **Browser translation:** The app is built in English. If you use the browser’s “Translate page” to Chinese, labels can be wrong (e.g. “USD8” → “8 美元”, “Withdrawing” → “戒断反应”). For a correct demo, use English or keep the page untranslated. Card titles now use `translate="no"` on the token symbol so “USD8” stays as-is.

## Commands

```bash
npm run lint
npm run build
```

## Scope & assumptions

- `WETH` is display-only and does not participate in lending math.
- The protocol is intentionally simplified for this demo and is not intended for mainnet use.

## Architecture (minimal, production-minded)

- `src/contracts/`: deployments + ABI + contract factory helpers
- `src/hooks/`: wallet / read-model / write-model hooks
- `src/state/`: tx state machine + error normalization
- `src/utils/`: pure helpers
