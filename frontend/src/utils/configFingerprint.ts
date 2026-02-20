/**
 * Config fingerprint for multi-frontend consistency and anti-hijack verification.
 * Deterministic hash of version + chainId + deployment addresses.
 */

import type { Deployments } from "../contracts/deployments";

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute a short fingerprint (first 16 hex chars of SHA-256) for the given config.
 * Compare with official/canonical frontend to verify consistency.
 */
export async function computeConfigFingerprint(
  chainId: number | undefined,
  deployments: Deployments | undefined,
  version: string,
): Promise<string> {
  if (chainId === undefined || !deployments) return "n/a";
  const payload = JSON.stringify({
    version,
    chainId,
    addresses: {
      usd8Address: deployments.usd8Address,
      wethAddress: deployments.wethAddress,
      simpleLendingAddress: deployments.simpleLendingAddress,
      aTokenAddress: deployments.aTokenAddress,
      variableDebtTokenAddress: deployments.variableDebtTokenAddress,
      oracleRouterAddress: deployments.oracleRouterAddress,
      governorAddress: deployments.governorAddress,
      governanceTokenAddress: deployments.governanceTokenAddress,
      timelockAddress: deployments.timelockAddress,
    },
  });
  const enc = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return toHex(hash).slice(0, 16);
}
