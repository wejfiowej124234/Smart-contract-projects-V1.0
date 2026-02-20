import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";

const ROOT = path.resolve(process.cwd());
/** RPC URL: single source of truth per docs/09 (http://127.0.0.1:8545). Override via LOCAL_RPC_URL. */
const { RPC_URL } = await import(path.join(ROOT, "configs", "localChain.mjs"));
const RPC_URL_PARSED = new URL(RPC_URL);
const RPC_HOST = process.env.RPC_HOST ?? RPC_URL_PARSED.hostname;
const RPC_PORT = Number(process.env.RPC_PORT ?? RPC_URL_PARSED.port || 8545);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort({ host, port, timeoutMs }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket
        .once("error", () => {
          socket.destroy();
          resolve(false);
        })
        .once("connect", () => {
          socket.end();
          resolve(true);
        })
        .connect(port, host);
    });
    if (ok) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${cmd} ${args.join(" ")}`));
    });
  });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertAddressLike(addr, label) {
  assert(typeof addr === "string", `${label} must be string`);
  assert(/^0x[0-9a-fA-F]{40}$/.test(addr), `${label} must look like an EVM address, got: ${addr}`);
}

async function main() {
  let nodeProc = null;

  // If a node is already running, reuse it; otherwise start a local one.
  let hadNode = false;
  try {
    await waitForPort({ host: RPC_HOST, port: RPC_PORT, timeoutMs: 800 });
    hadNode = true;
  } catch {
    hadNode = false;
  }

  if (!hadNode) {
    console.log(`[smoke:e2e] Starting Hardhat node on ${RPC_HOST}:${RPC_PORT}...`);
    nodeProc = spawn(
      process.platform === "win32" ? "npm" : "npm",
      ["run", "-s", "node"],
      {
        cwd: ROOT,
        env: process.env,
        stdio: "inherit",
        shell: process.platform === "win32",
      },
    );
    await waitForPort({ host: RPC_HOST, port: RPC_PORT, timeoutMs: 20_000 });
  } else {
    console.log(`[smoke:e2e] Reusing existing RPC at ${RPC_HOST}:${RPC_PORT}`);
  }

  try {
    console.log("[smoke:e2e] Deploying + exporting artifacts...");
    await run("npm", ["run", "-s", "deploy:localhost"]);

    const frontendDeploymentsPath = path.join(ROOT, "frontend", "src", "contracts", "deployments.json");
    const usd8AbiPath = path.join(ROOT, "frontend", "src", "abis", "TestToken.json");
    const lendingAbiPath = path.join(ROOT, "frontend", "src", "abis", "SimpleLending.json");

    assert(fs.existsSync(frontendDeploymentsPath), `Missing ${frontendDeploymentsPath}`);
    assert(fs.existsSync(usd8AbiPath), `Missing ${usd8AbiPath}`);
    assert(fs.existsSync(lendingAbiPath), `Missing ${lendingAbiPath}`);

    const frontendDeploymentsRaw = readJson(frontendDeploymentsPath);
    // Support both multi-chain format { "31337": { chainId, ... } } and legacy single { chainId, ... }
    const frontendDeployments =
      typeof frontendDeploymentsRaw.chainId === "number"
        ? frontendDeploymentsRaw
        : frontendDeploymentsRaw["31337"] ?? Object.values(frontendDeploymentsRaw)[0];
    assert(frontendDeployments && typeof frontendDeployments.chainId === "number", `Expected chainId in ${frontendDeploymentsPath}`);
    const chainId = frontendDeployments.chainId;

    const deploymentsPath = path.join(ROOT, "deployments", `${chainId}.json`);
    assert(fs.existsSync(deploymentsPath), `Missing ${deploymentsPath}`);
    const deployments = readJson(deploymentsPath);

    for (const d of [deployments, frontendDeployments]) {
      assert(d.chainId === chainId, `Expected chainId ${chainId}, got ${d.chainId}`);
      assertAddressLike(d.usd8Address, "usd8Address");
      assertAddressLike(d.wethAddress, "wethAddress");
      assertAddressLike(d.simpleLendingAddress, "simpleLendingAddress");
    }

    // E2E interaction using the *exported* ABIs.
    console.log("[smoke:e2e] Running chain interaction smoke using exported ABIs...");

    const { JsonRpcProvider, Contract, parseUnits } = await import("ethers");
    const provider = new JsonRpcProvider(RPC_URL);

    const usd8AbiJson = readJson(usd8AbiPath);
    const lendingAbiJson = readJson(lendingAbiPath);

    const usd8Abi = usd8AbiJson.abi ?? usd8AbiJson;
    const lendingAbi = lendingAbiJson.abi ?? lendingAbiJson;

    const signer = await provider.getSigner(1);
    const userAddress = await signer.getAddress();

    const usd8 = new Contract(deployments.usd8Address, usd8Abi, signer);
    const lending = new Contract(deployments.simpleLendingAddress, lendingAbi, signer);

    // Expect the deploy script seeded balances.
    const bal = await usd8.balanceOf(userAddress);
    assert(bal > 0n, `Expected seeded USD8 balance > 0 for ${userAddress}, got ${bal.toString()}`);

    const supplyAmt = parseUnits("10", 18);
    const borrowAmt = parseUnits("5", 18);

    const pool0 = await lending.getPoolInfo();
    const totalSupply0 = pool0[0];
    const totalBorrow0 = pool0[1];

    const approve1 = await usd8.approve(deployments.simpleLendingAddress, supplyAmt);
    await approve1.wait();

    const supplyTx = await lending.supply(supplyAmt);
    await supplyTx.wait();

    const pool1 = await lending.getPoolInfo();
    assert(pool1[0] === totalSupply0 + supplyAmt, `Expected totalSupply + supplyAmt, got ${pool1[0].toString()}`);

    const pos1 = await lending.getUserPosition(userAddress);
    assert(pos1[0] === supplyAmt, `Expected supplied == ${supplyAmt}, got ${pos1[0].toString()}`);
    assert(pos1[1] === 0n, `Expected borrowed == 0, got ${pos1[1].toString()}`);

    const maxBorrow1 = await lending.calculateMaxBorrow(userAddress);
    assert(maxBorrow1 === (supplyAmt * 75n) / 100n, `Expected maxBorrow == 75% of supply, got ${maxBorrow1.toString()}`);

    const borrowTx = await lending.borrow(borrowAmt);
    await borrowTx.wait();

    const pool2 = await lending.getPoolInfo();
    assert(pool2[1] === totalBorrow0 + borrowAmt, `Expected totalBorrow + borrowAmt, got ${pool2[1].toString()}`);

    const pos2 = await lending.getUserPosition(userAddress);
    assert(pos2[0] === supplyAmt, `Expected supplied unchanged, got ${pos2[0].toString()}`);
    assert(pos2[1] === borrowAmt, `Expected borrowed == ${borrowAmt}, got ${pos2[1].toString()}`);

    const maxBorrow2 = await lending.calculateMaxBorrow(userAddress);
    assert(
      maxBorrow2 === ((supplyAmt * 75n) / 100n) - borrowAmt,
      `Expected maxBorrow == 75% of supply - borrowed, got ${maxBorrow2.toString()}`,
    );

    const minRequiredSupply = (borrowAmt * 100n) / 75n;
    const maxWithdraw2 = await lending.calculateMaxWithdraw(userAddress);
    assert(
      maxWithdraw2 === supplyAmt - minRequiredSupply,
      `Expected maxWithdraw == supply - floor(borrow*100/75), got ${maxWithdraw2.toString()}`,
    );

    const approve2 = await usd8.approve(deployments.simpleLendingAddress, borrowAmt);
    await approve2.wait();

    const repayTx = await lending.repay(borrowAmt);
    await repayTx.wait();

    const pool3 = await lending.getPoolInfo();
    assert(pool3[1] === totalBorrow0, `Expected totalBorrow back to baseline, got ${pool3[1].toString()}`);

    const withdrawTx = await lending.withdraw(supplyAmt);
    await withdrawTx.wait();

    const pool4 = await lending.getPoolInfo();
    assert(pool4[0] === totalSupply0, `Expected totalSupply back to baseline, got ${pool4[0].toString()}`);

    const pos4 = await lending.getUserPosition(userAddress);
    assert(pos4[0] === 0n, `Expected supplied == 0, got ${pos4[0].toString()}`);
    assert(pos4[1] === 0n, `Expected borrowed == 0, got ${pos4[1].toString()}`);

    console.log("[smoke:e2e] OK: approve→supply→borrow→repay→withdraw flow succeeded against deployed addresses.");
  } finally {
    if (nodeProc) {
      console.log("[smoke:e2e] Stopping Hardhat node...");
      nodeProc.kill();
    }
  }
}

main().catch((e) => {
  console.error("[smoke:e2e] FAILED:", e);
  process.exitCode = 1;
});
