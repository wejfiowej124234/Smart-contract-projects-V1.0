/**
 * B4 L2 evidence: signed, verifiable payload.
 * Payload = canonical JSON { chainId, commitSha, deploymentsHash, timestamp }.
 * Signature = EIP-191 personal_sign over payload string; verified against allowed signers.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

export const B4_EVIDENCE_DIR = "docs/release";
export const B4_EVIDENCE_FILENAME = (chainId: number) => `B4-L2-evidence-${chainId}.json`;

export interface B4EvidencePayload {
  chainId: number;
  commitSha: string;
  deploymentsHash: string;
  timestamp: string;
}

export interface B4EvidenceSigned extends B4EvidencePayload {
  signature: string;
}

const PAYLOAD_KEYS: (keyof B4EvidencePayload)[] = ["chainId", "commitSha", "deploymentsHash", "timestamp"];

/** Canonical string for signing/verification (stable key order). */
export function canonicalPayload(p: B4EvidencePayload): string {
  const o: Record<string, unknown> = {};
  for (const k of PAYLOAD_KEYS) {
    o[k] = p[k];
  }
  return JSON.stringify(o);
}

export function sha256Hex(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

export function getCommitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/** From env (CI): BUILD_SHA, GITHUB_SHA, COMMIT_SHA. */
export function getCurrentCommitSha(): string {
  return (
    process.env.BUILD_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_SHA ??
    getCommitSha()
  );
}

export function loadB4Evidence(chainId: number): B4EvidenceSigned | null {
  const evidencePath = path.join(process.cwd(), B4_EVIDENCE_DIR, B4_EVIDENCE_FILENAME(chainId));
  if (!fs.existsSync(evidencePath)) return null;
  const raw = JSON.parse(fs.readFileSync(evidencePath, "utf-8")) as unknown;
  if (
    typeof raw !== "object" ||
    raw === null ||
    typeof (raw as B4EvidenceSigned).chainId !== "number" ||
    typeof (raw as B4EvidenceSigned).commitSha !== "string" ||
    typeof (raw as B4EvidenceSigned).deploymentsHash !== "string" ||
    typeof (raw as B4EvidenceSigned).timestamp !== "string" ||
    typeof (raw as B4EvidenceSigned).signature !== "string"
  ) {
    return null;
  }
  return raw as B4EvidenceSigned;
}

export type B4EvidenceVerifyResult =
  | { ok: true; signer: string }
  | { ok: false; reason: string };

/** VerifyMessage must return the recovered signer address (e.g. ethers.verifyMessage). */
export type VerifyMessageFn = (message: string, signature: string) => string;

/**
 * Verify evidence against current build state and allowed signers.
 * Caller supplies verifyMessage (e.g. from hre.ethers) to avoid hardhat import in this module.
 */
export function verifyB4Evidence(
  evidence: B4EvidenceSigned,
  currentChainId: number,
  currentDeploymentsHash: string,
  currentCommitSha: string,
  allowedSigners: string[],
  verifyMessage: VerifyMessageFn
): B4EvidenceVerifyResult {
  if (evidence.chainId !== currentChainId) {
    return { ok: false, reason: `evidence.chainId ${evidence.chainId} !== current ${currentChainId}` };
  }
  if (evidence.commitSha !== currentCommitSha) {
    return { ok: false, reason: `evidence.commitSha ${evidence.commitSha} !== current ${currentCommitSha}` };
  }
  if (evidence.deploymentsHash !== currentDeploymentsHash) {
    return { ok: false, reason: `evidence.deploymentsHash !== current deployments hash` };
  }
  const payload = canonicalPayload({
    chainId: evidence.chainId,
    commitSha: evidence.commitSha,
    deploymentsHash: evidence.deploymentsHash,
    timestamp: evidence.timestamp,
  });
  try {
    const signer = verifyMessage(payload, evidence.signature);
    const signerLower = signer.toLowerCase();
    const allowed = allowedSigners.some((a) => a.toLowerCase() === signerLower);
    if (!allowed) {
      return { ok: false, reason: `signer ${signer} not in b4EvidenceSigners` };
    }
    return { ok: true, signer };
  } catch (e) {
    return { ok: false, reason: `signature verification failed: ${e}` };
  }
}
