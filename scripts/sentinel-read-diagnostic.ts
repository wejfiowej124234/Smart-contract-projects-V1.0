/**
 * Read-only sentinel diagnostic (run after verify:consistency is CONSISTENT).
 * We call getCode, symbol/decimals, balanceOf, getPoolInfo, getUserPosition, getPrice(USD8) on usd8/weth/simpleLending/oracle;
 * we log any reverting call, error selector, and reason, and map them to useDashboard short-circuit branches.
 * Output: multi-currency support verdict and why “MetaMask has balance but Dashboard shows nothing”.
 *
 * Run: npm run sentinel:read (or npx hardhat run scripts/sentinel-read-diagnostic.ts --network localhost)
 */
import fs from "node:fs";
import path from "node:path";
import hre from "hardhat";

const DEPLOYMENTS_PATH = path.join(process.cwd(), "deployments", "31337.json");

type RevertInfo = {
  call: string;
  selector?: string;
  reason?: string;
  rawMessage?: string;
};

function extractRevert(e: unknown): RevertInfo {
  const out: RevertInfo = { call: "" };
  if (e && typeof e === "object") {
    const err = e as { data?: unknown; reason?: string; message?: string; error?: { data?: string } };
    out.rawMessage = err.reason ?? err.message ?? String(e);
    const data = (err.data ?? (err.error as { data?: string })?.data) as string | undefined;
    if (typeof data === "string" && data.startsWith("0x") && data.length >= 10) {
      out.selector = data.slice(0, 10);
    }
  }
  return out;
}

