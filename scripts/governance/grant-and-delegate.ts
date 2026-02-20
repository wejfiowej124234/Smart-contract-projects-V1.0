/**
 * Local governance bootstrap: transfer GOV from the deployer to a given address so it can vote.
 * After the transfer, the recipient must delegate to themselves in the UI (“Delegate”); otherwise voting power stays zero.
 * Prerequisite: deploy-p9 run; chainId 31337 (localhost).
 * Why: Enables a recipient to vote on governance proposals by holding GOV and delegating to self; required before creating or voting on proposals.
 *
 * Usage:
 *   npx hardhat run scripts/governance/grant-and-delegate.ts --network localhost
 *   npx hardhat run scripts/governance/grant-and-delegate.ts --network localhost -- <recipient address>
 *
 * If <recipient address> is omitted, we use env GRANT_GOV_TO; if that’s unset we send to the deployer (for local testing).
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const DEFAULT_GRANT_RAW = 20_000n * 10n ** 18n; // 20,000 GOV (same units as frontend: 18 decimals)
const EXPECTED_CHAIN_ID = 31337;

async function hasCode(address: string): Promise<boolean> {
  const code = await hre.ethers.provider.getCode(address);
  return code != null && code !== "0x" && code.length > 2;
}

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy-p9 first. See docs/09.`);
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as DeploymentsJson;
  const { governanceTokenAddress, governorAddress } = deployments;

  if (!governanceTokenAddress || !governorAddress) {
    throw new Error("Missing governanceTokenAddress or governorAddress in deployments. Run deploy-p9 first.");
  }

  // P1 SSOT guard: we fail fast if the chain was reset or deployments are stale, so we don’t silently send to wrong state
  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(`Expected chainId ${EXPECTED_CHAIN_ID} (localhost). Got ${chainId}. Use --network localhost.`);
  }
  if (!(await hasCode(governanceTokenAddress)) || !(await hasCode(governorAddress))) {
    throw new Error(
      "Governance token or Governor has no code at deployments addresses. Chain may have reset. Run deploy:p9 and restart frontend per docs/09."
    );
  }

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  const recipientArg = process.argv.find((a) => a.startsWith("0x") && a.length === 42);
  const recipient =
    recipientArg ?? process.env.GRANT_GOV_TO ?? deployerAddress;

  const token = await hre.ethers.getContractAt("GovernanceToken", governanceTokenAddress, deployer);
  const balanceBefore = await token.balanceOf(recipient);

  const tx = await token.transfer(recipient, DEFAULT_GRANT_RAW);
  const receipt = await tx.wait();
  const blockNumber = receipt?.blockNumber ?? 0;

  const balanceAfter = await token.balanceOf(recipient);
  const delegatesTo = await token.delegates(recipient);
  const zero = "0x0000000000000000000000000000000000000000";
  const isDelegated = delegatesTo != null && delegatesTo !== zero && delegatesTo.toLowerCase() === recipient.toLowerCase();

  // If the recipient is the deployer, we self-delegate so the gate checks pass
  if (recipient.toLowerCase() === deployerAddress.toLowerCase() && !isDelegated) {
    await (await token.delegate(deployerAddress)).wait();
    await hre.ethers.provider.send("evm_mine", []);
  }

  const delegatesAfter = await token.delegates(recipient);
  const delegatedSelf =
    delegatesAfter != null &&
    delegatesAfter !== zero &&
    delegatesAfter.toLowerCase() === recipient.toLowerCase();

  const governor = await hre.ethers.getContractAt("GovernorP9", governorAddress, deployer);
  const latestBlock = await hre.ethers.provider.getBlockNumber();
  const blockMinus1 = blockNumber > 0 ? blockNumber - 1 : 0;
  const blockPlus1 = blockNumber + 1;
  const [quorumAtLatest, proposalThreshold] = await Promise.all([
    governor.quorum(latestBlock),
    governor.proposalThreshold(),
  ]);
  const requiredVotes = quorumAtLatest > proposalThreshold ? quorumAtLatest : proposalThreshold;

  const [votesAtBlockMinus1, votesAtBlock, votesAtBlockPlus1, votesAtLatest] = await Promise.all([
    governor.getVotes(recipient, blockMinus1),
    governor.getVotes(recipient, blockNumber),
    governor.getVotes(recipient, blockPlus1),
    governor.getVotes(recipient, latestBlock),
  ]);
  const votesVisible =
    votesAtBlockMinus1 >= requiredVotes ||
    votesAtBlock >= requiredVotes ||
    votesAtBlockPlus1 >= requiredVotes ||
    votesAtLatest >= requiredVotes;

  const govBalanceOk = balanceAfter >= DEFAULT_GRANT_RAW;
  const delegateSet = delegatedSelf;
  const votesVisibleOk = votesVisible;

  console.log("Grant GOV txHash:", receipt?.hash, "block:", blockNumber);
  console.log("Recipient:", recipient);
  console.log("Granted:", DEFAULT_GRANT_RAW.toString(), "raw (20000 GOV)");
  console.log("Balance before:", balanceBefore.toString(), "-> after:", balanceAfter.toString());
  console.log("quorum(latest)=" + quorumAtLatest.toString(), "proposalThreshold=" + proposalThreshold.toString(), "requiredVotes=" + requiredVotes.toString());
  console.log("delegates(recipient):", delegatesAfter ?? "—");
  console.log("getVotes(recipient, block-1=" + blockMinus1 + "):", votesAtBlockMinus1.toString());
  console.log("getVotes(recipient, block=" + blockNumber + "):", votesAtBlock.toString());
  console.log("getVotes(recipient, block+1=" + blockPlus1 + "):", votesAtBlockPlus1.toString());
  console.log("getVotes(recipient, latest=" + latestBlock + "):", votesAtLatest.toString());
  console.log("");
  console.log("--- Gate check ---");
  console.log("GOV_BALANCE_OK=" + (govBalanceOk ? "true" : "false"));
  console.log("DELEGATE_SET=" + (delegateSet ? "true" : "false"));
  console.log("VOTES_VISIBLE=" + (votesVisibleOk ? "true" : "false"));
  if (!delegateSet && recipient.toLowerCase() !== deployerAddress.toLowerCase()) {
    console.log("");
    console.log("--- Next (required) ---");
    console.log("Connect with the recipient address, open Governance, click Delegate and delegate to yourself.");
    console.log("Without delegating, voting power stays 0; after delegating, wait 1 block for votes to show on-chain. See docs/15.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
