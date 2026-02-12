# Coding Test Assignment (Web3 engineer) — Checklist

> Grouped as: **Mandatory** / **Explicit boundaries (not required)** / **Bonus**.

## Mandatory — must be done

### A. Tech stack (hard requirements)

- [ ] Frontend: React
- [ ] Frontend: TypeScript
- [ ] Frontend: ethers.js v6 for contract interaction
- [ ] Contracts: Solidity (0.8.19), deploy on Hardhat local chain

### B. Contracts and deployment (Part 1)

- [ ] Hardhat project with TestToken.sol and SimpleLending.sol
- [ ] Runs on local Hardhat network (chainId 31337)
- [ ] Deploy script: USD8 and WETH test tokens, SimpleLending, seed test accounts
- [ ] Export ABI and addresses for the frontend

### C. Frontend: wallet and network (Part 2)

- [ ] MetaMask connect (ethers v6 BrowserProvider + signer)
- [ ] Auto switch to Hardhat (31337) or chosen EVM testnet
- [ ] Connection state persists after refresh (account + network shown)
- [ ] UI shows: connected account (address), network (chainId)

### D. Frontend: token (Part 2)

- [ ] Show user USD8 and WETH balances
- [ ] Approve flow before Supply
- [ ] UI shows allowance for the lending contract

### E. Frontend: Lending Dashboard (Part 2)

From contract, show:

**Pool**
- [ ] total supply, total borrow, utilization rate, supply rate, borrow rate

**User position**
- [ ] supplied, borrowed, health factor (with color), max withdrawable, max borrowable

### F. Frontend: transactions (Part 2)

- [ ] Supply (with approve), Withdraw (with health check / failure hint), Borrow (health + liquidity check), Repay
- [ ] Results visible in UI

### G. Live updates and tx status (Part 2)

- [ ] After each tx: balances and position update
- [ ] UI updates via contract events (Supplied/Withdrawn/Borrowed/Repaid)
- [ ] UI shows tx status: pending, confirmed, failed

### H. Deliverables

- [ ] One GitHub repo (contracts + deploy script + frontend)
- [ ] README: how to run node, deploy, start frontend; contract addresses if on testnet; assumptions/decisions

## Bonus (optional)

- [ ] At least 2 contract integration tests (Hardhat)
- [ ] Error handling: insufficient balance, insufficient allowance, health factor violation, network/RPC errors
- [ ] Loading state for async operations
- [ ] Optional: deploy to testnet + frontend on Vercel/Netlify

## Self-check before handoff

- [ ] `npx hardhat node` runs; deploy script succeeds and produces ABI + addresses
- [ ] Frontend: MetaMask connects, auto switch to 31337; USD8/WETH balances correct
- [ ] Supply (with approve), Borrow, Repay, Withdraw work; UI shows pending→confirmed/failed and updates after confirm (events trigger refresh)
- [ ] README: another machine can reproduce by following the steps
