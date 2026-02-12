# Business flow test scenarios

Use this checklist to verify the app end-to-end and catch regressions (e.g. BigInt conversion, amount input).

## Prerequisites

- `npx hardhat node` running
- `npx hardhat run scripts/deploy.ts --network localhost` done
- `cd frontend && npm run dev` running
- MetaMask connected to Hardhat Local (31337)

---

## 1. Amount input (no crash)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | In Supply amount, type `11` | No error |
| 1.2 | Add decimal: type `.` then `1` → `11.1` | No error, no "Cannot convert a BigInt value to a number" |
| 1.3 | Try `111.1`, `0.5`, `1.23` | Same |
| 1.4 | Clear, type `0.` | No crash; validation may show error on submit |
| 1.5 | Max button (with balance) | Fills with formatted amount, no crash |

## 2. Supply flow

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Enter amount (e.g. 100 or 11.1), click Supply | If allowance needed: Approve then Supply; else Supply |
| 2.2 | Confirm in MetaMask | Tx pending then confirmed |
| 2.3 | UI updates | Pool totalSupply up, User Position supplied up, balance down |

## 3. Withdraw flow

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | After supply, enter withdraw amount ≤ supplied | Withdraw enabled |
| 3.2 | Click Withdraw, confirm | Tx confirms, supplied and balance update |

## 4. Borrow flow

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Enter borrow amount ≤ maxBorrow | Borrow enabled |
| 4.2 | Click Borrow, confirm | Tx confirms, borrowed and balance update, healthFactor shown |

## 5. Repay flow

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Enter repay amount ≤ min(balance, borrowed) | Repay enabled |
| 5.2 | Click Repay, confirm | Tx confirms, borrowed and balance update |

## 6. Error / boundary

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Borrow more than maxBorrow (if UI allows) or use invalid amount | Clear error, no uncaught exception |
| 6.2 | Withdraw more than maxWithdraw | Disabled or clear error |
| 6.3 | Switch to wrong network | "Wrong network" / actions disabled |

## 7. Regression: BigInt display

- Any amount input with decimals (e.g. `11.1`, `111.1`) must not trigger "Cannot convert a BigInt value to a number".
- Fix: Pool utilization bar and any numeric display use `bigintToNumberSafe()` (or equivalent) before passing to `Math.*` or style values.
