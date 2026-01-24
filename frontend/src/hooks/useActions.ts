import { Contract, MaxUint256 } from "ethers";
import { useCallback, useMemo, useState } from "react";
import type { BrowserProvider } from "ethers";
import { deployments } from "../contracts/deployments";
import { getWriteLending, getWriteToken } from "../contracts/write";
import { runTxDetailed, TX_IDLE, type TxState } from "../state/tx";
import { isUserRejected, normalizeError } from "../state/errors";
import { requireAmountStrict } from "../utils/amount";
import { clearTx, loadPendingTx } from "../state/txStore";
import { POST_STATE_MAX_WAIT_MS, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS } from "../config/runtime";
import { useEffect, useRef } from "react";

/**
 * CN：写模型（Write-model）：负责交易流（approve(if needed) → supply/withdraw/borrow/repay）与 tx 状态展示。
 * EN: Write-model: handles tx flows (approve(if needed) → supply/withdraw/borrow/repay) and tx state.
 */

type ApproveMode = "exact" | "infinite";

type Position = { supplied: bigint; borrowed: bigint };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function nowMs(): number {
  return Date.now();
}

export function useActions(params: {
  provider?: BrowserProvider;
  account?: string;
  chainId?: number;
  usd8?: Contract;
  lending?: Contract;
  decimals: number;
  onConfirmed?: () => void;
  approveMode?: ApproveMode;
}) {
  const { provider, account, chainId, usd8, lending, decimals, onConfirmed, approveMode = "exact" } = params;
  const [tx, setTx] = useState<TxState>(TX_IDLE);

  const ready = useMemo(() => !!provider && !!account && !!usd8 && !!lending, [provider, account, usd8, lending]);

  const fail = useCallback(
    (label: string, err: unknown) => {
      const normalized = normalizeError(err);
      const message = isUserRejected(err) ? "User rejected the request" : normalized.message;
      setTx({ stage: "failed", label, error: { ...normalized, message } });
    },
    [setTx],
  );

  // Per-action mutex to prevent double submits / state races.
  const locks = useRef<{ [k: string]: number }>({});
  const withLock = useCallback(async (key: string, fn: () => Promise<void>) => {
    if (locks.current[key]) {
      throw new Error("A transaction is already in progress for this action");
    }
    locks.current[key] = nowMs();
    try {
      await fn();
    } finally {
      delete locks.current[key];
    }
  }, []);

  const verifySeq = useRef(0);

  const readPosition = useCallback(async (): Promise<Position> => {
    if (!lending || !account) throw new Error("Wallet not connected");
    const p = (await lending.getUserPosition(account)) as [bigint, bigint, bigint, bigint];
    return { supplied: p[0], borrowed: p[1] };
  }, [account, lending]);

  const verifyPostState = useCallback(
    async (args: {
      label: string;
      hash: string;
      before: Position;
      amount: bigint;
      kind: "supply" | "withdraw" | "borrow" | "repay";
    }) => {
      const seq = ++verifySeq.current;
      const { label, hash, before, amount, kind } = args;

      const expected = (after: Position): boolean => {
        if (kind === "supply") return after.supplied >= before.supplied + amount;
        if (kind === "withdraw") return after.supplied <= before.supplied - amount;
        if (kind === "borrow") return after.borrowed >= before.borrowed + amount;
        return after.borrowed <= before.borrowed - amount;
      };

      setTx({ stage: "confirmed", label, hash, postState: { status: "verifying" } });

      const started = Date.now();
      while (Date.now() - started < POST_STATE_MAX_WAIT_MS) {
        if (seq !== verifySeq.current) return;
        try {
          const after = await readPosition();
          if (expected(after)) {
            setTx({ stage: "confirmed", label, hash, postState: { status: "verified" } });
            return;
          }
        } catch {
          // ignore transient read errors
        }
        await sleep(500);
      }

      if (seq !== verifySeq.current) return;
      setTx({
        stage: "confirmed",
        label,
        hash,
        postState: { status: "unverified", note: "RPC reads may be lagging; use Refresh to re-check" },
      });
    },
    [readPosition, setTx],
  );

  // Resume a pending tx after page refresh (best-effort).
  useEffect(() => {
    if (!provider || !account || chainId === undefined) return;
    const pending = loadPendingTx(chainId, account);
    if (!pending) return;
    if (tx.stage === "pending" && tx.hash === pending.hash) return;

    setTx({ stage: "pending", label: pending.label, hash: pending.hash });
    let cancelled = false;

    (async () => {
      try {
        await provider.waitForTransaction(pending.hash, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS);
        if (cancelled) return;
        setTx({ stage: "confirmed", label: pending.label, hash: pending.hash });
        if (onConfirmed) onConfirmed();
      } catch (e) {
        if (cancelled) return;
        const normalized = normalizeError(e);
        const isTimeout = normalized.code === "TIMEOUT" || /timeout/i.test(normalized.message);
        if (isTimeout) {
          setTx({ stage: "stuck", label: pending.label, hash: pending.hash, error: normalized });
          return;
        }
        setTx({ stage: "failed", label: pending.label, hash: pending.hash, error: normalized });
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally exclude `tx` to avoid loops; we only want to attempt resume on identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId, onConfirmed, provider]);

  const refreshPendingTx = useCallback(async () => {
    if (!provider || !account || chainId === undefined) return;
    if (!tx.hash || !tx.label) return;

    try {
      // Best-effort check; if still missing, wait bounded time.
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt) {
        const bn = await provider.getBlockNumber();
        const confirms = Math.max(0, bn - receipt.blockNumber + 1);
        if (confirms >= TX_CONFIRMATIONS) {
          setTx({ stage: receipt.status === 1 ? "confirmed" : "failed", label: tx.label, hash: tx.hash });
          clearTx(chainId, account);
          if (receipt.status === 1 && onConfirmed) onConfirmed();
          return;
        }
        setTx({ stage: "pending", label: tx.label, hash: tx.hash });
        return;
      }

      // If not mined yet, wait with timeout to avoid indefinite pending.
      await provider.waitForTransaction(tx.hash, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS);
      setTx({ stage: "confirmed", label: tx.label, hash: tx.hash });
      clearTx(chainId, account);
      if (onConfirmed) onConfirmed();
    } catch (e) {
      const normalized = normalizeError(e);
      const isTimeout = normalized.code === "TIMEOUT" || /timeout/i.test(normalized.message);
      setTx({ stage: isTimeout ? "stuck" : "failed", label: tx.label, hash: tx.hash, error: normalized });
      if (!isTimeout) clearTx(chainId, account);
    }
  }, [account, chainId, onConfirmed, provider, tx.hash, tx.label]);

  const clearPendingTx = useCallback(() => {
    if (!account || chainId === undefined) return;
    clearTx(chainId, account);
    setTx(TX_IDLE);
  }, [account, chainId, setTx]);

  const approveIfNeeded = useCallback(
    async (requiredAmount: bigint): Promise<boolean> => {
      if (!usd8 || !account) throw new Error("Wallet not connected");
      const allowance = (await usd8.allowance(account, deployments.simpleLendingAddress)) as bigint;
      if (allowance >= requiredAmount) return true;
      if (!provider) throw new Error("Wallet not connected");

      const desiredAllowance = approveMode === "infinite" ? MaxUint256 : requiredAmount;

      const signer = await provider.getSigner();
      const token = getWriteToken(usd8, signer);

      // Enterprise compatibility: some tokens require approve(0) before approve(non-zero).
      const doApprove = async (value: bigint, label: string) => {
        return runTxDetailed(
          label,
          () => token.approve(deployments.simpleLendingAddress, value),
          setTx,
          chainId !== undefined
            ? { persist: { chainId, account }, confirmations: TX_CONFIRMATIONS }
            : { confirmations: TX_CONFIRMATIONS },
        );
      };

      const r1 = await doApprove(desiredAllowance, "Approve USD8");
      if (r1.receipt) {
        if (onConfirmed) onConfirmed();
        return true;
      }

      // If the user rejected, do NOT attempt any fallback (avoid multiple wallet prompts).
      if (r1.error && isUserRejected(r1.error)) return false;

      // Fallback path (only when direct approve failed).
      if (allowance !== 0n && desiredAllowance !== 0n) {
        const r0 = await doApprove(0n, "Approve USD8 (reset)");
        if (r0.receipt) {
          const r2 = await doApprove(desiredAllowance, "Approve USD8");
          if (r2.receipt) {
            if (onConfirmed) onConfirmed();
            return true;
          }
          if (r2.error && isUserRejected(r2.error)) return false;
        }
        if (r0.error && isUserRejected(r0.error)) return false;
      }

      // Strategic note (why): write-model doesn't mutate local balances/allowance directly.
      // We refresh read-models on confirmation to keep a single source of truth (the chain).
      return false;
    },
    [account, approveMode, chainId, onConfirmed, provider, usd8],
  );

  const supply = useCallback(
    async (amountStr: string) => {
      const label = "Supply";
      try {
        if (!ready) throw new Error("Wallet not connected");
        await withLock("supply", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          const before = await readPosition();
          const approved = await approveIfNeeded(amount);
          if (!approved) return;
          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.supply(amount),
            setTx,
            chainId !== undefined ? { persist: { chainId, account: account! } } : undefined,
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "supply" });
          }
        });
      } catch (e) {
        fail(label, e);
      }
    },
    [
      account,
      approveIfNeeded,
      chainId,
      decimals,
      fail,
      lending,
      onConfirmed,
      provider,
      readPosition,
      ready,
      verifyPostState,
      withLock,
    ],
  );

  const withdraw = useCallback(
    async (amountStr: string) => {
      const label = "Withdraw";
      try {
        if (!ready) throw new Error("Wallet not connected");
        await withLock("withdraw", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          const before = await readPosition();

          // UX-only: avoid sending a tx that will obviously fail due to insufficient pool liquidity.
          const poolLiquidity = (await usd8!.balanceOf(deployments.simpleLendingAddress)) as bigint;
          if (poolLiquidity < amount) {
            throw new Error("Insufficient liquidity");
          }

          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.withdraw(amount),
            setTx,
            chainId !== undefined ? { persist: { chainId, account: account! } } : undefined,
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "withdraw" });
          }
        });
      } catch (e) {
        fail(label, e);
      }
    },
    [account, chainId, decimals, fail, lending, onConfirmed, provider, readPosition, ready, usd8, verifyPostState, withLock],
  );

  const borrow = useCallback(
    async (amountStr: string) => {
      const label = "Borrow";
      try {
        if (!ready) throw new Error("Wallet not connected");
        await withLock("borrow", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          const before = await readPosition();
          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.borrow(amount),
            setTx,
            chainId !== undefined ? { persist: { chainId, account: account! } } : undefined,
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "borrow" });
          }
        });
      } catch (e) {
        fail(label, e);
      }
    },
    [account, chainId, decimals, fail, lending, onConfirmed, provider, readPosition, ready, verifyPostState, withLock],
  );

  const repay = useCallback(
    async (amountStr: string) => {
      const label = "Repay";
      try {
        if (!ready) throw new Error("Wallet not connected");
        await withLock("repay", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          const before = await readPosition();
          const approved = await approveIfNeeded(amount);
          if (!approved) return;
          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.repay(amount),
            setTx,
            chainId !== undefined ? { persist: { chainId, account: account! } } : undefined,
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "repay" });
          }
        });
      } catch (e) {
        fail(label, e);
      }
    },
    [
      account,
      approveIfNeeded,
      chainId,
      decimals,
      fail,
      lending,
      onConfirmed,
      provider,
      readPosition,
      ready,
      verifyPostState,
      withLock,
    ],
  );

  return { tx, setTx, supply, withdraw, borrow, repay, ready, refreshPendingTx, clearPendingTx };
}

