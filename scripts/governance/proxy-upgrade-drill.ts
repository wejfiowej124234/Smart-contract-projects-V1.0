/**
 * 12-upgrade flow §3 implementation upgrade drill: deploy new LendingPoolImpl, propose ProxyAdmin.upgrade(proxy, newImpl) via Governor → vote → queue → execute, then verify implementation switched.
 * Prereq: p9:full has been run; ProxyAdmin.owner = Timelock; Governor can execute Timelock calls.
 * Usage: npx hardhat run scripts/governance/proxy-upgrade-drill.ts --network localhost
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
  const deployerAddress = await deployer.getAddress();

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run p9:full first.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const {
    governorAddress,
    governanceTokenAddress,
    proxyAdminAddress,
    simpleLendingAddress: proxyAddress,
    usd8Address: poolTokenAddress,
  } = deployments;
  if (!governorAddress || !governanceTokenAddress || !proxyAdminAddress || !proxyAddress) {
    throw new Error("Missing governorAddress, governanceTokenAddress, proxyAdminAddress, or simpleLendingAddress.");
  }

  const proxyAdmin = await hre.ethers.getContractAt("ProxyAdmin", proxyAdminAddress);
  const currentImpl = await proxyAdmin.getProxyImplementation(proxyAddress);
  console.log("[12-upgrade-drill] Current implementation =", currentImpl);

  const LendingPoolImpl = await hre.ethers.getContractFactory("LendingPoolImpl", deployer);
  const newImpl = await LendingPoolImpl.deploy();
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  const deployReceipt = newImpl.deploymentTransaction()
    ? await hre.ethers.provider.getTransactionReceipt(newImpl.deploymentTransaction()!.hash)
    : null;
  console.log("[12-upgrade-drill] New LendingPoolImpl deployed:", newImplAddress, "txHash:", deployReceipt?.hash, "block:", deployReceipt?.blockNumber);

  const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress, deployer);
  const token = await hre.ethers.getContractAt("GovernanceToken", governanceTokenAddress, deployer);

  await (await token.delegate(deployerAddress)).wait();

  const targets = [proxyAdminAddress];
  const values = [0n];
  const calldatas = [
    proxyAdmin.interface.encodeFunctionData("upgrade", [proxyAddress, newImplAddress]),
  ];
  const description = "12 implementation upgrade drill: ProxyAdmin.upgrade(proxy, newImpl)";

  const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  const propTx = await (await governor.propose(targets, values, calldatas, description)).wait();
  console.log("[12-upgrade-drill] Propose upgrade txHash:", propTx?.hash, "block:", propTx?.blockNumber);

  const votingDelay = await governor.votingDelay();
  for (let i = 0; i < Number(votingDelay) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }
  const voteTx = await (await governor.castVote(proposalId, 1)).wait();
  console.log("[12-upgrade-drill] CastVote txHash:", voteTx?.hash, "block:", voteTx?.blockNumber);

  const votingPeriod = await governor.votingPeriod();
  for (let i = 0; i < Number(votingPeriod) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }
  const queueTx = await (await governor.queue(targets, values, calldatas, descriptionHash)).wait();
  console.log("[12-upgrade-drill] Queue txHash:", queueTx?.hash, "block:", queueTx?.blockNumber);

  const timelockAddress = await governor.timelock();
  const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);
  const minDelay = await timelock.getMinDelay();
  await hre.ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
  await hre.ethers.provider.send("evm_mine", []);

  const execTx = await (await governor.execute(targets, values, calldatas, descriptionHash)).wait();
  console.log("[12-upgrade-drill] Execute upgrade txHash:", execTx?.hash, "block:", execTx?.blockNumber);

  const implAfter = await proxyAdmin.getProxyImplementation(proxyAddress);
  if (implAfter.toLowerCase() !== newImplAddress.toLowerCase()) {
    throw new Error(`Expected implementation ${newImplAddress}, got ${implAfter}`);
  }
  console.log("[EVIDENCE] getProxyImplementation(proxy) =", implAfter, "(12 upgrade drill done)");

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", proxyAddress);
  const data = await pool.getReserveData(poolTokenAddress);
  const ltv = (data as unknown[])[0];
  console.log("[EVIDENCE] Pool.getReserveData LTV (post-upgrade) =", ltv?.toString(), "(view OK)");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
