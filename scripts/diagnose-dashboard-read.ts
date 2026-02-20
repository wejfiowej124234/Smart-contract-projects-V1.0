/**
 * Dashboard contract read failure — end-to-end auto diagnostic.
 * We check in order: (1) 8545/chainId → (2) deployments files → (3) MetaMask reminder → (4) addresses match chain → (5) getPoolInfo/getUserPosition/calculateMax*.
 * Outputs the first failing step and minimal fix.
 *
 * Run: npm run diagnose:dashboard (or npx hardhat run scripts/diagnose-dashboard-read.ts --network localhost).
 * Prereq: start npx hardhat node (RPC http://127.0.0.1:8545).
 */
import fs from "node:fs";
import path from "node:path";
import hre from "hardhat";

const CHAIN_ID = 31337;
const DEPLOYMENTS_ROOT = path.join(process.cwd(), "deployments", "31337.json");
const FRONTEND_DEPLOYMENTS = path.join(process.cwd(), "frontend", "src", "contracts", "deployments.json");

type StepResult = { step: number; name: string; ok: boolean; detail?: string; fix?: string };

function fail(step: number, name: string, detail: string, fix: string): StepResult {
  return { step, name, ok: false, detail, fix };
}
function pass(step: number, name: string, detail?: string): StepResult {
  return { step, name, ok: true, detail };
}