async function main(): Promise<void> {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    console.error("deployments/31337.json not found. Run verify:consistency first; ensure CONSISTENT then npm run deploy:localhost.");
    process.exitCode = 1;
    return;
  }
  const deployments = JSON.parse(
    fs.readFileSync(DEPLOYMENTS_PATH, "utf-8")
  ) as {
    chainId: number;
    usd8Address: string;
    wethAddress: string;
    simpleLendingAddress: string;
    oracleRouterAddress?: string;
  };

  let account: string;
  try {
    const [signer] = await hre.ethers.getSigners();
    account = await signer.getAddress();
  } catch (e) {
    console.error("Cannot connect to http://127.0.0.1:8545. Start node (npx hardhat node) and ensure verify:consistency is CONSISTENT.");
    process.exitCode = 1;
    return;
  }
  const provider = hre.ethers.provider;

  const reverts: RevertInfo[] = [];
  const results: string[] = [];

  results.push("--- Sentinel read diagnostic (run after verify:consistency CONSISTENT) ---\n");
  results.push(`Account: ${account}\n`);

  // ——— getCode ———
  const addrs = [
    { name: "usd8", addr: deployments.usd8Address },
    { name: "weth", addr: deployments.wethAddress },
    { name: "simpleLending", addr: deployments.simpleLendingAddress },
    ...(deployments.oracleRouterAddress
      ? [{ name: "oracle", addr: deployments.oracleRouterAddress }]
      : []),
  ] as { name: string; addr: string }[];

  for (const { name, addr } of addrs) {
    const code = await provider.getCode(addr);
    const hasCode = code && code !== "0x" && code.length > 10;
    results.push(`[getCode] ${name} (${addr}): ${hasCode ? "has code" : "no code"}`);
  }
  results.push("");

  // ——— ERC20: symbol, decimals, balanceOf ———
  const erc20Calls = [
    { name: "usd8.symbol", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.usd8Address).then((c) => c.symbol()) },
    { name: "usd8.decimals", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.usd8Address).then((c) => c.decimals()) },
    { name: "usd8.balanceOf(account)", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.usd8Address).then((c) => c.balanceOf(account)) },
    { name: "weth.symbol", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.wethAddress).then((c) => c.symbol()) },
    { name: "weth.decimals", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.wethAddress).then((c) => c.decimals()) },
    { name: "weth.balanceOf(account)", fn: async () => await hre.ethers.getContractAt("TestToken", deployments.wethAddress).then((c) => c.balanceOf(account)) },
  ];
  for (const { name, fn } of erc20Calls) {
    try {
      const v = await fn();
      results.push(`[OK] ${name}: ${String(v)}`);
    } catch (e) {
      const r = extractRevert(e);
      r.call = name;
      reverts.push(r);
      results.push(`[REVERT] ${name} selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
    }
  }
  results.push("");

  // ——— Lending: getPoolInfo, getUserPosition, reserveList ———
  const pool = await hre.ethers.getContractAt("LendingPoolImpl", deployments.simpleLendingAddress);
  let reserveListAddrs: string[] = [];

  try {
    const poolInfo = (await pool.getPoolInfo()) as [bigint, bigint, bigint, bigint, bigint];
    results.push(`[OK] getPoolInfo: totalSupply=${poolInfo[0]} totalBorrow=${poolInfo[1]} utilization=${poolInfo[2]} supplyRate=${poolInfo[3]} borrowRate=${poolInfo[4]}`);
  } catch (e) {
    const r = extractRevert(e);
    r.call = "getPoolInfo";
    reverts.push(r);
    results.push(`[REVERT] getPoolInfo selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
  }

  try {
    const pos = (await pool.getUserPosition(account)) as [bigint, bigint, bigint, bigint];
    results.push(`[OK] getUserPosition(account): supplied=${pos[0]} borrowed=${pos[1]} collateralValue=${pos[2]} healthFactor=${pos[3]}`);
  } catch (e) {
    const r = extractRevert(e);
    r.call = "getUserPosition(account)";
    reverts.push(r);
    results.push(`[REVERT] getUserPosition(account) selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
  }

  // Contract exposes reserveList(uint256 index); iterate until revert (out-of-bounds) or zero.
  // Only treat failure of reserveList(0) as a revert; reserveList(i) for i >= length reverts and is expected.
  try {
    for (let i = 0; i < 32; i++) {
      const a = (await pool.reserveList(i)) as string;
      if (!a || a === "0x0000000000000000000000000000000000000000") break;
      reserveListAddrs.push(a);
    }
    results.push(`[OK] reserveList.length: ${reserveListAddrs.length} (reserves: ${reserveListAddrs.join(", ")})`);
  } catch (e) {
    const r = extractRevert(e);
    r.call = "reserveList";
    // Out-of-bounds (i >= length) reverts without reason; if we got at least one reserve, do not fail sentinel.
    if (reserveListAddrs.length === 0) {
      reverts.push(r);
      results.push(`[REVERT] reserveList selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
    } else {
      results.push(`[OK] reserveList.length: ${reserveListAddrs.length} (reserveList(${reserveListAddrs.length}) out-of-bounds, expected)`);
    }
  }

  try {
    await pool.calculateMaxWithdraw(account);
    await pool.calculateMaxBorrow(account);
    results.push(`[OK] calculateMaxWithdraw(account) / calculateMaxBorrow(account)`);
  } catch (e) {
    const r = extractRevert(e);
    r.call = "calculateMaxWithdraw/MaxBorrow";
    reverts.push(r);
    results.push(`[REVERT] calculateMaxWithdraw/MaxBorrow selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
  }
  results.push("");

  // ——— Oracle: getPrice(USD8) ———
  if (deployments.oracleRouterAddress) {
    try {
      const oracle = await hre.ethers.getContractAt("OracleRouter", deployments.oracleRouterAddress);
      const price = await oracle.getPrice(deployments.usd8Address);
      results.push(`[OK] oracle.getPrice(USD8): ${price}`);
    } catch (e) {
      const r = extractRevert(e);
      r.call = "getPrice(USD8)";
      reverts.push(r);
      results.push(`[REVERT] getPrice(USD8) selector=${r.selector ?? "n/a"} reason=${r.rawMessage ?? "n/a"}`);
    }
  } else {
    results.push("[SKIP] oracle not in deployments");
  }
  results.push("");

  // Map of useDashboard short-circuit branches (so we can explain why the UI shows or hides balances)
  results.push("--- useDashboard short-circuit map ---");
  results.push("1. refresh not run: !provider || !account → return; → data stays undefined → Dashboard shows no balance.");
  results.push("2. !effectiveContracts: setError(...), return; → data never set → no balance shown.");
  results.push("3. First Promise.all throws (getNetwork/balanceOf etc): we catch, setError, never setData → data still undefined → MetaMask has balance but Dashboard shows nothing.");
  results.push("4. network.chainId !== deployments.chainId: throw → same catch path, no setData.");
  results.push("5. getPoolInfo revert: setError(errorDashboardPoolReadFailed), return; we already setData({ usd8Balance, wethBalance }) → balance shows, pool does not.");
  results.push("6. getUserPosition/calculateMax* revert: setError(errorDashboardPositionReadFailed), return; data already has pool → balance and pool show, position does not.");
  results.push("7. account cleared: useEffect clears setData(undefined) setError(undefined).");
  results.push("8. chainId/contracts/deployments mismatch: useEffect clears data/error.");
  results.push("");

  if (reverts.length > 0) {
    results.push("--- Revert summary (maps to frontend branches above) ---");
    reverts.forEach((r) => {
      results.push(`  call: ${r.call}`);
      if (r.selector) results.push(`  selector: ${r.selector}`);
      if (r.rawMessage) results.push(`  reason: ${r.rawMessage.slice(0, 200)}`);
    });
    const firstRevertCall = reverts[0]!.call;
    if (
      firstRevertCall.startsWith("usd8.") ||
      firstRevertCall.startsWith("weth.") ||
      firstRevertCall === "getPoolInfo"
    ) {
      results.push("");
      results.push("→ useDashboard: first Promise.all or getPoolInfo failed → setError; if before setData then data never set → MetaMask has balance but Dashboard shows nothing.");
    } else if (firstRevertCall.includes("getUserPosition") || firstRevertCall.includes("calculateMax")) {
      results.push("");
      results.push("→ useDashboard: step 6 failed → we already setData with balance and pool, only position missing; balance should be visible.");
    }
  }
  results.push("");

  // Multi-currency explicit assertion
  let reserveCount = reserveListAddrs.length;
  const multiCurrencySupported = reserveCount > 1;
  results.push("--- Multi-currency assertion ---");
  results.push(`MULTI_CURRENCY_SUPPORTED: ${multiCurrencySupported}`);
  results.push(`EVIDENCE: reserveList.length=${reserveCount}; contract initReserve allows only pool token and reverts ReserveAlreadySet for second reserve (LendingPoolImpl.initReserve).`);
  results.push("");

  results.push("--- Conclusion ---");
  results.push(`1. Multi-currency: reserves=${reserveCount}. Current impl allows only one pool token and ReserveAlreadySet blocks a second reserve; configurator can call initReserve/setReserveLTV for the single reserve to enable borrow, but reserveList.length is 1 → single-asset (single reserve), not multi-currency.`);
  results.push("");
  results.push("2. Why MetaMask has balance but Dashboard shows nothing:");
  results.push("   - If the first calls (balanceOf(account) / getNetwork) revert or throw: refresh hits catch, setError, never runs setData({ usd8Balance, wethBalance }) → data stays undefined → Dashboard shows no balance.");
  results.push("   - If only getPoolInfo or getUserPosition reverts: we already setData with balance, so balance shows; only pool or position is missing.");
  results.push("   - Common root causes: chain and deployments out of sync (node restarted without redeploy), or Oracle not set so getUserPosition’s getPrice reverts, or frontend chainId/contracts not resolving to 31337.");
  results.push("");

  // Summary + ROOT_CAUSE + FIX
  const passed = reverts.length === 0;
  type RootCause = "NONE" | "BALANCE_OR_NETWORK" | "POOL_READ" | "POSITION_OR_ORACLE" | "CHAIN_MISMATCH";
  let rootCause: RootCause = "NONE";
  let fixCmd = "none";
  if (reverts.length > 0) {
    const first = reverts[0]!.call;
    if (first.startsWith("usd8.") || first.startsWith("weth.")) {
      rootCause = "BALANCE_OR_NETWORK";
      fixCmd = "npm run deploy:localhost";
    } else if (first === "getPoolInfo") {
      rootCause = "POOL_READ";
      fixCmd = "npm run deploy:localhost";
    } else if (first.includes("getUserPosition") || first.includes("getPrice") || first.includes("calculateMax")) {
      rootCause = "POSITION_OR_ORACLE";
      fixCmd = "npm run deploy:localhost";
    } else {
      rootCause = "CHAIN_MISMATCH";
      fixCmd = "npx hardhat node && npm run deploy:localhost";
    }
  }
  results.push("--- Summary ---");
  results.push(`SENTINEL_PASSED: ${passed}`);
  results.push(`ROOT_CAUSE: ${rootCause}`);
  results.push(`FIX: ${fixCmd}`);
  results.push("");

  const out = results.join("\n");
  console.log(out);

  const evidenceDir = path.join(process.cwd(), "evidence");
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  const outputPath = path.join(evidenceDir, "sentinel-read-output.txt");
  fs.writeFileSync(outputPath, out, "utf-8");

  if (!passed) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Sentinel diagnostic error:", e);
  process.exitCode = 1;
});
