/**
 * Institutional DAO: Full governance lifecycle and execution-failure isolation.
 * - Lifecycle: deploy Governor + Timelock + mock target → propose → vote → queue → execute → assert state.
 * - Snapshot: assert voting uses proposalSnapshot and votingDelay >= 1.
 * - Execution failure: proposal that reverts on execute → assert full batch revert (target state unchanged).
 */
import { expect } from "chai";
import { ethers } from "hardhat";

const INITIAL_SUPPLY = 1_000_000n * 10n ** 18n;
const VOTING_DELAY = 1n;
const VOTING_PERIOD = 100n;
const PROPOSAL_THRESHOLD = 0n;
const QUORUM_NUMERATOR = 4n; // 4%
const TIMELOCK_MIN_DELAY = 60; // seconds

async function deployGovernanceStack() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  const GovernanceToken = await ethers.getContractFactory("GovernanceToken", deployer);
  const token = await GovernanceToken.deploy("Governance Token", "GOV", INITIAL_SUPPLY);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const TimelockController = await ethers.getContractFactory("TimelockController", deployer);
  const timelock = await TimelockController.deploy(
    TIMELOCK_MIN_DELAY,
    [], // proposers – grant to Governor after deploy
    [], // executors
    deployerAddress
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();

  const GovernorP9 = await ethers.getContractFactory("GovernorP9", deployer);
  const governor = await GovernorP9.deploy(
    "GovernorP9",
    tokenAddress,
    timelockAddress,
    VOTING_DELAY,
    VOTING_PERIOD,
    PROPOSAL_THRESHOLD,
    QUORUM_NUMERATOR
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await timelock.grantRole(EXECUTOR_ROLE, governorAddress);

  const MockGovernanceTarget = await ethers.getContractFactory("MockGovernanceTarget", deployer);
  const mock = await MockGovernanceTarget.deploy();
  await mock.waitForDeployment();
  const mockAddress = await mock.getAddress();

  return { deployer, deployerAddress, token, governor, timelock, mock, mockAddress, governorAddress };
}

describe("Governance lifecycle (institutional DAO)", function () {
  it("Full lifecycle: propose → vote → queue → execute → state updated", async function () {
    const { deployer, deployerAddress, token, governor, timelock, mock, mockAddress } = await deployGovernanceStack();

    await token.delegate(deployerAddress);
    await ethers.provider.send("evm_mine", []);

    const targets = [mockAddress];
    const values = [0n];
    const calldatas = [mock.interface.encodeFunctionData("setValue", [76])];
    const description = "Set mock value to 76";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    await governor.propose(targets, values, calldatas, description);
    const snapshot = await governor.proposalSnapshot(proposalId);
    expect(snapshot).to.be.gt(0n);

    const votingDelay = await governor.votingDelay();
    for (let i = 0; i < Number(votingDelay) + 1; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await governor.castVote(proposalId, 1);

    const votingPeriod = await governor.votingPeriod();
    for (let i = 0; i < Number(votingPeriod) + 1; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await governor.queue(targets, values, calldatas, descriptionHash);

    const minDelay = await timelock.getMinDelay();
    await ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
    await ethers.provider.send("evm_mine", []);

    await governor.execute(targets, values, calldatas, descriptionHash);

    expect(await mock.value()).to.equal(76n);
  });

  it("Voting uses snapshot and votingDelay >= 1 (anti-flash-loan)", async function () {
    const { deployer, deployerAddress, token, governor, mock, mockAddress } = await deployGovernanceStack();

    const votingDelay = await governor.votingDelay();
    expect(votingDelay).to.be.gte(1n);

    await token.delegate(deployerAddress);
    await ethers.provider.send("evm_mine", []);

    const targets = [mockAddress];
    const values = [0n];
    const calldatas = [mock.interface.encodeFunctionData("setValue", [1])];
    const description = "Snapshot test";
    await governor.propose(targets, values, calldatas, description);
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
    const snapshot = await governor.proposalSnapshot(proposalId);
    expect(snapshot).to.be.gt(0n);
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);
    const blockNum = await ethers.provider.getBlockNumber();
    expect(blockNum).to.be.gt(Number(snapshot));
  });

  it("Execution failure: one call reverts → full batch revert, state unchanged", async function () {
    const { deployer, deployerAddress, token, governor, timelock, mock, mockAddress } = await deployGovernanceStack();

    await token.delegate(deployerAddress);
    await ethers.provider.send("evm_mine", []);

    const targets = [mockAddress];
    const values = [0n];
    const calldatas = [mock.interface.encodeFunctionData("setValueRevert", [0])];
    const description = "Revert test";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    await governor.propose(targets, values, calldatas, description);

    const votingDelay = await governor.votingDelay();
    for (let i = 0; i < Number(votingDelay) + 1; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    await governor.castVote(proposalId, 1);

    const votingPeriod = await governor.votingPeriod();
    for (let i = 0; i < Number(votingPeriod) + 1; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await governor.queue(targets, values, calldatas, descriptionHash);

    const minDelay = await timelock.getMinDelay();
    await ethers.provider.send("evm_increaseTime", [Number(minDelay) + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(governor.execute(targets, values, calldatas, descriptionHash)).to.be.reverted;
    expect(await mock.value()).to.equal(0n);
  });

  it("Proposal with more than MAX_PROPOSAL_ACTIONS reverts (gas/queue resilience)", async function () {
    const { deployer, deployerAddress, token, governor, mock, mockAddress } = await deployGovernanceStack();

    await token.delegate(deployerAddress);
    await ethers.provider.send("evm_mine", []);

    const cap = await governor.MAX_PROPOSAL_ACTIONS();
    const targets = Array(Number(cap) + 1).fill(mockAddress);
    const values = Array(targets.length).fill(0n);
    const calldatas = targets.map(() => mock.interface.encodeFunctionData("setValue", [1]));
    const description = "Too many actions";

    await expect(governor.propose(targets, values, calldatas, description)).to.be.revertedWith("GovernorP9: too many actions");
  });
});
