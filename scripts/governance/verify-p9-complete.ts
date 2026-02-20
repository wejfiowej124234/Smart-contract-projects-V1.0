/**
 * P9: Verify V1–V8 (governance contracts deployed, permissions on Timelock, one full cycle executed).
 * Prerequisite: deploy-p9 and (optionally) one full governance cycle run; deployments/<chainId>.json present.
 * Usage: npx hardhat run scripts/governance/verify-p9-complete.ts --network localhost
 * Exit 0 only if all checks pass.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

async function hasCode(address: string): Promise<boolean> {
  const code = await hre.ethers.provider.getCode(address);
  return code !== "0x" && code.length > 2;
}

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    console.error("V0: deployments not found:", deploymentsPath);
    process.exitCode = 1;
    return;
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const {
    governanceTokenAddress,
    timelockAddress,
    governorAddress,
    emergencyModuleAddress,
    configuratorAddress,
    proxyAdminAddress,
    simpleLendingAddress,
    usd8Address,
  } = deployments;

  let failed = 0;

  if (!governanceTokenAddress || !(await hasCode(governanceTokenAddress))) {
    console.error("V1 Fail: GovernanceToken not deployed or no code at", governanceTokenAddress);
    failed++;
  } else console.log("V1 Pass: GovernanceToken has code");

  if (!timelockAddress || !(await hasCode(timelockAddress))) {
    console.error("V2 Fail: TimelockController not deployed or no code at", timelockAddress);
    failed++;
  } else console.log("V2 Pass: TimelockController has code");

  if (!governorAddress || !(await hasCode(governorAddress))) {
    console.error("V3 Fail: Governor not deployed or no code at", governorAddress);
    failed++;
  } else console.log("V3 Pass: Governor has code");

  if (!emergencyModuleAddress || !(await hasCode(emergencyModuleAddress))) {
    console.error("V4 Fail: EmergencyModule not deployed or no code at", emergencyModuleAddress);
    failed++;
  } else console.log("V4 Pass: EmergencyModule has code");

  if (configuratorAddress && timelockAddress) {
    const configurator = await hre.ethers.getContractAt("PoolConfigurator", configuratorAddress);
    const admin = await configurator.admin();
    console.log("[EVIDENCE] Configurator.admin =", admin);
    if (admin.toLowerCase() !== timelockAddress.toLowerCase()) {
      console.error("V5 Fail: PoolConfigurator.admin !== Timelock", admin, "!=", timelockAddress);
      failed++;
    } else console.log("V5 Pass: PoolConfigurator.admin == Timelock");
  } else {
    console.error("V5 Skip: missing configurator or timelock in deployments");
    failed++;
  }

  if (proxyAdminAddress && timelockAddress) {
    const proxyAdmin = await hre.ethers.getContractAt("ProxyAdmin", proxyAdminAddress);
    const owner = await proxyAdmin.owner();
    console.log("[EVIDENCE] ProxyAdmin.owner =", owner);
    if (owner.toLowerCase() !== timelockAddress.toLowerCase()) {
      console.error("V6 Fail: ProxyAdmin.owner !== Timelock", owner, "!=", timelockAddress);
      failed++;
    } else console.log("V6 Pass: ProxyAdmin.owner == Timelock");
  } else {
    console.error("V6 Skip: missing proxyAdmin or timelock");
    failed++;
  }

  if (simpleLendingAddress && timelockAddress) {
    const pool = await hre.ethers.getContractAt("LendingPoolImpl", simpleLendingAddress);
    const owner = await pool.owner();
    console.log("[EVIDENCE] Pool.owner =", owner);
    if (owner.toLowerCase() !== timelockAddress.toLowerCase()) {
      console.error("V7 Fail: Pool.owner !== Timelock", owner, "!=", timelockAddress);
      failed++;
    } else console.log("V7 Pass: Pool.owner == Timelock");
  } else {
    console.error("V7 Skip: missing pool or timelock");
    failed++;
  }

  if (simpleLendingAddress && usd8Address) {
    const pool = await hre.ethers.getContractAt("LendingPoolImpl", simpleLendingAddress);
    const data = await pool.getReserveData(usd8Address);
    const ltv = typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0];
    console.log("[EVIDENCE] LTV =", ltv.toString());
    if (BigInt(ltv.toString()) !== 76n) {
      console.error("V8 Fail: LTV not 76 (first proposal setLTV(76) not executed?)", "got", ltv.toString());
      failed++;
    } else console.log("V8 Pass: Pool LTV == 76 (governance cycle executed)");
  } else {
    console.error("V8 Skip: missing pool or usd8 in deployments");
    failed++;
  }

  if (failed > 0) {
    console.error("\nP9-Execution Complete: FAILED", failed, "check(s)");
    process.exitCode = 1;
  } else {
    console.log("\nP9-Execution Complete: all V1–V8 passed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
