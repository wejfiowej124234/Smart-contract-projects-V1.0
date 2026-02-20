# E2E fail-fast diagnostic
time: 2026-02-17T01:26:47.826Z
test: Approve Supply Borrow Repay Withdraw

## Result
- "Connect wallet" visible: false
- "Install MetaMask" visible: false
- typeof window.ethereum: object

## Page body snippet
```
◆
Lending Dashboard
Navy
Disconnect
OK · Hardhat Local
0xf39F…2266
Show
Copy
Dashboard
Markets
Governance
Using local network. If you restarted the node and MetaMask shows wrong balances, reset account for this network.
Refresh
Auto refresh
On
Updated: —
Block: —

Dashboard error: could not coalesce error

Balances
USD8
—
WETH
—

Balances not loaded. Start the node, run the deploy script (e.g. npx hardhat run scripts/deploy/deploy.ts --network localhost), then click Refresh.

Risk & parameters
Actions
Approval mode: Exact (safer) Infinite (convenience)
Supply (USD8)
Amount
Max
Available: —
Allowance: —
Supply
Withdraw (USD8)
Amount
Max
Max withdrawable (safe): —

Withdrawing may lower your health factor.

Withdraw
Borrow (USD8)
Amount
Max
Max borrowable (safe): —

Borrowing will lower your
```