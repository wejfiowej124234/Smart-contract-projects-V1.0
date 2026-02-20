/**
 * Protocol-level: Verify multi-layer recovery paths (L1 Guardian, L2 Timelock admin, L3 ProxyAdmin owner).
 * Ensures no single point of failure and that recovery actors are set. In production these should be multi-sig.
 * Prerequisite: deploy-p9 run; deployments/<chainId>.json with emergencyModule, timelock, proxyAdmin.
 * Usage: npx hardhat run scripts/governance/verify-recovery-paths.ts --network localhost
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
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy-p9 first.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const {
    emergencyModuleAddress,
    timelockAddress,
    proxyAdminAddress,
  } = deployments;

  let failed = 0;

  console.log("--- Recovery path verification (Protocol-level) ---\n");

  if (emergencyModuleAddress) {
    const emergency = await hre.ethers.getContractAt("EmergencyModule", emergencyModuleAddress);
    const guardian = await emergency.guardian();
    if (guardian === "0x0000000000000000000000000000000000000000") {
      console.log("L1 FAIL: EmergencyModule.guardian is zero");
      failed++;
    } else {
      console.log("L1 OK: EmergencyModule.guardian =", guardian, "(pool emergency pause only)");
    }
  } else {
    console.log("L1 SKIP: no emergencyModuleAddress in deployments");
    failed++;
  }

  if (timelockAddress) {
    const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);
    const minDelay = await timelock.getMinDelay();
    console.log("L2 OK: Timelock present, minDelay =", minDelay.toString(), "(recovery = TIMELOCK_ADMIN_ROLE; verify multi-sig in deployment)");
  } else {
    console.log("L2 SKIP: no timelockAddress");
    failed++;
  }

  if (proxyAdminAddress) {
    const proxyAdmin = await hre.ethers.getContractAt("ProxyAdmin", proxyAdminAddress);
    const owner = await proxyAdmin.owner();
    if (owner === "0x0000000000000000000000000000000000000000") {
      console.log("L3 FAIL: ProxyAdmin.owner is zero");
      failed++;
    } else {
      console.log("L3 OK: ProxyAdmin.owner =", owner, "(upgrade recovery)");
    }
  } else {
    console.log("L3 SKIP: no proxyAdminAddress");
    failed++;
  }

  const governorAddress = deployments.governorAddress;
  if (governorAddress) {
    const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress);
    const cap = await governor.MAX_PROPOSAL_ACTIONS();
    console.log("\nGovernorP9.MAX_PROPOSAL_ACTIONS =", cap.toString(), "(gas/queue resilience)");
  }

  console.log("\n---");
  if (failed > 0) {
    console.log("Result: FAILED", failed, "check(s). Fix deployments or run deploy-p9.");
    process.exitCode = 1;
  } else {
    console.log("Result: All recovery paths present. In production, L2/L3 should be multi-sig.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
