/**
 * RPC health check and status for zero-trust UI (10/10 mainnet).
 * Per-chain state (no cross-chain or cross-tab mix); primary→fallback; optional sessionStorage.
 * Used by useWallet to drive runtime state; getHealthyRpcUrl() is the single source for URL selection.
 */

import { getRpcUrls } from "./network";

const RPC_CHECK_TIMEOUT_MS = 5000;
const RPC_SESSION_FAIL_KEY = "rpcHealth:failCount";

export type RpcStatus = "ok" | "fallback" | "unavailable";

export type RpcStatusState = {
  chainId: number | undefined;
  url: string | undefined;
  status: RpcStatus;
  /** Per-chain cumulative probe failures (real runtime state for Diagnostics). */
  rpcFailCount: number;
  /** Timestamp (ms) when last probe succeeded. */
  rpcLastOkAt: number | undefined;
  /** When available: latest block number from probe (for drift). */
  blockNumber?: number;
  /** When available: block drift vs reference (blocks behind). */
  blockDrift?: number;
};

type ChainState = {
  failCount: number;
  lastOkAt: number | undefined;
  url: string | undefined;
  status: RpcStatus;
  blockNumber?: number;
  blockDrift?: number;
};

const byChain = new Map<number, ChainState>();

/** Current "active" chain for getRpcStatus() (set by last getHealthyRpcUrl(chainId)). */
let currentChainId: number | undefined;
let currentUrl: string | undefined;
let currentStatus: RpcStatus = "unavailable";
let currentFailCount = 0;
let currentLastOkAt: number | undefined;
let currentBlockNumber: number | undefined;
let currentBlockDrift: number | undefined;

function getChainState(chainId: number): ChainState {
  let s = byChain.get(chainId);
  if (!s) {
    const fromSession =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(`${RPC_SESSION_FAIL_KEY}:${chainId}`)
        : null;
    const failCount = fromSession ? Math.max(0, parseInt(fromSession, 10) || 0) : 0;
    s = { failCount, lastOkAt: undefined, url: undefined, status: "unavailable" };
    byChain.set(chainId, s);
  }
  return s;
}

function setChainState(
  chainId: number,
  url: string | undefined,
  status: RpcStatus,
  failCount: number,
  lastOkAt: number | undefined,
  blockNumber?: number,
  blockDrift?: number
): void {
  const s: ChainState = {
    failCount,
    lastOkAt,
    url,
    status,
    blockNumber,
    blockDrift,
  };
  byChain.set(chainId, s);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(`${RPC_SESSION_FAIL_KEY}:${chainId}`, String(failCount));
    } catch {
      // ignore quota
    }
  }
  currentChainId = chainId;
  currentUrl = url;
  currentStatus = status;
  currentFailCount = failCount;
  currentLastOkAt = lastOkAt;
  currentBlockNumber = blockNumber;
  currentBlockDrift = blockDrift;
}

export function getRpcStatus(): RpcStatusState {
  return {
    chainId: currentChainId,
    url: currentUrl,
    status: currentStatus,
    rpcFailCount: currentFailCount,
    rpcLastOkAt: currentLastOkAt,
    blockNumber: currentBlockNumber,
    blockDrift: currentBlockDrift,
  };
}

/** Probe: eth_chainId + eth_blockNumber for health and block drift. */
async function checkRpc(
  url: string,
  chainId: number
): Promise<{ ok: boolean; blockNumber?: number }> {
  try {
    const [chainRes, blockRes] = await Promise.all([
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
        signal: AbortSignal.timeout(RPC_CHECK_TIMEOUT_MS),
      }),
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] }),
        signal: AbortSignal.timeout(RPC_CHECK_TIMEOUT_MS),
      }),
    ]);
    const chainData = (await chainRes.json()) as { result?: unknown };
    const blockData = (await blockRes.json()) as { result?: string };
    if (!chainRes.ok || chainData.result == null) return { ok: false };
    const hexChain = typeof chainData.result === "string" ? chainData.result : String(chainData.result);
    if (parseInt(hexChain, 16) !== chainId) return { ok: false };
    let blockNumber: number | undefined;
    if (blockRes.ok && typeof blockData.result === "string") {
      blockNumber = parseInt(blockData.result, 16);
      if (!Number.isFinite(blockNumber)) blockNumber = undefined;
    }
    return { ok: true, blockNumber };
  } catch {
    return { ok: false };
  }
}

/** Max block drift (vs first healthy URL's block) before considering degraded. */
const BLOCK_DRIFT_THRESHOLD = 3;

/**
 * Returns first healthy RPC URL for the chain, or null if none respond.
 * Updates per-chain state (ok / fallback / unavailable) and rpcFailCount / rpcLastOkAt for UI and Diagnostics.
 */
export async function getHealthyRpcUrl(chainId: number): Promise<string | null> {
  const urls = getRpcUrls(chainId);
  const chainState = getChainState(chainId);
  let failCount = chainState.failCount;

  if (urls.length === 0) {
    setChainState(chainId, undefined, "unavailable", failCount, chainState.lastOkAt);
    return null;
  }

  let referenceBlock: number | undefined;
  for (let i = 0; i < urls.length; i++) {
    const { ok, blockNumber } = await checkRpc(urls[i]!, chainId);
    if (ok) {
      if (referenceBlock === undefined) referenceBlock = blockNumber;
      const drift =
        referenceBlock !== undefined && blockNumber !== undefined
          ? Math.max(0, referenceBlock - blockNumber)
          : undefined;
      const status: RpcStatus = i === 0 ? "ok" : "fallback";
      setChainState(chainId, urls[i], status, failCount, Date.now(), blockNumber, drift);
      return urls[i]!;
    }
    failCount++;
    setChainState(chainId, undefined, "unavailable", failCount, chainState.lastOkAt);
  }
  setChainState(chainId, undefined, "unavailable", failCount, chainState.lastOkAt);
  return null;
}

/** Block drift threshold: if current RPC is this many blocks behind reference, consider degraded (for UI hint). */
export const RPC_BLOCK_DRIFT_DEGRADED = BLOCK_DRIFT_THRESHOLD;

/** Per-chain snapshot for evidence/debug bundle (Diagnostics Copy debug bundle). */
export function getRpcHealthSnapshot(): Record<number, { status: RpcStatus; failCount: number; lastOkAt: number | undefined; blockDrift: number | undefined }> {
  const out: Record<number, { status: RpcStatus; failCount: number; lastOkAt: number | undefined; blockDrift: number | undefined }> = {};
  for (const [chainId, s] of byChain) {
    out[chainId] = { status: s.status, failCount: s.failCount, lastOkAt: s.lastOkAt, blockDrift: s.blockDrift };
  }
  return out;
}
