import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrowserProvider } from "ethers";
import { getDeployments } from "../contracts/deployments";
import { getContracts } from "../contracts/contracts";
import { normalizeError } from "../state/errors";
import { errorWrongNetworkExpectedGotTemplate } from "../config/ui";
import { EVENT_BACKFILL_MAX_BLOCKS, REFRESH_THROTTLE_MS } from "../config/runtime";

/**
 * Drives the read side: fetches balances, pool, and position from the chain and refreshes
 * after confirmations and events so the UI stays up to date.
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
  const deployments = getDeployments(chainId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<DashboardSnapshot | undefined>();
  const [updatedAt, setUpdatedAt] = useState<number | undefined>();
  const [blockNumber, setBlockNumber] = useState<number | undefined>();

  // Prevent stale overwrites when multiple refreshes overlap.
  const refreshSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!provider || !account || !contracts) return;
    const seq = ++refreshSeq.current;
    setLoading(true);
    setError(undefined);
    try {
      const [network, block, usd8Balance, wethBalance] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
        contracts.usd8.balanceOf(account) as Promise<bigint>,
        contracts.weth.balanceOf(account) as Promise<bigint>,
      ]);

      if (!deployments || Number(network.chainId) !== deployments.chainId) {
        const msg = errorWrongNetworkExpectedGotTemplate
          .replace("{expected}", String(deployments?.chainId ?? chainId))
          .replace("{got}", String(network.chainId));
        throw new Error(msg);
      }

      if (seq !== refreshSeq.current) return;
      setData({ usd8Balance, wethBalance });
      setUpdatedAt(Date.now());
      setBlockNumber(block);

      const [poolInfo, userPosition, maxWithdraw, maxBorrow] = await Promise.all([
        contracts.lending.getPoolInfo() as Promise<[bigint, bigint, bigint, bigint, bigint]>,
        contracts.lending.getUserPosition(account) as Promise<[bigint, bigint, bigint, bigint]>,
        contracts.lending.calculateMaxWithdraw(account) as Promise<bigint>,
        contracts.lending.calculateMaxBorrow(account) as Promise<bigint>,
      ]);

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
    } catch (e) {
      if (seq !== refreshSeq.current) return;
      setError(normalizeError(e).message);
    } finally {
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, [account, chainId, contracts, deployments, provider]);

  // When wallet disconnects, clear dashboard data so we don't show stale balances/position (e.g. "Available: 9,999..." or Pool data).
  useEffect(() => {
    if (account !== undefined) return;
    setData(undefined);
    setError(undefined);
    setLoading(false);
  }, [account]);

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
    const lending = contracts?.lending;
    if (!provider || !lending || !account) return;

    try {
      const toBlock = await provider.getBlockNumber();
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
  }, [account, contracts?.lending, provider, scheduleRefresh]);

  useEffect(() => {
    const lending = contracts?.lending;
    if (!lending || !account) return;

    // Initialize backfill cursor when we first have a provider.
    (async () => {
      if (!provider) return;
      try {
        const bn = await provider.getBlockNumber();
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
  }, [account, contracts?.lending, provider, scheduleRefresh]);

  return { contracts, loading, error, data, refresh, backfillEvents, updatedAt, blockNumber };
}

