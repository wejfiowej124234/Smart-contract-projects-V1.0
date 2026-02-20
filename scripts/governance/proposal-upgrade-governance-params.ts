/**
 * Institutional DAO: Create a proposal to upgrade governance parameters (Governor self-governed).
 * Targets the Governor; calldata = setVotingDelay / setVotingPeriod / setProposalThreshold / updateQuorumNumerator.
 * Prerequisite: deploy-p9 + transfer-admin; deployer has GOV and is self-delegated.
 * Usage: npx hardhat run scripts/governance/proposal-upgrade-governance-params.ts --network localhost
 *
 * Optional env: GOV_PARAM=delay|period|threshold|quorum (default: period), NEW_VALUE=number (e.g. 500 for period).
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const param = (process.env.GOV_PARAM ?? "period").toLowerCase();
const newValue = BigInt(process.env.NEW_VALUE ?? "500");

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
  const { governorAddress, governanceTokenAddress } = deployments;
  if (!governorAddress || !governanceTokenAddress) {
    throw new Error("Missing governorAddress or governanceTokenAddress.");
  }

  const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress, deployer);
  const token = await hre.ethers.getContractAt("GovernanceToken", governanceTokenAddress, deployer);

  const zero = "0x0000000000000000000000000000000000000000";
  const delegatesTo = await token.delegates(deployerAddress);
  const isDelegated = delegatesTo != null && delegatesTo !== zero && delegatesTo.toLowerCase() === deployerAddress.toLowerCase();
  if (!isDelegated) {
    const delTx = await (await token.delegate(deployerAddress)).wait();
    console.log("Delegated GOV txHash:", delTx?.hash);
    await hre.ethers.provider.send("evm_mine", []);
  }

  let calldata: string;
  let description: string;
  if (param === "delay") {
    calldata = governor.interface.encodeFunctionData("setVotingDelay", [newValue]);
    description = `Governance upgrade: setVotingDelay(${newValue})`;
  } else if (param === "period") {
    calldata = governor.interface.encodeFunctionData("setVotingPeriod", [newValue]);
    description = `Governance upgrade: setVotingPeriod(${newValue})`;
  } else if (param === "threshold") {
    calldata = governor.interface.encodeFunctionData("setProposalThreshold", [newValue]);
    description = `Governance upgrade: setProposalThreshold(${newValue})`;
  } else if (param === "quorum") {
    calldata = governor.interface.encodeFunctionData("updateQuorumNumerator", [newValue]);
    description = `Governance upgrade: updateQuorumNumerator(${newValue})`;
  } else {
    throw new Error(`Unknown GOV_PARAM=${param}. Use delay|period|threshold|quorum.`);
  }

  const targets = [governorAddress];
  const values = [0n];
  const calldatas = [calldata];
  const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  const propTx = await (await governor.propose(targets, values, calldatas, description)).wait();
  const snapshot = await governor.proposalSnapshot(proposalId);
  const deadline = await governor.proposalDeadline(proposalId);

  console.log("[EVIDENCE] Governance params upgrade proposal created (Governor self-governed).");
  console.log("  param =", param, "newValue =", newValue.toString());
  console.log("  proposalId ✅", proposalId.toString());
  console.log("  snapshot =", snapshot.toString(), "deadline =", deadline.toString());
  console.log("  txHash =", propTx?.hash);
  console.log("  Next: vote → queue → wait timelock → execute (or use full-lifecycle script).");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
