import { JsonRpcProvider } from "ethers";
import { getRpcUrl, LOCAL_CHAIN_ID } from "./network";

let cached: JsonRpcProvider | null = null;

/**
 * Returns a read-only JsonRpcProvider for the local chain (31337).
 * Used so dashboard/block reads work even when MetaMask's RPC for 31337 is misconfigured or unreachable.
 * Signing and sending txs still use the wallet (MetaMask).
 */
export function getLocalReadProvider(chainId: number | undefined): JsonRpcProvider | undefined {
  if (chainId !== LOCAL_CHAIN_ID) return undefined;
  const url = getRpcUrl(LOCAL_CHAIN_ID);
  if (!url) return undefined;
  if (!cached) cached = new JsonRpcProvider(url);
  return cached;
}
