#!/usr/bin/env node
/**
 * Minimal local CI: deploy → test → security-gate. Fail-fast (exit 1 on first failure).
 * Prerequisite: run `npx hardhat node` in another terminal so RPC http://127.0.0.1:8545 is up.
 *
 * Usage: node scripts/ci/local-release-loop.mjs
 *    or: npm run ci:local:release
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

function run(title, command, args, opts = {}) {
  console.log("\n--- " + title + " ---\n");
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    ...opts,
  });
  if (result.status !== 0) {
    console.error("\n[FAIL] " + title + " exited with " + result.status);
    process.exit(1);
  }
  return result;
}

console.log("Local release loop: deploy → smoke(localhost) → test → C3a-deviation test → security-gate (fail-fast). Ensure 'npx hardhat node' is running.\n");

run("Deploy (localhost)", "npm", ["run", "deploy:localhost"]);
run("Smoke (localhost deployment, BL-1)", "npm", ["run", "ci:smoke:localhost"]);
run("Test", "npm", ["run", "test"]);
run("C3a deviation test (BL-2)", "npm", ["run", "test", "--", "--grep", "PriceBoundGuard getPrice reverts when price deviates"]);
run("Security Gate (localhost)", "npm", ["run", "security-gate", "--", "--network", "localhost"]);

console.log("\n--- Local release loop: all steps passed ---\n");
