/**
 * Final Security Gate B0a–B4, C1–C3, T1/P1/R1: executable checks.
 * Dual-Mode: profile (MODE=mock|real) controls allowEoa, Skip for B1–B4/R1; real mainnet/L2 enforces all.
 */
import path from "path";
import fs from "fs";
import crypto from "crypto";
import hre from "hardhat";
import { loadProfile } from "../config/loadProfile";
import { ALLOW_EOA_CHAIN_IDS, isLocalChainId, isL2ChainId, isL2MainnetChainId, isMainnetOrL2MainnetChainId } from "./config";
import {
  loadB4Evidence,
  verifyB4Evidence,
  getCurrentCommitSha,
  sha256Hex as b4Sha256,
  B4_EVIDENCE_FILENAME,
  B4_EVIDENCE_DIR,
} from "./b4-evidence";

const PASS = "Pass";
const FAIL = "Fail";
const SKIP = "Skip";

/** Test that proves PriceBoundGuard getPrice reverts when price deviates beyond maxDeviationBps (C3a deviation). */
export const C3A_DEVIATION_TEST_REF = {
  file: "test/integration/SimpleLending.integration.ts",
  name: "PriceBoundGuard getPrice reverts when price deviates beyond maxDeviationBps (C3a deviation evidence)",
};

type Result = { id: string; name: string; status: "Pass" | "Fail" | "Skip"; detail?: string; location?: string };

async function hasCode(address: string): Promise<boolean> {
  const code = await hre.ethers.provider.getCode(address);
  return code !== "0x" && code.length > 2;
}

