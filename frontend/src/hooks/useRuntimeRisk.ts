/**
 * Runtime risk adaptation: tier from RPC status, block freshness, health factor.
 * High tier => disable all writes (protocol-grade safety).
 *
 * Judgment path (Diagnostics → runtimeRisk → canWrite → UI badge):
 * - getRpcStatus() is updated by getHealthyRpcUrl() (direct fetch from browser).
 * - On local 31337, that fetch can fail (e.g. CORS) while the wallet (MetaMask) still
 *   uses the same RPC and can send txs. We must not treat "RPC unavailable" as
 *   write-disabling for 31337 (fix for incorrect judgment path).
 */

import { useMemo, useEffect, useRef } from "react";
import { getRpcStatus } from "../config/rpcHealth";
import { BLOCK_STALE_THRESHOLD, BLOCK_STALE_HIGH } from "../config/runtime";
import { HEALTH_FACTOR_BORDERLINE, HEALTH_FACTOR_WARN } from "../config/runtime";
import { LOCAL_CHAIN_ID } from "../config/network";
import { append as appendSessionEvidence } from "../state/sessionEvidence";

export type RuntimeRiskTier = "low" | "medium" | "high";

export type RuntimeRisk = {
  tier: RuntimeRiskTier;
  reasons: string[];
};

type Inputs = {
  chainId: number | undefined;
  blocksBehind: number | undefined;
  dashboardError: unknown;
  healthFactor: bigint | undefined;
};

export function useRuntimeRisk(inputs: Inputs): RuntimeRisk {
  const { chainId, blocksBehind, dashboardError, healthFactor } = inputs;
  const rpcStatus = getRpcStatus();
  const prevTierRef = useRef<RuntimeRiskTier | undefined>(undefined);

  const result = useMemo((): RuntimeRisk => {
    const reasons: string[] = [];
    let tier: RuntimeRiskTier = "low";

    const sameChain = chainId !== undefined && rpcStatus.chainId === chainId;

    if (sameChain && rpcStatus.status === "unavailable") {
      reasons.push("RPC unavailable");
      if (chainId !== LOCAL_CHAIN_ID) tier = "high";
    }
    if (sameChain && rpcStatus.status === "fallback") {
      reasons.push("Using fallback RPC");
      if (tier === "low") tier = "medium";
    }
    if (blocksBehind != null) {
      if (blocksBehind > BLOCK_STALE_HIGH) {
        reasons.push(`Data ${blocksBehind} blocks behind`);
        tier = "high";
      } else if (blocksBehind > BLOCK_STALE_THRESHOLD) {
        reasons.push(`Data ${blocksBehind} blocks behind`);
        if (tier === "low") tier = "medium";
      }
    }
    if (dashboardError) {
      reasons.push("Dashboard read error");
      if (tier === "low") tier = "medium";
    }
    if (healthFactor !== undefined) {
      const hf = healthFactor === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") ? 200 : Number(healthFactor);
      if (hf < HEALTH_FACTOR_BORDERLINE) {
        reasons.push("Health factor in danger");
        tier = "high";
      } else if (hf < HEALTH_FACTOR_WARN) {
        reasons.push("Health factor at risk");
        if (tier === "low" && chainId !== LOCAL_CHAIN_ID) tier = "medium";
      }
    }

    return { tier, reasons };
  }, [chainId, blocksBehind, dashboardError, healthFactor, rpcStatus.chainId, rpcStatus.status]);

  useEffect(() => {
    const prev = prevTierRef.current;
    prevTierRef.current = result.tier;
    if (prev !== "high" && result.tier === "high" && blocksBehind != null && blocksBehind > BLOCK_STALE_HIGH) {
      appendSessionEvidence("DataStale", { blocksBehind, reason: "blocksBehindHigh" });
    }
  }, [result.tier, blocksBehind]);

  return result;
}
