import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import { subtask, task } from "hardhat/config";
import path from "path";

// HH506 fix: use solc from node_modules (soljson) so compile/test work without cache or native download.
const TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD = "compile:solidity:solc:get-build";

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async (args: { quiet: boolean; solcVersion: string }, { runSuper }) => {
  if (args.solcVersion === "0.8.19") {
    const compilerPath = path.resolve(
      require.resolve("solc/package.json", { paths: [process.cwd()] }).replace("package.json", "soljson.js")
    );
    return {
      compilerPath,
      isSolcJs: true as const,
      version: "0.8.19",
      longVersion: "0.8.19+commit.7dd6d404",
    };
  }
  return runSuper(args);
});

task("security-gate", "Run Final Security Gate checks (B1–B4, C1–C3) against deployed contracts")
  .setAction(async () => {
    const { runSecurityGate } = await import("./scripts/security-gate/verify");
    const { results, allPass } = await runSecurityGate();
    console.log("\n--- Final Security Gate (B1–B4, C1–C3) ---\n");
    for (const r of results) {
      const badge = r.status === "Pass" ? "[Pass]" : r.status === "Fail" ? "[Fail]" : "[Skip]";
      console.log(`${badge} ${r.id}: ${r.name}`);
      if (r.detail) console.log(`    ${r.detail}`);
      if (r.location) console.log(`    → ${r.location}`);
    }
    console.log("\n---");
    if (allPass) {
      console.log("Result: All critical checks Pass or Skip.\n");
    } else {
      console.log("Result: One or more critical checks Fail. See audits/final-security-gate-mainnet.md.\n");
      process.exitCode = 1;
    }
  });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org",
      chainId: 11155111
    }
  }
};

export default config;
