import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrowserProvider } from "ethers";
import { getDeployments } from "../contracts/deployments";
import { getContracts } from "../contracts/contracts";
import { getLocalReadProvider } from "../config/localReadProvider";
import { LOCAL_CHAIN_ID } from "../config/network";
import { normalizeError } from "../state/errors";

export type PoolInfo = {
  totalSupply: bigint;
  totalBorrow: bigint;
  utilizationRate: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
};

/**
 * Fetches pool info (rates, total supply/borrow) without requiring an account.
 * On 31337 uses direct read RPC so Markets/AssetDetail work when MetaMask RPC fails.
 */
export function usePoolInfo(provider?: BrowserProvider, chainId?: number) {
  const contracts = useMemo(
    () => (provider && chainId !== undefined ? getContracts(provider, chainId) : undefined),
    [provider, chainId]
  );
  const localReadProvider = useMemo(() => getLocalReadProvider(chainId), [chainId]);
  const readOnlyContracts = useMemo(
    () => (chainId === LOCAL_CHAIN_ID && localReadProvider ? getContracts(localReadProvider, LOCAL_CHAIN_ID) : undefined),
    [chainId, localReadProvider]
  );
  const effectiveProvider = chainId === LOCAL_CHAIN_ID && localReadProvider ? localReadProvider : provider;
  const effectiveContracts = chainId === LOCAL_CHAIN_ID && readOnlyContracts ? readOnlyContracts : contracts;
  const deployments = getDeployments(chainId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pool, setPool] = useState<PoolInfo | undefined>();
  const refreshSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!effectiveProvider || !effectiveContracts?.lending || !deployments) return;
    const seq = ++refreshSeq.current;
    setLoading(true);
    setError(undefined);
    try {
      const network = await effectiveProvider.getNetwork();
      if (Number(network.chainId) !== deployments.chainId) {
        setError(`Wrong network. Expected ${deployments.chainId}, got ${network.chainId}`);
        return;
      }
      if (seq !== refreshSeq.current) return;
      const [totalSupply, totalBorrow, utilizationRate, supplyRate, borrowRate] =
        (await effectiveContracts.lending.getPoolInfo()) as [bigint, bigint, bigint, bigint, bigint];
      if (seq !== refreshSeq.current) return;
      setPool({ totalSupply, totalBorrow, utilizationRate, supplyRate, borrowRate });
    } catch (e) {
      if (seq === refreshSeq.current) setError(normalizeError(e).message);
    } finally {
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, [effectiveContracts?.lending, deployments, effectiveProvider]);

  useEffect(() => {
    if (effectiveProvider && deployments && effectiveContracts?.lending) void refresh();
    else {
      setPool(undefined);
      setError(undefined);
      setLoading(false);
    }
  }, [effectiveProvider, deployments, effectiveContracts?.lending, refresh]);

  return { pool, loading, error, refresh };
}
