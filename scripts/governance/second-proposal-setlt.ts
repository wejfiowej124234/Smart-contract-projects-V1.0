/**
 * 12-upgrade flow §5.1 parameter change evidence: Governor proposes setLiquidationThreshold(asset, 81) → vote → queue → execute.
 * Prereq: p9:full run (first-proposal executed); deployer has delegated and can propose.
 * Usage: npx hardhat run scripts/governance/second-proposal-setlt.ts --network localhost
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const NEW_LT = 81n;

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

  await (await token.delegate(deployerAddress)).wait();

  const targets = [configuratorAddress];
  const values = [0n];
  const calldatas = [
    configurator.interface.encodeFunctionData("setLiquidationThreshold", [poolTokenAddress, NEW_LT]),
  ];
  const description = "12 parameter change: set LiquidationThreshold to 81";

  const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  const propTx = await (await governor.propose(targets, values, calldatas, description)).wait();
  console.log("[12-param-change] Propose setLiquidationThreshold(81) txHash:", propTx?.hash, "block:", propTx?.blockNumber);

  const votingDelay = await governor.votingDelay();
  for (let i = 0; i < Number(votingDelay) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }
  const voteTx = await (await governor.castVote(proposalId, 1)).wait();
  console.log("[12-param-change] CastVote txHash:", voteTx?.hash, "block:", voteTx?.blockNumber);

  const votingPeriod = await governor.votingPeriod();
  for (let i = 0; i < Number(votingPeriod) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }
  const queueTx = await (await governor.queue(targets, values, calldatas, descriptionHash)).wait();
  console.log("[12-param-change] Queue txHash:", queueTx?.hash, "block:", queueTx?.blockNumber);

  const timelockAddress = await governor.timelock();
  const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);
  const minDelay = await timelock.getMinDelay();
  await hre.ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
  await hre.ethers.provider.send("evm_mine", []);

  const execTx = await (await governor.execute(targets, values, calldatas, descriptionHash)).wait();
  console.log("[12-param-change] Execute txHash:", execTx?.hash, "block:", execTx?.blockNumber);

  const poolAddr = poolAddress ?? deployments.simpleLendingAddress;
  if (!poolAddr) throw new Error("Missing simpleLendingAddress");
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddr);
  const data = await pool.getReserveData(poolTokenAddress);
  const lt = (data as unknown[])[1];
  const ltNum = BigInt(lt?.toString() ?? "0");
  if (ltNum !== NEW_LT) throw new Error(`Expected LT ${NEW_LT}, got ${ltNum}`);
  console.log("[EVIDENCE] liquidationThreshold =", ltNum.toString(), "(12 param-change evidence)");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
