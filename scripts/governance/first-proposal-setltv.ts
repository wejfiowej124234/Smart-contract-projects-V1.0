/**
 * P9: Run one full governance cycle: propose setLTV(asset, 76) -> vote -> queue -> wait delay -> execute.
 * Prerequisite: deploy-p9 and transfer-admin-to-timelock done; deployer has GOV tokens and has delegated to self.
 * Usage: npx hardhat run scripts/governance/first-proposal-setltv.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const NEW_LTV = 76n;

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
    governorAddress,
    governanceTokenAddress,
    configuratorAddress,
    simpleLendingAddress: poolAddress,
    usd8Address: poolTokenAddress,
  } = deployments;
  if (!governorAddress || !governanceTokenAddress || !configuratorAddress || !poolTokenAddress) {
    throw new Error("Missing governorAddress, governanceTokenAddress, configuratorAddress, or usd8Address in deployments.");
  }

  const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress, deployer);
  const token = await hre.ethers.getContractAt("GovernanceToken", governanceTokenAddress, deployer);
  const configurator = await hre.ethers.getContractAt("PoolConfigurator", configuratorAddress);

  const delTx = await (await token.delegate(deployerAddress)).wait();
  console.log("Delegated GOV txHash:", delTx?.hash, "block:", delTx?.blockNumber);

  const targets = [configuratorAddress];
  const values = [0n];
  const calldatas = [
    configurator.interface.encodeFunctionData("setLTV", [poolTokenAddress, NEW_LTV]),
  ];
  const description = "First governance proposal: set LTV to 76";

  const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  const propTx = await (await governor.propose(targets, values, calldatas, description)).wait();
  console.log("Propose txHash:", propTx?.hash, "block:", propTx?.blockNumber, "proposalId:", proposalId.toString());
  console.log("proposalId ✅", proposalId.toString());
  const calldata0 = calldatas[0] ?? "";
  const calldataLen = calldata0.length;
  const calldataKeccak = hre.ethers.keccak256(hre.ethers.getBytes(calldata0));
  console.log("calldata.length =", calldataLen, "keccak256(calldata[0]) =", calldataKeccak, "✅");

  const votingDelay = await governor.votingDelay();
  for (let i = 0; i < Number(votingDelay) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }

  const voteTx = await (await governor.castVote(proposalId, 1)).wait();
  console.log("CastVote txHash:", voteTx?.hash, "block:", voteTx?.blockNumber);

  const votingPeriod = await governor.votingPeriod();
  for (let i = 0; i < Number(votingPeriod) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }

  const queueTx = await (await governor.queue(targets, values, calldatas, descriptionHash)).wait();
  console.log("Queue txHash:", queueTx?.hash, "block:", queueTx?.blockNumber);

  const timelockAddress = await governor.timelock();
  const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);
  const minDelay = await timelock.getMinDelay();
  await hre.ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
  await hre.ethers.provider.send("evm_mine", []);

  const execTx = await (await governor.execute(targets, values, calldatas, descriptionHash)).wait();
  console.log("Execute txHash:", execTx?.hash, "block:", execTx?.blockNumber);

  const poolAddr = poolAddress ?? deployments.simpleLendingAddress;
  if (!poolAddr) throw new Error("Missing simpleLendingAddress");
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddr);
  const data = await pool.getReserveData(poolTokenAddress);
  const ltv = typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0];
  if (BigInt(ltv.toString()) !== NEW_LTV) {
    throw new Error(`Expected LTV ${NEW_LTV}, got ${ltv}`);
  }
  console.log("[EVIDENCE] LTV =", ltv.toString(), "(P9-Execution Complete)");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
