import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrowserProvider } from "ethers";
import { deployments } from "../contracts/deployments";
import { getContracts } from "../contracts/contracts";
import { normalizeError } from "../state/errors";
import { EVENT_BACKFILL_MAX_BLOCKS } from "../config/runtime";

/**
 * CN：读模型（Read-model）：负责读取链上数据（余额、pool、position）并管理刷新策略（confirmed + events）。
 * EN: Read-model: reads on-chain data (balances, pool, position) and manages refresh strategy (confirmed + events).
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
  pool: PoolInfo;
  position: UserPosition;
};

export function useDashboard(provider?: BrowserProvider, account?: string) {
  const contracts = useMemo(() => (provider ? getContracts(provider) : undefined), [provider]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<DashboardSnapshot | undefined>();

  // Prevent stale overwrites when multiple refreshes overlap.
  const refreshSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (!provider || !account || !contracts) return;
    const seq = ++refreshSeq.current;
    setLoading(true);
    setError(undefined);
    try {
      const [network, usd8Balance, wethBalance] = await Promise.all([
        provider.getNetwork(),
        contracts.usd8.balanceOf(account) as Promise<bigint>,
        contracts.weth.balanceOf(account) as Promise<bigint>,
      ]);

      if (Number(network.chainId) !== deployments.chainId) {
        throw new Error(`Wrong network: expected ${deployments.chainId}, got ${network.chainId}`);
      }

      const [poolInfo, userPosition, maxWithdraw, maxBorrow] = await Promise.all([
        contracts.lending.getPoolInfo() as Promise<[bigint, bigint, bigint, bigint, bigint]>,
        contracts.lending.getUserPosition(account) as Promise<[bigint, bigint, bigint, bigint]>,
        contracts.lending.calculateMaxWithdraw(account) as Promise<bigint>,
        contracts.lending.calculateMaxBorrow(account) as Promise<bigint>,
      ]);

      if (seq !== refreshSeq.current) return;
      setData({
        usd8Balance,
        wethBalance,
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
      });
    } catch (e) {
      if (seq !== refreshSeq.current) return;
      setError(normalizeError(e).message);
    } finally {
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, [account, contracts, provider]);

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
    }, 250);
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

  return { contracts, loading, error, data, refresh, backfillEvents };
}

