import { useEffect, useState, useMemo } from "react";
import { getLocalReadProvider } from "../config/localReadProvider";
import { getRpcUrl, LOCAL_CHAIN_ID } from "../config/network";

export type SplitProviderState = {
  /** Chain ID from the read RPC (127.0.0.1:8545 for 31337). Only set when wallet is on 31337. */
  readChainId: number | undefined;
  /** URL used for read RPC (local only). */
  readRpcUrl: string | undefined;
  /** True when wallet is on 31337 and readChainId !== walletChainId → disable writes. */
  mismatch: boolean;
};

/**
 * Local-only split provider: reads use JsonRpcProvider(127.0.0.1:8545), writes use MetaMask.
 * When chainId is 31337, fetches readChainId from the read RPC and compares to walletChainId.
 * If they differ, mismatch=true → UI should show "Network mismatch" and disable writes.
 */
export function useSplitProvider(walletChainId: number | undefined): SplitProviderState {
  const readProvider = useMemo(() => getLocalReadProvider(walletChainId), [walletChainId]);
  const readRpcUrl = useMemo(
    () => (walletChainId === LOCAL_CHAIN_ID ? getRpcUrl(LOCAL_CHAIN_ID) : undefined),
    [walletChainId]
  );

  const [readChainId, setReadChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!readProvider || walletChainId !== LOCAL_CHAIN_ID) {
      setReadChainId(undefined);
      return;
    }
    let cancelled = false;
    readProvider
      .getNetwork()
      .then((net) => {
        if (!cancelled) setReadChainId(Number(net.chainId));
      })
      .catch(() => {
        if (!cancelled) setReadChainId(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [readProvider, walletChainId]);

  const mismatch = useMemo(() => {
    if (walletChainId !== LOCAL_CHAIN_ID) return false;
    if (readChainId === undefined || walletChainId === undefined) return false;
    return readChainId !== walletChainId;
  }, [readChainId, walletChainId]);

  return {
    readChainId,
    readRpcUrl,
    mismatch,
  };
}
