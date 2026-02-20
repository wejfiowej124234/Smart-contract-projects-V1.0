/**
 * Governance Full Lifecycle Evidence Pack (docs/15 release closure).
 * Runs: propose → snapshot → vote → quorum met → queue → timelock → execute,
 * collects txHash + snapshot/quorum/votes at each step + post-execution state,
 * writes evidence-pack/governance-full-lifecycle.json and .sha256.
 *
 * Prerequisite: deploy-p9 + transfer-admin-to-timelock; deployer has GOV and is self-delegated.
 * Usage: npx hardhat run scripts/governance/full-lifecycle-evidence-pack.ts --network localhost
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import hre from "hardhat";
import type { DeploymentsJson } from "../_lib/export";

const NEW_LTV = 76n;
const EVIDENCE_PACK_DIR = path.join(process.cwd(), "evidence-pack");
const LIFECYCLE_EVIDENCE_FILE = "governance-full-lifecycle.json";
const LIFECYCLE_SHA256_FILE = "governance-full-lifecycle.sha256";
const SCHEMA_VERSION = 1;

function sha256Hex(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

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

  const evidence: {
    schemaVersion: number;
    chainId: number;
    governorAddress: string;
    govTokenAddress: string;
    runAt: string;
    steps: {
      delegate?: { txHash: string; blockNumber: number };
      propose: {
        txHash: string;
        blockNumber: number;
        proposalId: string;
        snapshot: string;
        deadline: string;
        quorumAtSnapshot: string;
        votesAtSnapshot: string;
      };
      vote: {
        txHash: string;
        blockNumber: number;
        proposalVotes: { for: string; against: string; abstain: string };
      };
      queue: { txHash: string; blockNumber: number; eta: string };
      execute: { txHash: string; blockNumber: number };
    };
    postExecutionState: { reserveLtv: string };
  } = {
    schemaVersion: SCHEMA_VERSION,
    chainId,
    governorAddress,
    govTokenAddress: governanceTokenAddress,
    runAt: new Date().toISOString(),
    steps: {} as typeof evidence.steps,
    postExecutionState: { reserveLtv: "" },
  };

  const zero = "0x0000000000000000000000000000000000000000";
  const delegatesTo = await token.delegates(deployerAddress);
  const isDelegated = delegatesTo != null && delegatesTo !== zero && delegatesTo.toLowerCase() === deployerAddress.toLowerCase();
  if (!isDelegated) {
    const delTx = await (await token.delegate(deployerAddress)).wait();
    evidence.steps.delegate = { txHash: delTx?.hash ?? "", blockNumber: delTx?.blockNumber ?? 0 };
    await hre.ethers.provider.send("evm_mine", []);
  }

  const targets = [configuratorAddress];
  const values = [0n];
  const calldatas = [
    configurator.interface.encodeFunctionData("setLTV", [poolTokenAddress, NEW_LTV]),
  ];
  const description = "Governance Full Lifecycle Evidence: set LTV to 76";
  const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  const propTx = await (await governor.propose(targets, values, calldatas, description)).wait();
  const snapshot = await governor.proposalSnapshot(proposalId);
  const deadline = await governor.proposalDeadline(proposalId);
  const quorumAtSnapshot = await governor.quorum(snapshot);
  const votesAtSnapshot = await governor.getVotes(deployerAddress, snapshot);

  evidence.steps.propose = {
    txHash: propTx?.hash ?? "",
    blockNumber: propTx?.blockNumber ?? 0,
    proposalId: proposalId.toString(),
    snapshot: snapshot.toString(),
    deadline: deadline.toString(),
    quorumAtSnapshot: quorumAtSnapshot.toString(),
    votesAtSnapshot: votesAtSnapshot.toString(),
  };

  const votingDelay = await governor.votingDelay();
  for (let i = 0; i < Number(votingDelay) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }

  const voteTx = await (await governor.castVote(proposalId, 1)).wait();
  const [forVotes, againstVotes, abstainVotes] = await governor.proposalVotes(proposalId);
  evidence.steps.vote = {
    txHash: voteTx?.hash ?? "",
    blockNumber: voteTx?.blockNumber ?? 0,
    proposalVotes: {
      for: forVotes.toString(),
      against: againstVotes.toString(),
      abstain: abstainVotes.toString(),
    },
  };

  const votingPeriod = await governor.votingPeriod();
  for (let i = 0; i < Number(votingPeriod) + 1; i++) {
    await hre.ethers.provider.send("evm_mine", []);
  }

  const queueTx = await (await governor.queue(targets, values, calldatas, descriptionHash)).wait();
  const eta = await governor.proposalEta(proposalId);
  evidence.steps.queue = {
    txHash: queueTx?.hash ?? "",
    blockNumber: queueTx?.blockNumber ?? 0,
    eta: eta.toString(),
  };

  const timelockAddress = await governor.timelock();
  const timelock = await hre.ethers.getContractAt("TimelockController", timelockAddress);
  const minDelay = await timelock.getMinDelay();
  await hre.ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
  await hre.ethers.provider.send("evm_mine", []);

  const execTx = await (await governor.execute(targets, values, calldatas, descriptionHash)).wait();
  evidence.steps.execute = {
    txHash: execTx?.hash ?? "",
    blockNumber: execTx?.blockNumber ?? 0,
  };

  const poolAddr = poolAddress ?? deployments.simpleLendingAddress;
  if (!poolAddr) throw new Error("Missing simpleLendingAddress");
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", poolAddr);
  const data = await pool.getReserveData(poolTokenAddress);
  const ltv = typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0];
  evidence.postExecutionState.reserveLtv = ltv.toString();
  if (BigInt(ltv.toString()) !== NEW_LTV) {
    throw new Error(`Expected LTV ${NEW_LTV}, got ${ltv}`);
  }

  if (!fs.existsSync(EVIDENCE_PACK_DIR)) {
    fs.mkdirSync(EVIDENCE_PACK_DIR, { recursive: true });
  }
  const packPath = path.join(EVIDENCE_PACK_DIR, LIFECYCLE_EVIDENCE_FILE);
  const sha256Path = path.join(EVIDENCE_PACK_DIR, LIFECYCLE_SHA256_FILE);
  const json = JSON.stringify(evidence, null, 2);
  fs.writeFileSync(packPath, json, "utf-8");
  const hash = sha256Hex(json);
  fs.writeFileSync(sha256Path, hash + "\n", "utf-8");

  console.log("[EVIDENCE] Governance Full Lifecycle complete.");
  console.log("  propose → snapshot → vote → quorum met → queue → timelock → execute");
  console.log("  Evidence pack:", packPath);
  console.log("GOVERNANCE-FULL-LIFECYCLE-EVIDENCE-PACK-SHA256:", hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
