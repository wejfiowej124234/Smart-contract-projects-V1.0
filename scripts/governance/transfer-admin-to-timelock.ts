/**
 * P9: Transfer PoolConfigurator.admin, ProxyAdmin.owner, and Pool.owner to Timelock.
 * Prerequisite: deploy-p9.ts has been run; deployments/<chainId>.json has timelockAddress.
 * Usage: npx hardhat run scripts/governance/transfer-admin-to-timelock.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy-p9 first.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const timelockAddress = deployments.timelockAddress;
  const configuratorAddress = deployments.configuratorAddress;
  const proxyAdminAddress = deployments.proxyAdminAddress;
  const poolAddress = deployments.simpleLendingAddress;
  if (!timelockAddress || !configuratorAddress || !proxyAdminAddress || !poolAddress) {
    throw new Error("Deployments must include timelockAddress, configuratorAddress, proxyAdminAddress, simpleLendingAddress.");
  }

  const configurator = await hre.ethers.getContractAt("PoolConfigurator", configuratorAddress, deployer);
  const currentConfigAdmin = await configurator.admin();
  if (currentConfigAdmin.toLowerCase() !== timelockAddress.toLowerCase()) {
    const tx1 = await configurator.setAdmin(timelockAddress);
    const r1 = await tx1.wait();
    console.log("PoolConfigurator.setAdmin txHash:", r1?.hash, "block:", r1?.blockNumber);
  }
  const configAdmin = await configurator.admin();
  console.log("[EVIDENCE] Configurator.admin =", configAdmin);
  if (configAdmin.toLowerCase() !== timelockAddress.toLowerCase()) {
    throw new Error(`Configurator admin must be Timelock; got ${configAdmin}`);
  }
  console.log("configurator.admin == timelock.address ✅");

  const proxyAdmin = await hre.ethers.getContractAt("ProxyAdmin", proxyAdminAddress, deployer);
  const currentProxyOwner = await proxyAdmin.owner();
  if (currentProxyOwner.toLowerCase() !== timelockAddress.toLowerCase()) {
    const tx2 = await proxyAdmin.transferOwnership(timelockAddress);
    const r2 = await tx2.wait();
    console.log("ProxyAdmin.transferOwnership txHash:", r2?.hash, "block:", r2?.blockNumber);
  }
  const proxyOwner = await proxyAdmin.owner();
  console.log("[EVIDENCE] ProxyAdmin.owner =", proxyOwner);

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress, deployer);
  const currentPoolOwner = await pool.owner();
  if (currentPoolOwner.toLowerCase() !== timelockAddress.toLowerCase()) {
    const tx3 = await pool.transferOwnership(timelockAddress);
    const r3 = await tx3.wait();
    console.log("Pool.transferOwnership txHash:", r3?.hash, "block:", r3?.blockNumber);
  }
  const poolOwner = await pool.owner();
  console.log("[EVIDENCE] Pool.owner =", poolOwner);

  console.log("Transfer-admin-to-timelock done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
