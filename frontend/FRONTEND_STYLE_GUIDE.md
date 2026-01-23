# Frontend Style Guide (Vite + React + TS + ethers v6)

This project aims for a small-but-clean architecture: predictable folders, typed boundaries, and one way to do things.

## Folder Structure (best-practice minimal)

- `src/contracts/`
  - `deployments.ts` reads `deployments.json` and exposes typed addresses.
  - `abis.ts` exports typed ABIs (`InterfaceAbi`).
  - `contracts.ts` creates ethers `Contract` instances.
- `src/hooks/`
  - `useWallet.ts` handles MetaMask + chain switching + events.
  - `useDashboard.ts` is the read-model (balances/pool/position).
  - `useActions.ts` is the write-model (approve/supply/withdraw/borrow/repay).
  - Keep hooks focused: one responsibility, minimal shared state.
- `src/state/`
  - `tx.ts` defines the tx state machine and `runTx` helper.
  - `errors.ts` normalizes errors from MetaMask/ethers.
- `src/utils/`
  - pure helpers (formatting/assertions).
- `src/types/`
  - ambient types for EIP-1193 (`window.ethereum`).

## Naming & Exports

- Hooks: `useXxx` and default-export **only** React components; prefer named exports elsewhere.
- `PascalCase` for React components, `camelCase` for functions/variables.
- File names: `camelCase.ts` for utils/hooks, `PascalCase.tsx` for components.

## ethers v6 Rules (important)

- Use `bigint` everywhere for on-chain integers.
- Parse user input with `parseUnits(value, decimals)`; format with `formatUnits(amount, decimals)`.
- Never mix `number` math with `bigint` math.
- Only use `number` for UI-only things (e.g., token decimals, chainId).

## Error Handling

- Always normalize errors via `normalizeError()` before showing in UI.
- Treat user rejection as a normal case (don’t show scary errors).
- Prefer single-line errors near the action area + an optional detailed console log.

## Transaction Pattern (one canonical flow)

- Use a single tx state machine (`idle → signing → pending → confirmed/failed`).
- A write action should:
  1) validate input
  2) ensure allowance if needed
  3) send tx
  4) wait for confirmation
  5) refresh read-model (`dashboard.refresh()`)

## Contract Events (mandatory)

- Listen to `Supplied/Withdrawn/Borrowed/Repaid` and refresh the dashboard.
- Always `off()` listeners on unmount and coalesce refresh calls (debounce/throttle).

## Block Listener (optional fail-safe)

- Use `provider.on('block')` only as a fallback for UI freshness.
- Keep it restrained:
  - enable only when connected + correct chain
  - disable while tx is `signing/pending`
  - throttle to ~`3s` to avoid RPC spam

## Type Safety Without TypeChain

- Prefer exposing a narrow typed write wrapper from `src/contracts/write.ts`.
- Keep any `getFunction("...")` usage internal to that wrapper so the rest of the app can stay type-safe.

## UI Conventions (simple & consistent)

- Keep the dashboard read-only section always visible.
- Actions should be grouped by operation (Supply/Withdraw/Borrow/Repay) with one input each.
- Disable buttons when `tx.stage` is `signing`/`pending`.
- Show tx hash prefix and stage for quick debugging.

## Domain Constraints (must match assignment assumptions)

- WETH is **display-only** (balance shown), not used in lending math.
- Lending token is USD8 only.
