/**
 * Generate signed B4 L2 evidence file for release.
 * Usage:
 *   CHAIN_ID=42161 npx hardhat run scripts/release/sign-b4-evidence.ts
 *   npx hardhat run scripts/release/sign-b4-evidence.ts -- --chain-id 42161
 * Requires: PRIVATE_KEY or B4_SIGNER_PRIVATE_KEY (signer must be in b4EvidenceSigners for Gate to accept).
 */
import fs from "fs";
import path from "path";
import hre from "hardhat";
import {
  B4_EVIDENCE_DIR,
  B4_EVIDENCE_FILENAME,
  canonicalPayload,
  sha256Hex,
  getCommitSha,
  type B4EvidenceSigned,
} from "../security-gate/b4-evidence";

function getChainId(): number {
  const env = process.env.CHAIN_ID;
  if (env) return Number(env);
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--chain-id");
  if (i !== -1 && argv[i + 1]) return Number(argv[i + 1]);
  throw new Error("Set CHAIN_ID or --chain-id (e.g. 42161)");
}

async function main(): Promise<void> {
  const chainId = getChainId();
  const deploymentsPath = path.join(process.cwd(), "deployments", `${chainId}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`deployments/${chainId}.json not found. Deploy first.`);
  }
  const deploymentsContent = fs.readFileSync(deploymentsPath, "utf-8");
  const deploymentsHash = sha256Hex(deploymentsContent);
  const commitSha = getCommitSha();
  const timestamp = new Date().toISOString();

  const payload = { chainId, commitSha, deploymentsHash, timestamp };
  const message = canonicalPayload(payload);

  const pk = process.env.B4_SIGNER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!pk || !pk.startsWith("0x")) {
    throw new Error("Set B4_SIGNER_PRIVATE_KEY or PRIVATE_KEY (0x-prefixed hex) to sign evidence.");
  }
  const wallet = new hre.ethers.Wallet(pk);
  const signature = await wallet.signMessage(message);

  const evidence: B4EvidenceSigned = { ...payload, signature };
  const outDir = path.join(process.cwd(), B4_EVIDENCE_DIR);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, B4_EVIDENCE_FILENAME(chainId));
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
  console.log(`  chainId=${chainId} commitSha=${commitSha} deploymentsHash=${deploymentsHash.slice(0, 16)}... signer=${wallet.address}`);
  console.log(`  Add signer ${wallet.address} to scripts/config/security-gate-${chainId}.json b4EvidenceSigners for Gate to accept.`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