async function main(): Promise<void> {
  const results: StepResult[] = [];

  // Step 1: Is the local Hardhat node on 8545 running with chainId=31337?
  try {
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    if (chainId !== CHAIN_ID) {
      results.push(
        fail(
          1,
          "Local node 8545 / chainId=31337",
          `Got chainId=${chainId}, expected ${CHAIN_ID}.`,
          "Start local node: npx hardhat node (must be chainId 31337 on port 8545).",
        ),
      );
    } else {
      results.push(pass(1, "Local node 8545 / chainId=31337", `chainId=${chainId}`));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(
      fail(
        1,
        "Local node 8545 / chainId=31337",
        `Cannot connect: ${msg}`,
        "Start local node: npx hardhat node (ensure port 8545 is free).",
      ),
    );
    printResultsAndExit(results);
  }

  // Step 2: Have we run deploy:localhost and do we have fresh deployments? (we only output one step-2 result)
  let rootDeployments: Record<string, unknown> | null = null;
  let frontendDeployments: Record<string, unknown> | null = null;
  if (fs.existsSync(DEPLOYMENTS_ROOT)) {
    try {
      rootDeployments = JSON.parse(fs.readFileSync(DEPLOYMENTS_ROOT, "utf-8")) as Record<string, unknown>;
    } catch {
      // handled below
    }
  }
  if (fs.existsSync(FRONTEND_DEPLOYMENTS)) {
    try {
      frontendDeployments = JSON.parse(fs.readFileSync(FRONTEND_DEPLOYMENTS, "utf-8")) as Record<string, unknown>;
    } catch {
      // handled below
    }
  }

  if (!fs.existsSync(DEPLOYMENTS_ROOT)) {
    results.push(
      fail(
        2,
        "deploy:localhost → deployments/31337.json + frontend deployments.json",
        "deployments/31337.json not found.",
        "Run: npm run deploy:localhost (with chain running).",
      ),
    );
  } else if (!rootDeployments) {
    results.push(
      fail(2, "deploy:localhost → deployments/31337.json", "File invalid or not JSON.", "Re-run deploy:localhost."),
    );
  } else if (!fs.existsSync(FRONTEND_DEPLOYMENTS)) {
    results.push(
      fail(
        2,
        "Frontend deployments.json exists",
        "frontend/src/contracts/deployments.json not found.",
        "Run: npm run deploy:localhost (exportArtifacts writes it).",
      ),
    );
  } else if (!frontendDeployments) {
    results.push(
      fail(2, "Frontend deployments.json", "File invalid or not JSON.", "Re-run deploy:localhost."),
    );
  } else {
    const fe = (frontendDeployments as Record<string, Record<string, string> | undefined>)["31337"];
    if (!fe) {
      results.push(
        fail(
          2,
          "Frontend has 31337 entry",
          "deployments.json has no key '31337'.",
          "Run: npm run deploy:localhost to refresh frontend deployments.",
        ),
      );
    } else {
      const root = rootDeployments as Record<string, string>;
      const addrKeys = ["usd8Address", "wethAddress", "simpleLendingAddress"] as const;
      const match = addrKeys.every((k) => root[k] === fe[k]);
      if (!match) {
        results.push(
          fail(
            2,
            "Root and frontend 31337 addresses match",
            "Addresses differ between deployments/31337.json and frontend deployments.json.",
            "Run: npm run deploy:localhost, then in frontend/ run npm run build (or restart dev).",
          ),
        );
      } else {
        results.push(pass(2, "deploy:localhost and deployments files", "31337.json + frontend deployments match."));
      }
    }
  }

  // Step 3: MetaMask — we can’t auto-detect; we just print a reminder
  results.push(
    pass(3, "MetaMask network 31337 / RPC 127.0.0.1:8545", "Manual: ensure MetaMask is on chainId 31337, RPC http://127.0.0.1:8545."),
  );

  // If step 1 or 2 failed, we stop here and don’t run steps 4–5
  const failedSoFar = results.filter((r) => !r.ok);
  if (failedSoFar.length > 0) {
    printResultsAndExit(results);
  }

  const simpleLendingAddress = (rootDeployments as Record<string, string>).simpleLendingAddress;
  if (!simpleLendingAddress) {
    results.push(fail(4, "Contract addresses from deployments", "simpleLendingAddress missing.", "Re-run deploy:localhost."));
    printResultsAndExit(results);
  }

  // Step 4: Do the frontend contract addresses match what’s on chain? (does the address have code?)
  const code = await hre.ethers.provider.getCode(simpleLendingAddress);
  if (!code || code === "0x" || code.length < 10) {
    results.push(
      fail(
        4,
        "Contract deployed at simpleLendingAddress",
        `No code at ${simpleLendingAddress}. Chain may have been reset.`,
        "Re-run: npm run deploy:localhost (with current node running).",
      ),
    );
    printResultsAndExit(results);
  }
  results.push(pass(4, "Contract deployed at simpleLendingAddress", "Bytecode present."));

  // Step 5: getPoolInfo / getUserPosition / calculateMax*
  let pool: Awaited<ReturnType<typeof hre.ethers.getContractAt>>;
  try {
    pool = await hre.ethers.getContractAt("LendingPoolImpl", simpleLendingAddress);
  } catch {
    results.push(
      fail(5, "LendingPoolImpl ABI / getPoolInfo", "getContractAt failed.", "Ensure contracts compile and LendingPoolImpl exists."),
    );
    printResultsAndExit(results);
  }

  const [signer] = await hre.ethers.getSigners();
  const account = await signer.getAddress();

  // 5a getPoolInfo
  try {
    await pool.getPoolInfo();
    results.push(pass(5, "getPoolInfo()", "OK"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(
      fail(
        5,
        "getPoolInfo()",
        msg,
        "Pool read failed. Re-run deploy:localhost and ensure frontend uses same deployments (rebuild if needed).",
      ),
    );
    printResultsAndExit(results);
  }

  // 5b getUserPosition
  try {
    await pool.getUserPosition(account);
    results.push(pass(5, "getUserPosition(account)", "OK"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(
      fail(
        5,
        "getUserPosition(account) / Oracle or position init",
        msg,
        "Position/Oracle read failed. Ensure full deploy (P6 Oracle set). Re-run: npm run deploy:localhost.",
      ),
    );
    printResultsAndExit(results);
  }

  // 5c calculateMaxWithdraw / calculateMaxBorrow
  try {
    await pool.calculateMaxWithdraw(account);
    await pool.calculateMaxBorrow(account);
    results.push(pass(5, "calculateMaxWithdraw/MaxBorrow(account)", "OK"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(
      fail(
        5,
        "calculateMaxWithdraw / calculateMaxBorrow",
        msg,
        "Max withdraw/borrow read failed. Usually same as getUserPosition (Oracle/config). Re-run full deploy:localhost.",
      ),
    );
    printResultsAndExit(results);
  }

  // All steps passed
  printResults(results);
  console.log("\n--- RESULT: All checks passed ---");
  console.log("Minimal next steps to run Supply→Borrow→Repay→Withdraw:");
  console.log("  1. Keep node running (8545).");
  console.log("  2. In MetaMask: network = chainId 31337, RPC = http://127.0.0.1:8545.");
  console.log("  3. Start frontend: cd frontend && npm run dev (or use built app).");
  console.log("  4. Connect wallet, open Dashboard, then perform Supply → Borrow → Repay → Withdraw.");
}

function printResults(results: StepResult[]): void {
  console.log("\n--- Dashboard read diagnostic ---\n");
  for (const r of results) {
    const badge = r.ok ? "[OK]" : "[FAIL]";
    console.log(`${badge} Step ${r.step}: ${r.name}`);
    if (r.detail) console.log(`    ${r.detail}`);
    if (r.fix) console.log(`    FIX: ${r.fix}`);
  }
}

function printResultsAndExit(results: StepResult[]): never {
  printResults(results);
  const first = results.find((r) => !r.ok);
  console.log("\n--- RESULT: First failing step ---");
  if (first) {
    console.log(`Step ${first.step}: ${first.name}`);
    if (first.detail) console.log(`Detail: ${first.detail}`);
    if (first.fix) console.log(`FIX: ${first.fix}`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error("Diagnostic script error:", e);
  process.exitCode = 1;
});
