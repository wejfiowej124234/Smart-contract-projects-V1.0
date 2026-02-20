import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrowserProvider } from "ethers";
import { getDeployments } from "../contracts/deployments";
import { getContracts } from "../contracts/contracts";
import { getLocalReadProvider } from "../config/localReadProvider";
import { DEFAULT_LOCAL_RPC, LOCAL_CHAIN_ID } from "../config/network";
import { normalizeError } from "../state/errors";
import {
  errorWrongNetworkExpectedGotTemplate,
  errorDashboardContractReadFailed,
  errorDashboardPoolReadFailed,
  errorDashboardPositionReadFailed,
  errorDashboardBalanceFetchFailed,
  errorRpcNetworkCheckNode,
} from "../config/ui";
import { EVENT_BACKFILL_MAX_BLOCKS, REFRESH_THROTTLE_MS } from "../config/runtime";
import { logRpcError } from "../utils/rpcErrorLog";

/** Chain id for Hardhat default local node. On this chain we use a direct read RPC and allow balance fetch to fall back to zero so the dashboard still loads when the wallet RPC is unavailable. */

/**
 * Drives dashboard read state: fetches token balances, pool info, and user position from the chain,
 * and refreshes after confirmations and events so the UI stays in sync with on-chain data.
 */

export type PoolInfo = {
  totalSupply: bigint;
  totalBorrow: bigint;
  utilizationRate: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
};

export type UserPosition = {
  supplied: bigint;
  borrowed: bigint;
  collateralValue: bigint;
  healthFactor: bigint;
  maxWithdraw: bigint;
  maxBorrow: bigint;
};

export type DashboardSnapshot = {
  usd8Balance: bigint;
  wethBalance: bigint;
  pool?: PoolInfo;
  position?: UserPosition;
};

