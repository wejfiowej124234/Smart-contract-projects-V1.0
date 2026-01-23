import hre from "hardhat";
import { exportArtifacts, type DeploymentsJson } from "./_lib/export";

const TOKEN_DECIMALS = 18n;
const SEED_RECIPIENTS = 5; // seed the first N local accounts for demos
const SEED_AMOUNT = 10_000n; // 10k tokens each

function normalizeSeedAddress(raw: string, ethers: typeof hre.ethers): string {
  if (!ethers.isAddress(raw)) {
    throw new Error(`Invalid SEED_ADDRESS: ${raw}`);
  }
  return ethers.getAddress(raw);
}

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  console.log(`Network chainId: ${chainId}`);
  console.log(`Deployer: ${deployerAddress}`);

  // Deploy test tokens
  const TestToken = await hre.ethers.getContractFactory("TestToken", deployer);
  const usd8 = await TestToken.deploy("USD8", "USD8");
  await usd8.waitForDeployment();
  const usd8Address = await usd8.getAddress();

  const weth = await TestToken.deploy("Wrapped Ether", "WETH");
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();

  // Deploy lending contract (bind USD8 as the single lending token)
  const SimpleLending = await hre.ethers.getContractFactory("SimpleLending", deployer);
  const lending = await SimpleLending.deploy(usd8Address);
  await lending.waitForDeployment();
  const simpleLendingAddress = await lending.getAddress();

  console.log(`USD8 address: ${usd8Address}`);
  console.log(`WETH address: ${wethAddress}`);
  console.log(`SimpleLending address: ${simpleLendingAddress}`);

  // Seed accounts by transferring from deployer (TestToken mints totalSupply to deployer)
  const seedValue = SEED_AMOUNT * 10n ** TOKEN_DECIMALS;
  const recipients = signers.slice(0, Math.min(SEED_RECIPIENTS, signers.length));

  const seedAddressFromEnvRaw = process.env.SEED_ADDRESS;
  const seedAddressFromEnv =
    seedAddressFromEnvRaw && seedAddressFromEnvRaw.trim() !== ""
      ? normalizeSeedAddress(seedAddressFromEnvRaw.trim(), hre.ethers)
      : undefined;

  const seeded = new Set<string>();

  async function seedTo(to: string): Promise<void> {
    const normalized = hre.ethers.getAddress(to);
    if (normalized.toLowerCase() === deployerAddress.toLowerCase()) {
      return;
    }
    if (seeded.has(normalized.toLowerCase())) {
      return;
    }

    const tx1 = await usd8.transfer(normalized, seedValue);
    await tx1.wait();
    const tx2 = await weth.transfer(normalized, seedValue);
    await tx2.wait();
    seeded.add(normalized.toLowerCase());
    console.log(`Seeded ${normalized}: USD8 + WETH = ${SEED_AMOUNT.toString()}`);
  }

  for (const s of recipients) {
    const to = await s.getAddress();
    await seedTo(to);
  }

  // Optional: seed a user-provided MetaMask address (doesn't change default behavior)
  if (seedAddressFromEnv !== undefined) {
    await seedTo(seedAddressFromEnv);
  }

  // Quick verification (one recipient)
  const verifyAddress =
    seedAddressFromEnv ??
    (recipients.length > 1 ? await recipients[1].getAddress() : deployerAddress);
  const usd8Bal = await usd8.balanceOf(verifyAddress);
  const wethBal = await weth.balanceOf(verifyAddress);
  console.log(`Verify balances for ${verifyAddress}`);
  console.log(`USD8 balanceOf: ${usd8Bal.toString()}`);
  console.log(`WETH balanceOf: ${wethBal.toString()}`);

  const deployments: DeploymentsJson = {
    chainId,
    usd8Address,
    wethAddress,
    simpleLendingAddress
  };

  await exportArtifacts(hre, deployments);
  console.log("Exported ABIs + deployments.json to frontend/src/* and deployments/*");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
