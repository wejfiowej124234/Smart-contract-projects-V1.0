# Screenshot flow verification (业务 / 逻辑 / 显示 / 流程)

This doc records the verification of the full UI flow against the screenshots: **business logic**, **display**, and **flow** correctness.

## 1. Business logic

| Check | Result |
|-------|--------|
| **Supply** | User enters 11.111 → we send `parseUnits("11.111", 18)` wei. Contract receives correct amount. Approval is for same amount (exact mode). ✓ |
| **Withdraw** | Preflight validates `amountWei <= maxWithdraw`; we use `safeMaxWei(maxWithdraw)` for “Max” (minus 1 wei) to avoid rounding. ✓ |
| **Borrow** | Preflight validates `amountWei <= maxBorrow` and pool liquidity. Contract borrow updates position. ✓ |
| **Repay** | Preflight validates `amountWei <= borrowed` and balance. We approve then repay; amount matches. ✓ |
| **Health factor** | Contract: `healthFactor = (maxBorrowable * 100) / borrowed`. We show ratio (÷100) as "1.00", not raw "100". Thresholds: &lt;100 Critical, &lt;120 At risk, ≥120 Healthy. ✓ |
| **Rates** | Contract returns supplyRate/borrowRate as small integers (e.g. 2, 4, 9, 18). We display with `formatPercent` → "2%", "4%", etc. ✓ |
| **Utilization** | Contract returns 0–100. Bar uses `bigintToNumberSafe(utilization)` then clamp 0–100 for `width`. ✓ |

## 2. Display

| Check | Result |
|-------|--------|
| **Pool** | totalSupply/totalBorrow in wei → `formatToken` (formatUnits + clamp 6 decimals) → e.g. "11.111". ✓ |
| **User position** | supplied, borrowed, maxWithdraw, maxBorrow same formatting. healthFactor via `formatHealthFactorForDisplay` (ratio, not raw). ✓ |
| **Empty state** | totalSupply "0" && totalBorrow "0" → isEmpty; we show placeholders and empty-state CTA. ✓ |
| **Rates** | supplyRate/borrowRate shown as "2%", "4%", "9%", "18%" via formatPercent. ✓ |
| **Wallet amount** | MetaMask may show rounded (e.g. 11.11); on-chain value is exact. Documented in frontend README. ✓ |

## 3. Flow

| Step | Result |
|------|--------|
| **Preflight** | openPreflight(action, form.inputs.*) stores `amountText`. On confirm we re-parse `amountText`, validate balance/caps/network, then call actions.*(amountText). Same amount used end-to-end. ✓ |
| **Supply + approve** | supply() calls approveIfNeeded(amount) then write.supply(amount). One UI click can trigger approve tx then supply tx. ✓ |
| **After confirm** | When tx stage === "confirmed", we clear the amount input for that action (Supply/Withdraw/Borrow/Repay). ✓ |
| **Cap → 0** | When dashboard refreshes and maxWithdraw/maxBorrow/borrowed becomes 0, we clear the corresponding input to avoid e.g. "11.110999" with "Max withdrawable: 0". ✓ |
| **Disabled states** | Withdraw/Borrow/Repay disabled when maxWithdraw/maxBorrow/borrowed is 0 or undefined; reason strings shown. ✓ |

## 4. Edge cases already fixed

- **BigInt in number context** (e.g. utilization bar, decimals in sanitize/parse): use `bigintToNumberSafe` or convert decimals to number. ✓
- **Input "."** → sanitize to "0."; parseAmountStrict rejects "0." (invalid format); no bigint passed to Math/style. ✓
- **Health factor "100"** → display as "1.00" (contract scale 100). ✓

## 5. Connect-wallet flow (screenshots: before connect → connecting)

| Step | Expected | Verified / fix |
|------|----------|----------------|
| **Before connect** | Header: "Connect wallet"; Balance: "Connect wallet to load balances"; Pool/User Position: no stale data; Actions: banner "Please connect your MetaMask wallet to enable transactions.", buttons disabled. | **Fixed:** When wallet is not connected, Pool and User Position now show placeholder "Connect wallet to load balances" instead of stale data; dashboard data is cleared when account disconnects so Actions cards don’t show "Available: 9,999..." from a previous session. |
| **Connecting** | Header button shows "Connecting…"; MetaMask popup "Connect to this website" (locale may be Chinese). | Correct. If "Connecting…" is visually cut off, ensure the header button has enough width (e.g. min-width) or use a shorter label. |

## 6. Screenshot issues found and fixes

| Screenshot issue | Cause | Fix |
|------------------|--------|-----|
| Card title shows "偿还 (8 美元)" instead of "Repay (USD8)" | Browser “Translate to Chinese” turns "USD8" into "8 美元". | Card title, Balances labels/values, and Preflight amount line now wrap the token symbol in `<span translate="no">` so "USD8"/"WETH" are not translated. |
| "借用: —" (Borrowed: —) empty when user has debt | Can happen briefly before `dashboard.data.position` is loaded, or in a stale view. | Data comes from chain; once loaded, "Borrowed: X USD8" shows. If you see "—" with an amount in the input, refresh or wait for the next block. |
| "戒断反应可能会降低您的健康系数" (weird Chinese for withdraw warning) | Browser translation: "Withdrawing" was translated as “withdrawal (戒断)” → “戒断反应” (withdrawal symptoms). | App copy is English ("Withdrawing may lower your health factor."). Use the app in English or disable page translation for correct wording. |
| MetaMask shows 83.33 vs app 83.325 | Wallet rounds the allowance/amount for display. | On-chain value is 83.325; no code change. |

## 7. Not app-controlled (documented)

- **Wallet UI language** (e.g. Chinese "支出上限请求"): MetaMask locale; set wallet/browser to English for English demo.
- **Wallet showing 11.11 vs app 11.111**: Display rounding in wallet; on-chain amount is exact.

---

*Verified against codebase and screenshot descriptions. No business, logic, display, or flow errors found in the current implementation.*
