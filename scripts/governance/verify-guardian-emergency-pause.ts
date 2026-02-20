/**
 * P9: Guardian/EmergencyModule E2E — we call emergencyPause → business reverts → unpause restores.
 * Prereq: deploy-p9 has been run (EmergencyModule deployed, Pool has grantPauser(EmergencyModule)); Guardian = deployer; deployer remains PAUSER so we can call unpause.
 * Usage: npx hardhat run scripts/governance/verify-guardian-emergency-pause.ts --network localhost
 * Why: Ensures emergency pause and recovery path work before release so that production incidents can be contained.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const SUPPLY_AMOUNT = 1n * 10n ** 18n; // one token for post-unpause supply

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy-p9 first.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const {
    emergencyModuleAddress,
    simpleLendingAddress: poolAddress,
    usd8Address,
  } = deployments;
  if (!emergencyModuleAddress || !poolAddress || !usd8Address) {
    throw new Error("Missing emergencyModuleAddress, simpleLendingAddress, or usd8Address in deployments.");
  }

  const emergencyModule = await hre.ethers.getContractAt("EmergencyModule", emergencyModuleAddress, deployer);
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress, deployer);
  const token = await hre.ethers.getContractAt("TestToken", usd8Address, deployer);

  const guardian = await emergencyModule.guardian();
  if (guardian.toLowerCase() !== deployerAddress.toLowerCase()) {
    throw new Error(`Script expects deployer to be guardian; guardian=${guardian}, deployer=${deployerAddress}`);
  }

  console.log("[EVIDENCE] Before pause: pool.paused() =", await pool.paused());

  // 1) Guardian calls emergencyPause(pool)
  const pauseTx = await emergencyModule.emergencyPause(poolAddress);
  const pauseReceipt = await pauseTx.wait();
  console.log("EmergencyModule.emergencyPause(pool) txHash:", pauseReceipt?.hash, "block:", pauseReceipt?.blockNumber);

  const pausedAfter = await pool.paused();
  console.log("[EVIDENCE] After emergencyPause: pool.paused() =", pausedAfter);
  if (!pausedAfter) throw new Error("Expected pool to be paused after emergencyPause");

  // 2) Supply should revert while paused (whenNotPaused)
  await token.approve(poolAddress, SUPPLY_AMOUNT).then((tx) => tx.wait());
  let supplyReverted = false;
  try {
    await pool.supply(SUPPLY_AMOUNT);
  } catch {
    supplyReverted = true;
  }
  if (!supplyReverted) throw new Error("Expected supply to revert when paused");
  console.log("[EVIDENCE] supply() reverted while paused (whenNotPaused).");

  // 3) PAUSER calls unpause to restore (deployer was granted PAUSER in P3 deploy)
  const unpauseTx = await pool.unpause();
  const unpauseReceipt = await unpauseTx.wait();
  console.log("Pool.unpause() txHash:", unpauseReceipt?.hash, "block:", unpauseReceipt?.blockNumber);

  const pausedAfterUnpause = await pool.paused();
  console.log("[EVIDENCE] After unpause: pool.paused() =", pausedAfterUnpause);
  if (pausedAfterUnpause) throw new Error("Expected pool to be unpaused after unpause()");

  // 4) After unpause, supply should succeed
  const supplyTx = await pool.supply(SUPPLY_AMOUNT);
  const supplyReceipt = await supplyTx.wait();
  console.log("Pool.supply(1e18) after unpause txHash:", supplyReceipt?.hash, "block:", supplyReceipt?.blockNumber);
  console.log("[EVIDENCE] supply() succeeded after unpause (Guardian/EmergencyModule E2E complete).");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