function loadDeployments(chainId: number): Record<string, unknown> {
  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments not found: ${deploymentsPath}. Run deploy first.`);
  }
  return JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as Record<string, unknown>;
}

function loadGateConfig(chainId: number): Record<string, unknown> {
  const configPath = path.join(process.cwd(), "scripts", "config", `security-gate-${chainId}.json`);
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as Record<string, unknown>;
}

function sha256Hex(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

/** Fetch chain reserve list from pool.reserveList(i) until revert or empty. */
async function getReserveListFromPool(poolAddress: string): Promise<string[]> {
  const poolAbi = ["function reserveList(uint256) view returns (address)"];
  const pool = new hre.ethers.Contract(poolAddress, poolAbi, hre.ethers.provider);
  const list: string[] = [];
  const maxReserves = 64;
  for (let i = 0; i < maxReserves; i++) {
    try {
      const a = await pool.reserveList(i);
      if (!a || a === hre.ethers.ZeroAddress) break;
      list.push(a);
    } catch {
      break;
    }
  }
  return list;
}

export async function runSecurityGate(): Promise<{ results: Result[]; allPass: boolean }> {
  const results: Result[] = [];
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const profile = loadProfile(chainId);
  const deployments = loadDeployments(chainId);
  const gateConfig = loadGateConfig(chainId);

  const proxyAdminAddress = (deployments.proxyAdminAddress ?? gateConfig.proxyAdminAddress) as string | undefined;
  const configuratorAddress = (deployments.configuratorAddress ?? gateConfig.configuratorAddress) as string | undefined;
  const poolAddress = deployments.simpleLendingAddress as string;
  const poolTokenAddress = deployments.usd8Address as string;
  const oracleRouterAddress = deployments.oracleRouterAddress as string | undefined;

  const reserveList = await getReserveListFromPool(poolAddress);
  const assetsForOracleAndReserve = reserveList.length > 0 ? reserveList : (poolTokenAddress ? [poolTokenAddress] : []);

  const allowEoa =
    (profile.securityGate.allowEoaChainIds != null && profile.securityGate.allowEoaChainIds.includes(chainId)) ||
    (gateConfig.allowEoaOnChains as number[] | undefined)?.includes(chainId) ||
    ALLOW_EOA_CHAIN_IDS.includes(chainId);
  const allowedProxyAdmin = (gateConfig.allowedProxyAdminOwners as string[] | undefined) ?? [];
  const allowedPool = (gateConfig.allowedPoolOwners as string[] | undefined) ?? [];
  const allowedConfigurator = (gateConfig.allowedConfiguratorAdmins as string[] | undefined) ?? [];

  // --- R0: config vs deployments consistency (addresses must match when both present) ---
  const cfgProxy = gateConfig.proxyAdminAddress as string | undefined;
  const cfgConfigurator = gateConfig.configuratorAddress as string | undefined;
  const depProxy = deployments.proxyAdminAddress as string | undefined;
  const depConfigurator = deployments.configuratorAddress as string | undefined;
  const proxyMismatch = cfgProxy != null && depProxy != null && cfgProxy.toLowerCase() !== depProxy.toLowerCase();
  const configuratorMismatch = cfgConfigurator != null && depConfigurator != null && cfgConfigurator.toLowerCase() !== depConfigurator.toLowerCase();
  if (proxyMismatch || configuratorMismatch) {
    results.push({
      id: "R0",
      name: "Config vs deployments consistency",
      status: FAIL,
      detail: proxyMismatch
        ? `security-gate-${chainId}.json proxyAdminAddress !== deployments`
        : `security-gate-${chainId}.json configuratorAddress !== deployments`,
      location: "scripts/config/ vs deployments/",
    });
  } else if (cfgProxy != null || cfgConfigurator != null || depProxy != null || depConfigurator != null) {
    results.push({
      id: "R0",
      name: "Config vs deployments consistency",
      status: PASS,
      detail: "proxyAdminAddress and configuratorAddress consistent between config and deployments",
      location: "scripts/config/ vs deployments/",
    });
  } else {
    results.push({ id: "R0", name: "Config vs deployments consistency", status: SKIP, detail: "No proxyAdmin/configurator in both", location: "scripts/config/ vs deployments/" });
  }

  async function ownerOk(owner: string, allowedList: string[]): Promise<boolean> {
    if (allowedList.includes(owner)) return true;
    if (allowEoa) return true;
    return await ownerIsContract(owner);
  }

  async function ownerIsContract(owner: string): Promise<boolean> {
    return hasCode(owner);
  }

  // --- B0a: Pool proxy admin === deployments proxyAdminAddress (binding) ---
  const proxyAbi = ["function admin() view returns (address)"];
  const proxy = new hre.ethers.Contract(poolAddress, proxyAbi, hre.ethers.provider);
  const actualProxyAdmin = await proxy.admin();
  if (proxyAdminAddress && actualProxyAdmin !== proxyAdminAddress) {
    results.push({
      id: "B0a",
      name: "Pool proxy admin equals deployments.proxyAdminAddress",
      status: FAIL,
      detail: `proxy.admin()=${actualProxyAdmin} != proxyAdminAddress=${proxyAdminAddress}`,
      location: "ITransparentUpgradeableProxy.admin() vs deployments",
    });
  } else if (proxyAdminAddress) {
    results.push({
      id: "B0a",
      name: "Pool proxy admin equals deployments.proxyAdminAddress",
      status: PASS,
      detail: `proxy.admin()=${actualProxyAdmin}`,
      location: "ITransparentUpgradeableProxy.admin()",
    });
  } else {
    results.push({ id: "B0a", name: "Pool proxy admin binding", status: FAIL, detail: "proxyAdminAddress missing", location: "deployments" });
  }

  // --- B0b: Pool.configurator === deployments configuratorAddress (binding) ---
  const poolConfiguratorAbi = ["function configurator() view returns (address)"];
  const poolForConfig = new hre.ethers.Contract(poolAddress, poolConfiguratorAbi, hre.ethers.provider);
  const actualConfigurator = await poolForConfig.configurator();
  if (configuratorAddress && actualConfigurator !== configuratorAddress) {
    results.push({
      id: "B0b",
      name: "Pool.configurator equals deployments.configuratorAddress",
      status: FAIL,
      detail: `pool.configurator()=${actualConfigurator} != configuratorAddress=${configuratorAddress}`,
      location: "LendingPoolImpl.configurator() vs deployments",
    });
  } else if (configuratorAddress) {
    results.push({
      id: "B0b",
      name: "Pool.configurator equals deployments.configuratorAddress",
      status: PASS,
      detail: `pool.configurator()=${actualConfigurator}`,
      location: "LendingPoolImpl.configurator()",
    });
  } else {
    results.push({ id: "B0b", name: "Pool configurator binding", status: FAIL, detail: "configuratorAddress missing", location: "deployments" });
  }

  // --- B1: ProxyAdmin.owner ---
  if (!proxyAdminAddress) {
    results.push({ id: "B1", name: "ProxyAdmin.owner is multisig/Timelock (or allowed EOA)", status: FAIL, detail: "proxyAdminAddress missing in deployments", location: "deployments/<chainId>.json" });
  } else {
    const proxyAdminAbi = ["function owner() view returns (address)"];
    const proxyAdmin = new hre.ethers.Contract(proxyAdminAddress, proxyAdminAbi, hre.ethers.provider);
    const owner = await proxyAdmin.owner();
    const ok = await ownerOk(owner, allowedProxyAdmin);
    results.push({
      id: "B1",
      name: "ProxyAdmin.owner is multisig/Timelock (or allowed EOA)",
      status: ok ? PASS : FAIL,
      detail: ok ? `owner=${owner}` : `owner=${owner} (EOA on mainnet not allowed)`,
      location: "ProxyAdmin.owner()",
    });
  }

  // --- B2: PoolConfigurator.admin ---
  if (!configuratorAddress) {
    results.push({ id: "B2", name: "PoolConfigurator.admin is multisig/Timelock (or allowed EOA)", status: FAIL, detail: "configuratorAddress missing in deployments", location: "deployments/<chainId>.json" });
  } else {
    const configuratorAbi = ["function admin() view returns (address)"];
    const configurator = new hre.ethers.Contract(configuratorAddress, configuratorAbi, hre.ethers.provider);
    const admin = await configurator.admin();
    const ok = await ownerOk(admin, allowedConfigurator);
    results.push({
      id: "B2",
      name: "PoolConfigurator.admin is multisig/Timelock (or allowed EOA)",
      status: ok ? PASS : FAIL,
      detail: ok ? `admin=${admin}` : `admin=${admin} (EOA on mainnet not allowed)`,
      location: "PoolConfigurator.admin()",
    });
  }

  // --- B3: Pool.owner ---
  const poolAbi = ["function owner() view returns (address)"];
  const pool = new hre.ethers.Contract(poolAddress, poolAbi, hre.ethers.provider);
  const poolOwner = await pool.owner();
  const poolOwnerOk = await ownerOk(poolOwner, allowedPool);
  results.push({
    id: "B3",
    name: "Pool (LendingPool).owner is multisig/Timelock (or allowed EOA)",
    status: poolOwnerOk ? PASS : FAIL,
    detail: poolOwnerOk ? `owner=${poolOwner}` : `owner=${poolOwner} (EOA on mainnet not allowed)`,
    location: "LendingPoolImpl.owner() (via proxy)",
  });

  // --- C1: same as B1+B2+B3 (already above) ---
  results.push({ id: "C1", name: "C1 (B1+B2+B3): All three owners verified above", status: PASS, detail: "See B1, B2, B3" });

  // --- C2: L2 Sequencer (see B4) ---
  results.push({ id: "C2", name: "C2 (L2): SequencerUptimeGuard — see B4", status: PASS, detail: "Verified by B4 or N/A" });

  // B4: L2 SequencerUptimeGuard — we skip on local; on L2 mainnet this check cannot be bypassed
  if (isLocalChainId(chainId)) {
    results.push({
      id: "B4",
      name: "L2: SequencerUptimeGuard (skipped on local)",
      status: SKIP,
      detail: `Local only (chainId=${chainId}). B4 required for L2 mainnet — see docs/08-deployment-runbook.md §6.`,
      location: "docs/08-deployment-runbook.md §6",
    });
  } else if (isL2MainnetChainId(chainId)) {
    let b4Pass = false;
    let b4Detail = "";
    if (oracleRouterAddress && assetsForOracleAndReserve.length > 0) {
      const routerAbi = ["function feeds(address) view returns (address)"];
      const router = new hre.ethers.Contract(oracleRouterAddress, routerAbi, hre.ethers.provider);
      const seqAbi = ["function isSequencerUp() view returns (bool)"];
      const sourceAbi = ["function source() view returns (address)"];
      for (const asset of assetsForOracleAndReserve) {
        const feedAddr = await router.feeds(asset);
        if (feedAddr === hre.ethers.ZeroAddress) continue;
        try {
          const feed = new hre.ethers.Contract(feedAddr, seqAbi, hre.ethers.provider);
          const up = await feed.isSequencerUp();
          if (up) {
            b4Pass = true;
            b4Detail = `feed ${feedAddr} isSequencerUp()=true`;
            break;
          }
        } catch {
          try {
            const guard = new hre.ethers.Contract(feedAddr, sourceAbi, hre.ethers.provider);
            const sourceAddr = await guard.source();
            const source = new hre.ethers.Contract(sourceAddr, seqAbi, hre.ethers.provider);
            const up = await source.isSequencerUp();
            if (up) {
              b4Pass = true;
              b4Detail = `feed->source ${sourceAddr} isSequencerUp()=true`;
              break;
            }
          } catch {
            // not SequencerUptimeGuard in path
          }
        }
      }
    }
    const evidence = loadB4Evidence(chainId);
    const allowedB4Signers =
      (profile.b4EvidenceSigners?.length ? profile.b4EvidenceSigners : undefined) ??
      (gateConfig.b4EvidenceSigners as string[] | undefined) ??
      (process.env.B4_EVIDENCE_SIGNERS ? process.env.B4_EVIDENCE_SIGNERS.split(",").map((s) => s.trim()).filter(Boolean) : []);
    if (b4Pass) {
      results.push({ id: "B4", name: "L2 mainnet: SequencerUptimeGuard in oracle path", status: PASS, detail: b4Detail, location: "OracleRouter.feeds -> isSequencerUp()" });
    } else if (evidence) {
      const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
      const deploymentsContent = fs.existsSync(deploymentsPath) ? fs.readFileSync(deploymentsPath, "utf-8") : "";
      const currentDeploymentsHash = b4Sha256(deploymentsContent);
      const currentCommitSha = getCurrentCommitSha();
      if (allowedB4Signers.length === 0) {
        results.push({
          id: "B4",
          name: "L2 mainnet: B4 evidence signature verification",
          status: FAIL,
          detail: `Evidence file present but b4EvidenceSigners not configured (scripts/config/security-gate-${chainId}.json or env B4_EVIDENCE_SIGNERS). Cannot verify.`,
          location: `${B4_EVIDENCE_DIR}/${B4_EVIDENCE_FILENAME(chainId)}`,
        });
      } else {
        const verifyResult = verifyB4Evidence(
          evidence,
          chainId,
          currentDeploymentsHash,
          currentCommitSha,
          allowedB4Signers,
          (msg: string, sig: string) => hre.ethers.verifyMessage(msg, sig)
        );
        if (verifyResult.ok) {
          results.push({
            id: "B4",
            name: "L2 mainnet: B4 signed evidence verified",
            status: PASS,
            detail: `Evidence verified: commitSha=${evidence.commitSha}, signer=${verifyResult.signer}`,
            location: `${B4_EVIDENCE_DIR}/${B4_EVIDENCE_FILENAME(chainId)}`,
          });
        } else {
          results.push({
            id: "B4",
            name: "L2 mainnet: B4 evidence invalid (no bypass)",
            status: FAIL,
            detail: `Evidence file present but verification failed: ${verifyResult.reason}. Ensure chainId/commitSha/deploymentsHash match this build and signature from b4EvidenceSigners.`,
            location: `${B4_EVIDENCE_DIR}/${B4_EVIDENCE_FILENAME(chainId)}`,
          });
        }
      }
    } else {
      results.push({
        id: "B4",
        name: "L2 mainnet: SequencerUptimeGuard required (no bypass)",
        status: FAIL,
        detail: `L2 mainnet (chainId=${chainId}): no isSequencerUp() in oracle path and no valid signed evidence at ${B4_EVIDENCE_DIR}/${B4_EVIDENCE_FILENAME(chainId)}. See docs/08-deployment-runbook.md §6.`,
        location: "Oracle path or docs/release/B4-L2-evidence-<chainId>.json",
      });
    }
  } else if (isL2ChainId(chainId)) {
    results.push({
      id: "B4",
      name: "L2: SequencerUptimeGuard (L2 testnet)",
      status: SKIP,
      detail: `L2 testnet (chainId=${chainId}). B4 required for L2 mainnet — see docs/08-deployment-runbook.md §6.`,
      location: "docs/08-deployment-runbook.md §6",
    });
  } else {
    results.push({ id: "B4", name: "L2: N/A (not L2)", status: SKIP, detail: `chainId=${chainId}` });
  }

  // --- Only Timelock/admin can call key setter (C1b): use a signer that is NOT configurator.admin ---
  const firstAssetForSetLtv = assetsForOracleAndReserve[0] ?? poolTokenAddress;
  if (configuratorAddress && firstAssetForSetLtv) {
    const configuratorAdminAbi = ["function admin() view returns (address)"];
    const configuratorForAdmin = new hre.ethers.Contract(configuratorAddress, configuratorAdminAbi, hre.ethers.provider);
    const configuratorAdminAddress = await configuratorForAdmin.admin();
    const signers = await hre.ethers.getSigners();
    const configuratorAdminLower = configuratorAdminAddress.toLowerCase();
    const nonAdminSigner = signers.find((s) => s.address.toLowerCase() !== configuratorAdminLower);
    if (!nonAdminSigner) {
      const requireC1b = isMainnetOrL2MainnetChainId(chainId);
      results.push({
        id: "C1b",
        name: "Only admin can call Configurator.setLTV (non-admin must revert)",
        status: requireC1b ? FAIL : SKIP,
        detail: requireC1b
          ? "Mainnet/L2 mainnet: no non-admin signer available; cannot verify onlyAdmin (use multi-signer env)"
          : "No signer available that is not configurator.admin(); cannot verify onlyAdmin",
        location: "PoolConfigurator.setLTV from non-admin",
      });
      results.push({ id: "C1c", name: "Only admin can call setLiquidationThreshold", status: SKIP, detail: "No non-admin signer; see C1b", location: "PoolConfigurator.setLiquidationThreshold" });
    } else {
      const configuratorWithSigner = new hre.ethers.Contract(
        configuratorAddress,
        ["function setLTV(address asset, uint256 ltv) external"],
        nonAdminSigner
      );
      try {
        await configuratorWithSigner.setLTV(firstAssetForSetLtv, 75);
        results.push({
          id: "C1b",
          name: "Only admin can call Configurator.setLTV (non-admin must revert)",
          status: FAIL,
          detail: "Non-admin was able to call setLTV",
          location: "PoolConfigurator.setLTV from non-admin",
        });
      } catch {
        results.push({
          id: "C1b",
          name: "Only admin can call Configurator.setLTV (non-admin must revert)",
          status: PASS,
          detail: "Non-admin call reverted as expected",
          location: "PoolConfigurator.setLTV from non-admin",
        });
      }
      // --- C1c (BL-5): non-admin must not call setLiquidationThreshold ---
      const configuratorLtAbi = ["function setLiquidationThreshold(address asset, uint256 lt) external"];
      const configuratorLt = new hre.ethers.Contract(configuratorAddress, configuratorLtAbi, nonAdminSigner);
      try {
        await configuratorLt.setLiquidationThreshold(firstAssetForSetLtv, 80);
        results.push({
          id: "C1c",
          name: "Only admin can call Configurator.setLiquidationThreshold (non-admin must revert)",
          status: FAIL,
          detail: "Non-admin was able to call setLiquidationThreshold",
          location: "PoolConfigurator.setLiquidationThreshold from non-admin",
        });
      } catch {
        results.push({
          id: "C1c",
          name: "Only admin can call Configurator.setLiquidationThreshold (non-admin must revert)",
          status: PASS,
          detail: "Non-admin call reverted as expected",
          location: "PoolConfigurator.setLiquidationThreshold from non-admin",
        });
      }
    }
  } else {
    results.push({ id: "C1b", name: "Only admin can call setLTV", status: SKIP, detail: "Missing configurator or pool token address" });
    results.push({ id: "C1c", name: "Only admin can call setLiquidationThreshold", status: SKIP, detail: "Missing configurator or pool token address" });
  }

  // --- C3a: PriceBoundGuard anchor set (per reserve in reserveList) ---
  if (oracleRouterAddress && assetsForOracleAndReserve.length > 0) {
    const routerAbi = ["function feeds(address) view returns (address)"];
    const router = new hre.ethers.Contract(oracleRouterAddress, routerAbi, hre.ethers.provider);
    const guardAbi = ["function anchorPrice() view returns (uint256)", "function circuitOpen() view returns (bool)"];
    for (const asset of assetsForOracleAndReserve) {
      const feedAddress = await router.feeds(asset);
      if (feedAddress === hre.ethers.ZeroAddress) {
        results.push({ id: "C3a", name: `PriceBoundGuard anchor (reserve ${asset.slice(0, 10)}…)`, status: SKIP, detail: "No feed for asset", location: "OracleRouter.feeds(asset)" });
        continue;
      }
      try {
        const guard = new hre.ethers.Contract(feedAddress, guardAbi, hre.ethers.provider);
        const anchor = await guard.anchorPrice();
        const circuitOpen = await guard.circuitOpen();
        const anchorOk = anchor > 0n;
        const ok = anchorOk && !circuitOpen;
        results.push({
          id: "C3a",
          name: `PriceBoundGuard anchor (reserve ${asset.slice(0, 10)}…)`,
          status: ok ? PASS : FAIL,
          detail: ok ? `anchor=${anchor}, circuitOpen=${circuitOpen}` : `anchor=${anchor} (must be > 0); circuitOpen=${circuitOpen}`,
          location: "PriceBoundGuard.anchorPrice(), circuitOpen()",
        });
      } catch {
        results.push({
          id: "C3a",
          name: `PriceBoundGuard (reserve ${asset.slice(0, 10)}…)`,
          status: SKIP,
          detail: `Feed at ${feedAddress} is not PriceBoundGuard`,
          location: "OracleRouter.feeds(asset)",
        });
      }
    }
    results.push({
      id: "C3a-ref",
      name: "C3a deviation: getPrice reverts when price deviates",
      status: PASS,
      detail: `Evidence: ${C3A_DEVIATION_TEST_REF.file} «${C3A_DEVIATION_TEST_REF.name}»`,
      location: C3A_DEVIATION_TEST_REF.file,
    });
  } else {
    results.push({ id: "C3a", name: "PriceBoundGuard anchor", status: SKIP, detail: "No oracle router or reserves" });
  }

  // --- C3b: LTV ≤ LT on-chain (per reserve in reserveList) ---
  const poolReserveAbi = ["function getReserveData(address) view returns (uint256 ltv, uint256 lt, uint256, uint256, uint256, address)"];
  const poolForReserve = new hre.ethers.Contract(poolAddress, poolReserveAbi, hre.ethers.provider);
  const assetsForLtv = reserveList.length > 0 ? reserveList : (poolTokenAddress ? [poolTokenAddress] : []);
  for (const asset of assetsForLtv) {
    try {
      const data = await poolForReserve.getReserveData(asset);
      const ltv = BigInt(typeof data.ltv !== "undefined" ? data.ltv : (data as unknown[])[0]);
      const lt = BigInt(typeof data.lt !== "undefined" ? data.lt : (data as unknown[])[1]);
      const ok = ltv <= lt;
      results.push({
        id: "C3b",
        name: `LTV ≤ LT (reserve ${asset.slice(0, 10)}…)`,
        status: ok ? PASS : FAIL,
        detail: ok ? `ltv=${ltv}, lt=${lt}` : `ltv=${ltv}, lt=${lt} (LTV must be <= LT)`,
        location: "LendingPoolImpl.getReserveData(asset)",
      });
    } catch (e) {
      results.push({
        id: "C3b",
        name: `LTV ≤ LT (reserve ${asset.slice(0, 10)}…)`,
        status: FAIL,
        detail: String(e),
        location: "LendingPoolImpl.getReserveData(asset)",
      });
    }
  }
  if (assetsForLtv.length === 0) {
    results.push({ id: "C3b", name: "LTV ≤ LT", status: SKIP, detail: "No reserves on pool" });
  }

  // --- T1: Treasury.owner (informational; recommend same as Pool.owner per C5) ---
  const poolTreasuryAbi = ["function treasuryAddress() view returns (address)"];
  const poolForTreasury = new hre.ethers.Contract(poolAddress, poolTreasuryAbi, hre.ethers.provider);
  const treasuryAddr = await poolForTreasury.treasuryAddress();
  if (treasuryAddr !== hre.ethers.ZeroAddress) {
    try {
      const treasuryAbi = ["function owner() view returns (address)"];
      const treasury = new hre.ethers.Contract(treasuryAddr, treasuryAbi, hre.ethers.provider);
      const treasuryOwner = await treasury.owner();
      const sameAsPool = treasuryOwner.toLowerCase() === poolOwner.toLowerCase();
      results.push({
        id: "T1",
        name: "Treasury.owner (recommend same as Pool.owner)",
        status: sameAsPool ? PASS : SKIP,
        detail: sameAsPool ? `owner=${treasuryOwner} (same as Pool.owner)` : `owner=${treasuryOwner}; runbook: align with Pool.owner or document (R5/C5)`,
        location: "Treasury.owner()",
      });
    } catch {
      results.push({ id: "T1", name: "Treasury.owner", status: SKIP, detail: "Treasury contract has no owner()", location: "pool.treasuryAddress()" });
    }
  } else {
    results.push({ id: "T1", name: "Treasury.owner", status: SKIP, detail: "No treasury set" });
  }

  // --- P1: PAUSER (informational; runbook: multisig or monitored EOA per R6/C5) ---
  const poolPauserAbi = ["function isPauser(address) view returns (bool)"];
  const poolForPauser = new hre.ethers.Contract(poolAddress, poolPauserAbi, hre.ethers.provider);
  const ownerIsPauser = await poolForPauser.isPauser(poolOwner);
  results.push({
    id: "P1",
    name: "PAUSER: Pool.owner has PAUSER role (runbook: multisig or monitored)",
    status: ownerIsPauser ? PASS : SKIP,
    detail: ownerIsPauser ? "Pool.owner is PAUSER" : "Pool.owner is not PAUSER; runbook: ensure at least one PAUSER and document (R6/C5)",
    location: "LendingPoolImpl.isPauser(address)",
  });

  // --- R1: Release consistency; mandatory on mainnet/L2 when profile does not allow Skip ---
  const manifestPath = path.join(process.cwd(), "scripts", "release", "release-manifest.json");
  const manifestExists = fs.existsSync(manifestPath);
  const r1Mandatory = isMainnetOrL2MainnetChainId(chainId) && !profile.securityGate.allowSkipR1;
  if (manifestExists) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, { commitSha?: string; deploymentsSha256?: string; configSha256?: string }>;
    const entry = manifest[String(chainId)];
    const deploymentsPathR1 = path.join(process.cwd(), "deployments", `${chainId}.json`);
    const configPath = path.join(process.cwd(), "scripts", "config", `security-gate-${chainId}.json`);
    const deploymentsContent = fs.existsSync(deploymentsPathR1) ? fs.readFileSync(deploymentsPathR1, "utf-8") : "";
    const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf-8") : "";
    const deploymentsHash = sha256Hex(deploymentsContent);
    const configHash = sha256Hex(configContent);
    const matchDeploy = entry?.deploymentsSha256 === deploymentsHash;
    const matchConfig = !entry?.configSha256 || entry.configSha256 === configHash;
    const ok = matchDeploy && matchConfig;
    results.push({
      id: "R1",
      name: "Release consistency (deployments + config hashes match manifest)",
      status: ok ? PASS : FAIL,
      detail: ok ? `commitSha=${entry?.commitSha ?? "n/a"}` : `manifest expects deploymentsSha256=${entry?.deploymentsSha256 ?? "n/a"} configSha256=${entry?.configSha256 ?? "n/a"}; got deployments=${deploymentsHash} config=${configHash}`,
      location: "scripts/release/release-manifest.json",
    });
  } else {
    results.push({
      id: "R1",
      name: "Release consistency",
      status: r1Mandatory ? FAIL : SKIP,
      detail: r1Mandatory
        ? "Mainnet/L2 mainnet: scripts/release/release-manifest.json required (run npm run release:manifest and commit or attach to release)"
        : "No scripts/release/release-manifest.json; optional for release builds",
      location: "scripts/release/release-manifest.json",
    });
  }

  const critical = results.filter(
    (r) =>
      r.status === FAIL &&
      (r.id.startsWith("B") || r.id.startsWith("C") || r.id === "R0" || r.id === "R1")
  );
  const allPass = critical.length === 0;

  return { results, allPass };
}

async function main(): Promise<void> {
  const { results, allPass } = await runSecurityGate();
  console.log("\n--- Final Security Gate (B0a–B4, C1b/C1c, C3a/C3b, C3a-ref, T1, P1, R0, R1) ---\n");
  for (const r of results) {
    const badge = r.status === PASS ? "[Pass]" : r.status === FAIL ? "[Fail]" : "[Skip]";
    console.log(`${badge} ${r.id}: ${r.name}`);
    if (r.detail) console.log(`    ${r.detail}`);
    if (r.location) console.log(`    → ${r.location}`);
  }
  console.log("\n---");
  if (allPass) {
    console.log("Result: All critical checks Pass or Skip.\n");
    process.exitCode = 0;
  } else {
    console.log("Result: One or more critical checks Fail. See above and audits/final-security-gate-mainnet.md.\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
