/**
 * P9 deployment: GovernanceToken, TimelockController, GovernorP9, EmergencyModule, and role wiring.
 * Parameters are taken from the profile (loadProfile) so that the same script works across environments.
 * Prerequisite: P0–P8 deployed and deployments/<chainId>.json present.
 * Usage: npm run deploy:p9 (or npx hardhat run scripts/deploy/deploy-p9.ts --network localhost).
 * Why: Governance and emergency roles must be deployed and wired once per chain so that proposals and Guardian pause work.
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import { exportArtifacts, type DeploymentsJson } from "../_lib/export";
import { loadProfile } from "../config/loadProfile";

const GOVERNANCE_TOKEN_NAME = "Governance Token";
const GOVERNANCE_TOKEN_SYMBOL = "GOV";
const INITIAL_SUPPLY = 1_000_000n * 10n ** 18n;

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const profile = loadProfile(chainId);
  if (!profile.chainIds.includes(chainId)) {
    throw new Error(`chainId ${chainId} not allowed for profile mode=${profile.mode}.`);
  }

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run P0–P8 deploy first.`);
  }
  const existing = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const poolAddress = existing.simpleLendingAddress;
  const configuratorAddress = existing.configuratorAddress;
  const proxyAdminAddress = existing.proxyAdminAddress;
  const usd8Address = existing.usd8Address;
  if (!poolAddress || !configuratorAddress || !proxyAdminAddress || !usd8Address) {
    throw new Error("Deployments must include simpleLendingAddress, configuratorAddress, proxyAdminAddress, usd8Address.");
  }

  const g = profile.governance;
  const guardian = g.guardian === "deployer" || !g.guardian ? deployerAddress : hre.ethers.getAddress(g.guardian);

  console.log("P9 deploy: GovernanceToken -> TimelockController -> GovernorP9 -> EmergencyModule (profile-driven)");

  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken", deployer);
  const govToken = await GovernanceToken.deploy(GOVERNANCE_TOKEN_NAME, GOVERNANCE_TOKEN_SYMBOL, INITIAL_SUPPLY);
  await govToken.waitForDeployment();
  const governanceTokenAddress = await govToken.getAddress();
  const govReceipt = govToken.deploymentTransaction()
    ? await hre.ethers.provider.getTransactionReceipt(govToken.deploymentTransaction()!.hash)
    : null;
  console.log("GovernanceToken:", governanceTokenAddress, "txHash:", govReceipt?.hash, "block:", govReceipt?.blockNumber);

  const TimelockController = await hre.ethers.getContractFactory("TimelockController", deployer);
  const proposers: string[] = [];
  const executors: string[] = [];
  const timelock = await TimelockController.deploy(g.timelockMinDelaySeconds, proposers, executors, deployerAddress);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  const tlReceipt = timelock.deploymentTransaction()
    ? await hre.ethers.provider.getTransactionReceipt(timelock.deploymentTransaction()!.hash)
    : null;
  console.log("TimelockController:", timelockAddress, "txHash:", tlReceipt?.hash, "block:", tlReceipt?.blockNumber);

  const GovernorP9 = await hre.ethers.getContractFactory("GovernorP9", deployer);
  const governor = await GovernorP9.deploy(
    "GovernorP9",
    governanceTokenAddress,
    timelockAddress,
    g.votingDelayBlocks,
    g.votingPeriodBlocks,
    g.proposalThreshold,
    g.quorumNumerator
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  const govDeployReceipt = governor.deploymentTransaction()
    ? await hre.ethers.provider.getTransactionReceipt(governor.deploymentTransaction()!.hash)
    : null;
  console.log("GovernorP9:", governorAddress, "txHash:", govDeployReceipt?.hash, "block:", govDeployReceipt?.blockNumber);

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const r1 = await (await timelock.grantRole(PROPOSER_ROLE, governorAddress)).wait();
  await (await timelock.grantRole(EXECUTOR_ROLE, governorAddress)).wait();
  console.log("Timelock: granted PROPOSER/EXECUTOR to Governor txHash:", r1?.hash, "block:", r1?.blockNumber);

  const EmergencyModule = await hre.ethers.getContractFactory("EmergencyModule", deployer);
  const emergencyModule = await EmergencyModule.deploy(guardian);
  await emergencyModule.waitForDeployment();
  const emergencyModuleAddress = await emergencyModule.getAddress();
  const emReceipt = emergencyModule.deploymentTransaction()
    ? await hre.ethers.provider.getTransactionReceipt(emergencyModule.deploymentTransaction()!.hash)
    : null;
  console.log("EmergencyModule:", emergencyModuleAddress, "txHash:", emReceipt?.hash, "block:", emReceipt?.blockNumber);

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddress);
  const pauserTx = await (await pool.grantPauser(emergencyModuleAddress)).wait();
  console.log("Pool: granted PAUSER to EmergencyModule txHash:", pauserTx?.hash, "block:", pauserTx?.blockNumber);

  const deployments: DeploymentsJson = {
    ...existing,
    governanceTokenAddress,
    timelockAddress,
    governorAddress,
    emergencyModuleAddress,
  };
  await exportArtifacts(hre, deployments);
  console.log("P9 addresses written to deployments and frontend.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