export function useDashboard(provider?: BrowserProvider, account?: string, chainId?: number) {
  const contracts = useMemo(
    () => (provider && chainId !== undefined ? getContracts(provider, chainId) : undefined),
    [provider, chainId]
  );
  /** On local chain we use a direct RPC for reads so the dashboard continues to work when the wallet provider (e.g. MetaMask) is on a different RPC or fails. */
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
  const [data, setData] = useState<DashboardSnapshot | undefined>();
  const [updatedAt, setUpdatedAt] = useState<number | undefined>();
  const [blockNumber, setBlockNumber] = useState<number | undefined>();
  /** Block timestamp in seconds from getBlock(blockNumber).timestamp. Used for data provenance. */
  const [blockTimestamp, setBlockTimestamp] = useState<number | undefined>();
  /** Number of blocks behind chain head after a successful refresh. Shown as a freshness hint so users know how recent the data is. */
  const [blocksBehind, setBlocksBehind] = useState<number | undefined>();

  // We use a sequence number so that slower refreshes do not overwrite newer data when multiple refreshes run in parallel.
  const refreshSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!account) return;
    if (!effectiveProvider || !effectiveContracts) {
      setLoading(false);
      setError(`Unsupported chain or deployments not loaded. Add chain ${LOCAL_CHAIN_ID} in MetaMask (RPC ${DEFAULT_LOCAL_RPC}) and run deploy:localhost.`);
      return;
    }
    const seq = ++refreshSeq.current;
    setLoading(true);
    setError(undefined);
    let effectiveDeployments = deployments;
    try {
      const network = await effectiveProvider.getNetwork();
      const block = await effectiveProvider.getBlockNumber();

      if (!effectiveDeployments || Number(network.chainId) !== effectiveDeployments.chainId) {
        const msg = errorWrongNetworkExpectedGotTemplate
          .replace("{expected}", String(effectiveDeployments?.chainId ?? chainId))
          .replace("{got}", String(network.chainId));
        throw new Error(msg);
      }

      const isLocalChain = Number(network.chainId) === LOCAL_CHAIN_ID;
      let usd8Balance: bigint;
      let wethBalance: bigint;
      if (isLocalChain) {
        [usd8Balance, wethBalance] = await Promise.all([
          (effectiveContracts.usd8.balanceOf(account) as Promise<bigint>).catch(() => 0n),
          (effectiveContracts.weth.balanceOf(account) as Promise<bigint>).catch(() => 0n),
        ]);
      } else {
        [usd8Balance, wethBalance] = await Promise.all([
          effectiveContracts.usd8.balanceOf(account) as Promise<bigint>,
          effectiveContracts.weth.balanceOf(account) as Promise<bigint>,
        ]);
      }

      if (seq !== refreshSeq.current) return;
      setData({ usd8Balance, wethBalance });
      setUpdatedAt(Date.now());
      setBlockNumber(block);
      effectiveProvider.getBlock(block).then((b) => {
        if (seq === refreshSeq.current && b?.timestamp != null) setBlockTimestamp(Number(b.timestamp));
      }).catch(() => { if (seq === refreshSeq.current) setBlockTimestamp(undefined); });

      // Step 1: getPoolInfo — if this fails, addresses or chain likely wrong
      let poolInfo: [bigint, bigint, bigint, bigint, bigint];
      try {
        poolInfo = (await effectiveContracts.lending.getPoolInfo()) as [bigint, bigint, bigint, bigint, bigint];
      } catch (e) {
        if (seq !== refreshSeq.current) return;
        const normalized = normalizeError(e).message;
        setError(
          normalized === errorDashboardContractReadFailed ? errorDashboardPoolReadFailed : normalized,
        );
        setBlocksBehind(undefined);
        return;
      }

      if (seq !== refreshSeq.current) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              pool: {
                totalSupply: poolInfo[0],
                totalBorrow: poolInfo[1],
                utilizationRate: poolInfo[2],
                supplyRate: poolInfo[3],
                borrowRate: poolInfo[4],
              },
            }
          : prev,
      );

      // Step 2: getUserPosition + calculateMax* — if this fails, often oracle not set
      let userPosition: [bigint, bigint, bigint, bigint];
      let maxWithdraw: bigint;
      let maxBorrow: bigint;
      try {
        [userPosition, maxWithdraw, maxBorrow] = await Promise.all([
          effectiveContracts.lending.getUserPosition(account) as Promise<[bigint, bigint, bigint, bigint]>,
          effectiveContracts.lending.calculateMaxWithdraw(account) as Promise<bigint>,
          effectiveContracts.lending.calculateMaxBorrow(account) as Promise<bigint>,
        ]);
      } catch (e) {
        if (seq !== refreshSeq.current) return;
        const normalized = normalizeError(e).message;
        setError(
          normalized === errorDashboardContractReadFailed ? errorDashboardPositionReadFailed : normalized,
        );
        setBlocksBehind(undefined);
        return;
      }

      if (seq !== refreshSeq.current) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              position: {
                supplied: userPosition[0],
                borrowed: userPosition[1],
                collateralValue: userPosition[2],
                healthFactor: userPosition[3],
                maxWithdraw,
                maxBorrow,
              },
            }
          : prev,
      );
      // Block freshness: compare data block to current chain head
      try {
        const currentBlock = await effectiveProvider.getBlockNumber();
        if (seq === refreshSeq.current && currentBlock >= block) {
          setBlocksBehind(currentBlock - block);
        }
      } catch {
        if (seq === refreshSeq.current) setBlocksBehind(undefined);
      }
    } catch (e) {
      if (seq !== refreshSeq.current) return;
      logRpcError("dashboard.refresh", e);
      const normalized = normalizeError(e).message;
      // First batch (network + balances) failed: point user to chain + deploy + deployments match
      const isBalanceOrNetworkError =
        normalized === errorDashboardContractReadFailed ||
        normalized === errorRpcNetworkCheckNode ||
        /wrong network|balance|missing revert|could not coalesce|failed to fetch|ECONNREFUSED/i.test(normalized);
      setError(isBalanceOrNetworkError ? errorDashboardBalanceFetchFailed : normalized);
      // Clear block freshness so runtime risk doesn't keep an old blocksBehind that triggers "Writes disabled"
      setBlocksBehind(undefined);
    } finally {
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, [account, chainId, effectiveProvider, effectiveContracts, deployments]);

  // When wallet disconnects, clear dashboard data so we don't show stale balances/position.
  useEffect(() => {
    if (account !== undefined) return;
    setData(undefined);
    setError(undefined);
    setBlocksBehind(undefined);
    setBlockTimestamp(undefined);
    setLoading(false);
  }, [account]);

  // P1: When chain has no deployments or contracts (e.g. user switched to mainnet), clear data so we don't show stale cross-chain data.
  useEffect(() => {
    if (contracts != null && deployments != null && chainId === deployments.chainId) return;
    setData(undefined);
    setError(undefined);
    setBlocksBehind(undefined);
    setBlockTimestamp(undefined);
  }, [chainId, contracts, deployments]);

  // Mandatory: listen for contract events and update UI
  const refreshTimer = useRef<number | null>(null);
  const lastBackfillFromBlock = useRef<number | undefined>(undefined);

  const scheduleRefresh = useCallback(() => {
    // Strategic note (why): we throttle refresh calls because event bursts are common
    // (e.g., multiple logs per tx / reorg / provider reconnect). This avoids UI churn
    // while still updating quickly enough for a demo dashboard.
    if (refreshTimer.current !== null) return;
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      void refresh();
    }, REFRESH_THROTTLE_MS);
  }, [refresh]);

  // Best-effort backfill for missed events (provider reconnect / dropped subscription).
  const backfillEvents = useCallback(async () => {
    const lending = effectiveContracts?.lending;
    if (!effectiveProvider || !lending || !account) return;

    try {
      const toBlock = await effectiveProvider.getBlockNumber();
      const from = lastBackfillFromBlock.current ?? Math.max(0, toBlock - EVENT_BACKFILL_MAX_BLOCKS);
      const fromBlock = Math.max(from, toBlock - EVENT_BACKFILL_MAX_BLOCKS);

      // Query only user-specific events (indexed `user`).
      // NOTE: kept intentionally small-range to avoid heavy RPC.
      const filters = [
        lending.filters.Supplied(account),
        lending.filters.Withdrawn(account),
        lending.filters.Borrowed(account),
        lending.filters.Repaid(account),
      ];

      let found = false;
      for (const f of filters) {
        const logs = await lending.queryFilter(f, fromBlock, toBlock);
        if (logs.length > 0) {
          found = true;
          break;
        }
      }

      lastBackfillFromBlock.current = toBlock + 1;
      if (found) scheduleRefresh();
    } catch {
      // ignore; we'll try again on next tick
    }
  }, [account, effectiveContracts?.lending, effectiveProvider, scheduleRefresh]);

  useEffect(() => {
    const lending = effectiveContracts?.lending;
    if (!lending || !account) return;

    // Initialize backfill cursor when we first have a provider.
    (async () => {
      if (!effectiveProvider) return;
      try {
        const bn = await effectiveProvider.getBlockNumber();
        lastBackfillFromBlock.current = bn;
      } catch {
        // ignore
      }
    })();

    const onEvent = (user: string) => {
      if (user.toLowerCase() !== account.toLowerCase()) return;
      scheduleRefresh();
    };

    lending.on("Supplied", onEvent);
    lending.on("Withdrawn", onEvent);
    lending.on("Borrowed", onEvent);
    lending.on("Repaid", onEvent);

    return () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      lending.off("Supplied", onEvent);
      lending.off("Withdrawn", onEvent);
      lending.off("Borrowed", onEvent);
      lending.off("Repaid", onEvent);
    };
  }, [account, effectiveContracts?.lending, effectiveProvider, scheduleRefresh]);

  return { contracts, loading, error, data, refresh, backfillEvents, updatedAt, blockNumber, blockTimestamp, blocksBehind };
}

