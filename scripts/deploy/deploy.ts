/**
 * Deploy P0–P8 (USD8, WETH, SimpleLending, Oracle, etc.) + seed + export to deployments/ and frontend.
 * Run: npm run deploy:localhost (after npx hardhat node).
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import { exportArtifacts, type DeploymentsJson } from "../_lib/export";
import { loadProfile, getReservesConfigPath } from "../config/loadProfile";

interface ReserveConfigItem {
  asset?: string;
  symbol?: string;
  ltv: number;
  liquidationThreshold: number;
  interestRateStrategy?: string;
}
interface ReservesConfig {
  reserves: ReserveConfigItem[];
}

const TOKEN_DECIMALS = 18n;
const SEED_RECIPIENTS = 5;
const SEED_AMOUNT = 10_000n;
const SEED_ETH_FOR_GAS = "1.0";

function normalizeSeedAddress(raw: string, ethers: typeof hre.ethers): string {
  if (!ethers.isAddress(raw)) {
    throw new Error(`Invalid SEED_ADDRESS: ${raw}`);
  }
  return ethers.getAddress(raw);
}

async function main(): Promise<void> {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const profile = loadProfile(chainId);
  if (!profile.chainIds.includes(chainId)) {
    throw new Error(`chainId ${chainId} not allowed for profile mode=${profile.mode}. Allowed: ${profile.chainIds.join(", ")}`);
  }

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  console.log(`Network chainId: ${chainId} | MODE: ${profile.mode}`);
  console.log(`Deployer: ${deployerAddress}`);

  let usd8Address: string;
  let wethAddress: string;

  if (profile.tokens === "deploy") {
    const TestToken = await hre.ethers.getContractFactory("TestToken", deployer);
    const usd8 = await TestToken.deploy("USD8", "USD8");
    await usd8.waitForDeployment();
    usd8Address = await usd8.getAddress();
    const weth = await TestToken.deploy("Wrapped Ether", "WETH");
    await weth.waitForDeployment();
    wethAddress = await weth.getAddress();
  } else {
    const tokens = profile.tokens as Record<string, string>;
    usd8Address = tokens.usd8 ?? tokens.USD8;
    wethAddress = tokens.weth ?? tokens.WETH;
    if (!usd8Address || !wethAddress) {
      throw new Error("Profile tokens must provide usd8 and weth addresses for mode=real.");
    }
    usd8Address = hre.ethers.getAddress(usd8Address);
    wethAddress = hre.ethers.getAddress(wethAddress);
  }

  const LinearRateStrategy = await hre.ethers.getContractFactory("LinearRateStrategy", deployer);
  const strategy = await LinearRateStrategy.deploy();
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();

  const LendingPoolImpl = await hre.ethers.getContractFactory("LendingPoolImpl", deployer);
  const impl = await LendingPoolImpl.deploy();
  await impl.waitForDeployment();
  const implAddress = await impl.getAddress();

  const proxyAdminArtifact = await hre.artifacts.readArtifact("ProxyAdmin");
  const proxyAdminAbiWithCtor = [
    {
      type: "constructor" as const,
      inputs: [{ name: "initialOwner", type: "address", internalType: "address" }],
    },
    ...(proxyAdminArtifact.abi as object[]),
  ];
  const ProxyAdminFactory = new hre.ethers.ContractFactory(
    proxyAdminAbiWithCtor,
    proxyAdminArtifact.bytecode,
    deployer,
  );
  const proxyAdmin = await ProxyAdminFactory.deploy(deployerAddress);
  await proxyAdmin.waitForDeployment();
  const proxyAdminAddress = await proxyAdmin.getAddress();

  const initData = LendingPoolImpl.interface.encodeFunctionData("initialize", [
    usd8Address,
    deployerAddress,
    strategyAddress,
    deployerAddress,
  ]);
  const TransparentUpgradeableProxy = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy",
    deployer,
  );
  const proxy = await TransparentUpgradeableProxy.deploy(
    implAddress,
    proxyAdminAddress,
    initData,
  );
  await proxy.waitForDeployment();
  const simpleLendingAddress = await proxy.getAddress();

  const pool = await hre.ethers.getContractAt("LendingPoolImpl", simpleLendingAddress);
  const grantTx = await pool.grantPauser(deployerAddress);
  await grantTx.wait();
  console.log(`P3: Granted PAUSER to deployer ${deployerAddress}`);

  const PoolConfigurator = await hre.ethers.getContractFactory("PoolConfigurator", deployer);
  const configurator = await PoolConfigurator.deploy(simpleLendingAddress, deployerAddress);
  await configurator.waitForDeployment();
  const configuratorAddress = await configurator.getAddress();
  await (await pool.setConfigurator(configuratorAddress)).wait();
  console.log(`P4: PoolConfigurator ${configuratorAddress} set as pool configurator`);

  const reservesPath = getReservesConfigPath(profile) ?? path.join(process.cwd(), "scripts", "config", `reserves.${chainId}.json`);
  let reserveConfig: ReservesConfig | null = null;
  try {
    reserveConfig = JSON.parse(fs.readFileSync(reservesPath, "utf-8")) as ReservesConfig;
  } catch {
    // no config
  }
  const symbolToAddress: Record<string, string> = { USD8: usd8Address, WETH: wethAddress };
  if (reserveConfig?.reserves?.length) {
    for (const r of reserveConfig.reserves) {
      const sym = (r.symbol ?? r.asset ?? "").toUpperCase();
      const assetAddr = symbolToAddress[sym];
      if (assetAddr) {
        await (await configurator.setLTV(assetAddr, r.ltv)).wait();
        await (await configurator.setLiquidationThreshold(assetAddr, r.liquidationThreshold)).wait();
        console.log(`Config: applied LTV=${r.ltv} LT=${r.liquidationThreshold} for ${sym}`);
      }
    }
  }

  const AToken = await hre.ethers.getContractFactory("AToken", deployer);
  const aTokenContract = await AToken.deploy("aUSD8", "aUSD8", 18, simpleLendingAddress);
  await aTokenContract.waitForDeployment();
  const aTokenAddress = await aTokenContract.getAddress();
  const VariableDebtToken = await hre.ethers.getContractFactory("VariableDebtToken", deployer);
  const variableDebtTokenContract = await VariableDebtToken.deploy("vdUSD8", "vdUSD8", 18, simpleLendingAddress);
  await variableDebtTokenContract.waitForDeployment();
  const variableDebtTokenAddress = await variableDebtTokenContract.getAddress();
  await (await pool.setAToken(aTokenAddress)).wait();
  await (await pool.setVariableDebtToken(variableDebtTokenAddress)).wait();
  console.log(`P5: aToken ${aTokenAddress}, variableDebtToken ${variableDebtTokenAddress} set on pool`);

  let oracleRouterAddress: string;
  let mockAggregatorAddress: string | undefined;

  if (profile.oracle.type === "mock") {
    const MockAggregator = await hre.ethers.getContractFactory("MockAggregator", deployer);
    const mockAgg = await MockAggregator.deploy(1e8);
    await mockAgg.waitForDeployment();
    const mockAggAddr = await mockAgg.getAddress();
    mockAggregatorAddress = mockAggAddr;
    const heartbeat = profile.oracle.heartbeatSeconds ?? 365 * 24 * 3600;
    const minA = profile.oracle.minAnswer ?? 0;
    const maxA = Number(profile.oracle.maxAnswer ?? 2e8);
    const ChainlinkAdapter = await hre.ethers.getContractFactory("ChainlinkAdapter", deployer);
    const adapter = await ChainlinkAdapter.deploy(mockAggAddr, heartbeat, minA, maxA);
    await adapter.waitForDeployment();
    let feedAddress = await adapter.getAddress();
    if (profile.oracle.usePriceBoundGuard) {
      const PriceBoundGuard = await hre.ethers.getContractFactory("PriceBoundGuard", deployer);
      const maxDevBps = profile.oracle.maxDeviationBps ?? 1000;
      const guard = await PriceBoundGuard.deploy(feedAddress, maxDevBps);
      await guard.waitForDeployment();
      feedAddress = await guard.getAddress();
      await (await guard.setAnchor(1e8)).wait();
    }
    const OracleRouter = await hre.ethers.getContractFactory("OracleRouter", deployer);
    const oracleRouter = await OracleRouter.deploy();
    await oracleRouter.waitForDeployment();
    oracleRouterAddress = await oracleRouter.getAddress();
    await (await oracleRouter.setFeed(usd8Address, feedAddress)).wait();
    await (await pool.setOracleRouter(oracleRouterAddress)).wait();
    console.log(`P6: OracleRouter ${oracleRouterAddress}, mock feed set for USD8`);
  } else {
    const OracleRouter = await hre.ethers.getContractFactory("OracleRouter", deployer);
    const oracleRouter = await OracleRouter.deploy();
    await oracleRouter.waitForDeployment();
    oracleRouterAddress = await oracleRouter.getAddress();
    const feeds = profile.oracle.feeds ?? {};
    for (const [sym, feedAddr] of Object.entries(feeds)) {
      const assetAddr = symbolToAddress[sym.toUpperCase()];
      if (assetAddr) {
        await (await oracleRouter.setFeed(assetAddr, feedAddr)).wait();
        console.log(`P6: setFeed ${sym} -> ${feedAddr}`);
      }
    }
    await (await pool.setOracleRouter(oracleRouterAddress)).wait();
    console.log(`P6: OracleRouter ${oracleRouterAddress}, chainlink feeds from profile`);
  }

  const Liquidation = await hre.ethers.getContractFactory("Liquidation", deployer);
  const liquidation = await Liquidation.deploy(simpleLendingAddress);
  await liquidation.waitForDeployment();
  const liquidationAddress = await liquidation.getAddress();
  await (await pool.setLiquidationContract(liquidationAddress)).wait();
  const Treasury = await hre.ethers.getContractFactory("Treasury", deployer);
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  await (await pool.setTreasury(treasuryAddress)).wait();
  console.log(`P7: Liquidation ${liquidationAddress}, Treasury ${treasuryAddress} set on pool`);

  console.log(`USD8 address: ${usd8Address}`);
  console.log(`WETH address: ${wethAddress}`);
  console.log(`SimpleLending (proxy) address: ${simpleLendingAddress}`);

  if (profile.tokens === "deploy" && chainId === 31337) {
    const seedValue = SEED_AMOUNT * 10n ** TOKEN_DECIMALS;
    const usd8 = await hre.ethers.getContractAt("TestToken", usd8Address);
    const weth = await hre.ethers.getContractAt("TestToken", wethAddress);
    const recipients = signers.slice(0, Math.min(SEED_RECIPIENTS, signers.length));
    const seedAddressFromEnvRaw = process.env.SEED_ADDRESS;
    const seedAddressFromEnv =
      seedAddressFromEnvRaw?.trim() ? normalizeSeedAddress(seedAddressFromEnvRaw.trim(), hre.ethers) : undefined;
    const seeded = new Set<string>();

    async function maybeFundGasForExternalAddress(to: string): Promise<void> {
      const normalized = hre.ethers.getAddress(to);
      if (!seedAddressFromEnv || normalized.toLowerCase() !== seedAddressFromEnv.toLowerCase()) return;
      const current = await hre.ethers.provider.getBalance(normalized);
      if (current >= hre.ethers.parseEther("0.2")) return;
      await (await deployer.sendTransaction({ to: normalized, value: hre.ethers.parseEther(SEED_ETH_FOR_GAS) })).wait();
      console.log(`Funded ${normalized} with ${SEED_ETH_FOR_GAS} ETH for gas`);
    }

    async function seedTo(to: string): Promise<void> {
      const normalized = hre.ethers.getAddress(to);
      if (normalized.toLowerCase() === deployerAddress.toLowerCase() || seeded.has(normalized.toLowerCase())) return;
      await usd8.transfer(normalized, seedValue);
      await weth.transfer(normalized, seedValue);
      await maybeFundGasForExternalAddress(normalized);
      seeded.add(normalized.toLowerCase());
      console.log(`Seeded ${normalized}: USD8 + WETH = ${SEED_AMOUNT.toString()}`);
    }

    for (const s of recipients) {
      await seedTo(await s.getAddress());
    }
    if (seedAddressFromEnv !== undefined) await seedTo(seedAddressFromEnv);

    const verifyAddress = seedAddressFromEnv ?? (recipients[1] ? await recipients[1].getAddress() : deployerAddress);
    const usd8Bal = await usd8.balanceOf(verifyAddress);
    const wethBal = await weth.balanceOf(verifyAddress);
    console.log(`Verify balances for ${verifyAddress}: USD8=${usd8Bal.toString()} WETH=${wethBal.toString()}`);
  }

  const deployments: DeploymentsJson = {
    chainId,
    usd8Address,
    wethAddress,
    simpleLendingAddress,
    aTokenAddress,
    variableDebtTokenAddress,
    oracleRouterAddress,
    proxyAdminAddress,
    configuratorAddress,
  };
  if (mockAggregatorAddress) {
    deployments.mockAggregatorAddress = mockAggregatorAddress;
  }

  await exportArtifacts(hre, deployments);
  console.log("Exported ABIs + deployments.json to frontend/src/* and deployments/*");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
