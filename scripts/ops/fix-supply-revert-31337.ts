/**
 * Diagnose and fix Supply tx revert on local 31337 (no frontend/contract core changes).
 * Checks in order: lending.paused(), lending.reservePaused(usd8), user allowance, balance, amount>0.
 * If pause is the cause: uses PAUSER account (deployer) to unpause() and/or clear reserve pause.
 * Prerequisite: Node running; deployments/<chainId>.json for the chain (e.g. 31337).
 * Usage: npm run ops:fix-supply-revert (or npx hardhat run scripts/ops/fix-supply-revert-31337.ts --network localhost)
 * Optional: USER_ADDRESS=0x... to check allowance/balance for a specific user.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy first.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const {
    simpleLendingAddress: poolAddress,
    usd8Address,
    configuratorAddress,
  } = deployments;
  if (!poolAddress || !usd8Address) {
    throw new Error("Missing simpleLendingAddress or usd8Address in deployments.");
  }

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress, deployer);
  const token = await hre.ethers.getContractAt("TestToken", usd8Address, deployer);

  // ---------- 1) Diagnostic ----------
  console.log("\n--- Supply revert diagnostic (31337) ---");
  const globalPaused = await pool.paused();
  const reservePaused = await pool.reservePaused(usd8Address);
  const deployerIsPauser = await pool.isPauser(deployerAddress);

  console.log("pool.paused():", globalPaused);
  console.log("pool.reservePaused(usd8Address):", reservePaused);
  console.log("pool.isPauser(deployer):", deployerIsPauser);

  const userAddress = process.env.USER_ADDRESS?.trim();
  if (userAddress && hre.ethers.isAddress(userAddress)) {
    const allowance = await token.allowance(userAddress, poolAddress);
    const balance = await token.balanceOf(userAddress);
    console.log("user (USER_ADDRESS) allowance(usd8 -> pool):", allowance.toString());
    console.log("user (USER_ADDRESS) balance(usd8):", balance.toString());
  } else if (userAddress) {
    console.log("USER_ADDRESS invalid or empty, skipping allowance/balance.");
  }

  const pauseRelated = globalPaused || reservePaused;
  if (pauseRelated) {
    console.log("\n[ROOT CAUSE] Pause state blocks Supply: globalPaused=" + globalPaused + ", reservePaused=" + reservePaused);
  } else {
    console.log("\n[INFO] Pool not paused; revert likely due to allowance, balance, or amount <= 0.");
  }

  // ---------- 2) Fix: unpause if needed ----------
  if (globalPaused && deployerIsPauser) {
    console.log("\nCalling pool.unpause() as PAUSER (deployer)...");
    const unpauseTx = await pool.unpause();
    const unpauseReceipt = await unpauseTx.wait();
    console.log("pool.unpause() txHash:", unpauseReceipt?.hash, "block:", unpauseReceipt?.blockNumber);
  } else if (globalPaused && !deployerIsPauser) {
    console.log("\n[SKIP] Pool is paused but deployer is not PAUSER; cannot unpause from this script.");
  }

  if (reservePaused && configuratorAddress) {
    const configurator = await hre.ethers.getContractAt("PoolConfigurator", configuratorAddress, deployer);
    console.log("\nCalling configurator.setReservePause(usd8, false) as Admin...");
    const setPauseTx = await configurator.setReservePause(usd8Address, false);
    const setPauseReceipt = await setPauseTx.wait();
    console.log("setReservePause(usd8, false) txHash:", setPauseReceipt?.hash, "block:", setPauseReceipt?.blockNumber);
  } else if (reservePaused && !configuratorAddress) {
    console.log("\n[SKIP] Reserve is paused but configuratorAddress missing in deployments.");
  }

  // ---------- 3) Re-check state ----------
  const globalPausedAfter = await pool.paused();
  const reservePausedAfter = await pool.reservePaused(usd8Address);
  console.log("\n--- After fix ---");
  console.log("pool.paused():", globalPausedAfter);
  console.log("pool.reservePaused(usd8Address):", reservePausedAfter);
  if (!globalPausedAfter && !reservePausedAfter) {
    console.log("\n[OK] Pool writable. Re-run Approve → Supply in the UI; tx should reach Confirmed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
