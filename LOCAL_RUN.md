# Local run steps (fix "Contract read failed" / balance not showing)

## Important

- **Restarting the Hardhat node clears the chain.** Previous contracts and tokens are gone; "old" balances no longer exist on the new chain.
- **You do not need to log out of MetaMask.** The same account gets 10,000 USD8 + 10,000 WETH minted again by the deploy script.
- "Contract read failed" or balance stuck as "—" usually means: **node was restarted but you did not redeploy**, or **the frontend is using old contract addresses (cache)**.

---

## Correct order (do this after every node restart)

### 1. Start the node (leave it running)

In **terminal 1**:

```bash
cd "c:\Users\plant\Desktop\Smart contract projects"
npx hardhat node
```

Keep this window open.

### 2. Deploy contracts (with the node already running)

In **terminal 2** (new window):

```bash
cd "c:\Users\plant\Desktop\Smart contract projects"
npx hardhat run scripts/deploy.ts --network localhost
```

Success when you see `USD8 address`, `SimpleLending address`, and `Seeded 0x7099...79C8` in the output.

### 3. Restart the frontend and hard-refresh the page

- If the frontend is running with `npm run dev`: **stop the dev process**, then run `npm run dev` again from the `frontend` folder (so it reads the latest `deployments.json`).
- In the browser, **hard refresh** the dashboard: `Ctrl + Shift + R` (or Ctrl+F5) to avoid stale cache.

### 4. Check the network

In MetaMask, select **Hardhat Local (31337)**. Keep the same account (e.g. 0x7099...79C8); no need to log in again.

### 5. If the app shows correct balance but MetaMask still shows old balance (e.g. 9,994 instead of 10,000)

After a node restart the chain is new, but MetaMask caches balance by network + token address and may not update. **Reliable fix**:

1. In MetaMask: **Settings → Advanced → Reset account**.
2. This resets only the current network (Hardhat Local); other networks are unchanged.
3. After reset, MetaMask fetches balance from the node again; app and wallet match.

No need to remove the network or switch networks; refresh the page after reset.

---

## Summary

| Issue | Answer |
|-------|--------|
| Node restarted and redeployed — are my old tokens gone? | Yes. After a restart the chain state is cleared; redeploy runs and the script mints 10k USD8 + 10k WETH again for the same account. |
| Do I need to log out of the wallet? | No. Same account is fine. |
| Refreshed but balance still missing? | Confirm the node is running → run deploy again → restart frontend dev → hard refresh in the browser. |
| App shows 10,000 but MetaMask shows 9,994? | In MetaMask: Settings → Advanced → Reset account (only affects current network; balance is refetched from the node). |
