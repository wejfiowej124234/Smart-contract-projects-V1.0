import { Contract, MaxUint256 } from "ethers";
import { useCallback, useMemo, useState } from "react";
import type { BrowserProvider } from "ethers";
import { getWriteLending, getWriteToken } from "../contracts/write";
import { runTxDetailed, TX_IDLE, type TxState } from "../state/tx";
import { isUserRejected, normalizeError } from "../state/errors";
import { requireAmountStrict } from "../utils/amount";
import { logRpcError, logSendPath } from "../utils/rpcErrorLog";
import { setSplitMatch } from "../state/sendPathEvidence";
import { clearTx, loadPendingTx } from "../state/txStore";
import { appendTxHistory } from "../state/txHistory";
import { append as appendSessionEvidence } from "../state/sessionEvidence";
import { POST_STATE_MAX_WAIT_MS, POST_STATE_POLL_INTERVAL_MS, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS } from "../config/runtime";
import {
  supply as labelSupply,
  withdraw as labelWithdraw,
  borrow as labelBorrow,
  repay as labelRepay,
  approveLabelUsd8,
  approveLabelUsd8Reset,
  errorWalletNotConnected,
  errorTxAlreadyInProgress,
  errorInsufficientLiquidity,
  errorUserRejectedRequest,
  postStateUnverifiedNote,
} from "../config/ui";
import { useEffect, useRef } from "react";

/**
 * Drives the write side: runs the tx flow (approve when needed, then supply/withdraw/borrow/repay)
 * and keeps tx state for the UI so you always know where the transaction stands.
 */

type ApproveMode = "exact" | "infinite";

type Position = { supplied: bigint; borrowed: bigint };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function nowMs(): number {
  return Date.now();
}

/** True when the error is from a failed eth_call/estimateGas (no tx sent yet, so no popup). */
function isCallException(err: unknown): boolean {
  if (err == null) return false;
  const o = err as { code?: string | number; message?: string };
  const code = o?.code != null ? String(o.code) : "";
  const msg = (o?.message ?? "") as string;
  return code === "CALL_EXCEPTION" || /missing revert data|execution reverted/i.test(msg);
}

export function useActions(params: {
  provider?: BrowserProvider;
  account?: string;
  chainId?: number;
  usd8?: Contract;
  lending?: Contract;
  simpleLendingAddress?: string;
  decimals: number;
  onConfirmed?: () => void;
  approveMode?: ApproveMode;
  /** When false (readChainId !== walletChainId on 31337), write actions are disabled. */
  splitMatch?: boolean;
}) {
  const { provider, account, chainId, usd8, lending, simpleLendingAddress, decimals, onConfirmed, approveMode = "exact", splitMatch } = params;
  const [tx, setTx] = useState<TxState>(TX_IDLE);

  const ready = useMemo(
    () => !!provider && !!account && !!usd8 && !!lending && !!simpleLendingAddress,
    [provider, account, usd8, lending, simpleLendingAddress]
  );

  const fail = useCallback(
    (label: string, err: unknown) => {
      const normalized = normalizeError(err);
      const message = isUserRejected(err) ? errorUserRejectedRequest : normalized.message;
      setTx((prev) => ({
        ...prev,
        stage: "failed",
        label,
        error: { ...normalized, message },
        startedAtMs: prev.startedAtMs ?? Date.now(),
        submittedAtMs: prev.submittedAtMs,
        confirmedAtMs: Date.now(),
      }));
    },
    [setTx],
  );

  // Per-action mutex to prevent double submits / state races.
  const locks = useRef<{ [k: string]: number }>({});
  const withLock = useCallback(async (key: string, fn: () => Promise<void>) => {
    if (locks.current[key]) {
      throw new Error(errorTxAlreadyInProgress);
    }
    locks.current[key] = nowMs();
    try {
      await fn();
    } finally {
      delete locks.current[key];
    }
  }, []);

  const verifySeq = useRef(0);
  const lastAppendedHashRef = useRef<string | null>(null);
  /** Shippable: amount string for the in-flight tx so Activity history can show it. */
  const lastSubmittedAmountRef = useRef<string>("");

  const readPosition = useCallback(async (): Promise<Position> => {
    if (!lending || !account) throw new Error(errorWalletNotConnected);
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

      setTx((prev) => ({
        ...prev,
        stage: "confirmed",
        label,
        hash,
        postState: { status: "verifying" },
        confirmedAtMs: prev.confirmedAtMs ?? Date.now(),
      }));

      const started = Date.now();
      while (Date.now() - started < POST_STATE_MAX_WAIT_MS) {
        if (seq !== verifySeq.current) return;
        try {
          const after = await readPosition();
          if (expected(after)) {
            setTx((prev) => ({ ...prev, stage: "confirmed", label, hash, postState: { status: "verified" }, confirmedAtMs: prev.confirmedAtMs ?? Date.now() }));
            return;
          }
        } catch {
          // ignore transient read errors
        }
        await sleep(POST_STATE_POLL_INTERVAL_MS);
      }

      if (seq !== verifySeq.current) return;
      setTx((prev) => ({
        ...prev,
        stage: "confirmed",
        label,
        hash,
        postState: { status: "unverified", note: postStateUnverifiedNote },
        confirmedAtMs: prev.confirmedAtMs ?? Date.now(),
      }));
    },
    [readPosition, setTx],
  );

  const lastTxSubmitHashRef = useRef<string | null>(null);
  useEffect(() => {
    if (tx.stage !== "pending" || !tx.hash || !tx.label || chainId === undefined) return;
    if (lastTxSubmitHashRef.current === tx.hash) return;
    lastTxSubmitHashRef.current = tx.hash;
    appendSessionEvidence("TxSubmit", { action: tx.label, txHash: tx.hash, chainId });
  }, [tx.stage, tx.hash, tx.label, chainId]);

  // F8: Append to Activity history when tx settles (confirmed/failed/dropped); once per hash.
  useEffect(() => {
    if (chainId === undefined || !account || !tx.hash || !tx.label) return;
    const settled = tx.stage === "confirmed" || tx.stage === "failed" || (tx.stage === "stuck" && tx.outcome === "dropped");
    if (!settled) return;
    if (lastAppendedHashRef.current === tx.hash) return;
    lastAppendedHashRef.current = tx.hash;
    if (tx.stage === "confirmed") {
      appendSessionEvidence("TxConfirm", { txHash: tx.hash, blockNumber: tx.blockNumber, gasUsed: tx.gasUsed });
    } else {
      const msg = tx.error?.message ?? "";
      appendSessionEvidence("TxFail", { action: tx.label, kind: tx.error?.kind, messagePreview: msg.slice(0, 64) });
    }
    const amountStr = lastSubmittedAmountRef.current || "";
    if (lastSubmittedAmountRef.current) lastSubmittedAmountRef.current = "";
    appendTxHistory(chainId, account, {
      type: tx.label,
      asset: "USD8",
      amount: amountStr,
      txHash: tx.hash,
      status: tx.stage === "confirmed" ? "success" : "failed",
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed,
      outcome: tx.outcome,
      replacementHash: tx.replacementHash,
      droppedReason: tx.droppedReason,
    });
  }, [chainId, account, tx.stage, tx.hash, tx.label, tx.blockNumber, tx.gasUsed, tx.error?.message, tx.error?.kind, tx.outcome, tx.replacementHash, tx.droppedReason]);

  // Resume a pending tx after page refresh (best-effort).
  useEffect(() => {
    if (!provider || !account || chainId === undefined) return;
    const pending = loadPendingTx(chainId, account);
    if (!pending) return;
    if (tx.stage === "pending" && tx.hash === pending.hash) return;

      setTx({ stage: "pending", label: pending.label, hash: pending.hash, startedAtMs: pending.updatedAtMs, submittedAtMs: pending.updatedAtMs });
    let cancelled = false;

    (async () => {
      try {
        await provider.waitForTransaction(pending.hash, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS);
        if (cancelled) return;
          setTx((prev) => ({ ...prev, stage: "confirmed", label: pending.label, hash: pending.hash, confirmedAtMs: Date.now() }));
        if (onConfirmed) onConfirmed();
      } catch (e) {
        if (cancelled) return;
        const normalized = normalizeError(e);
        const isTimeout = normalized.code === "TIMEOUT" || /timeout/i.test(normalized.message);
        if (isTimeout) {
            setTx((prev) => ({ ...prev, stage: "stuck", label: pending.label, hash: pending.hash, error: normalized }));
          return;
        }
          setTx((prev) => ({ ...prev, stage: "failed", label: pending.label, hash: pending.hash, error: normalized, confirmedAtMs: Date.now() }));
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
            setTx((prev) => ({
              ...prev,
              stage: receipt.status === 1 ? "confirmed" : "failed",
              label: tx.label,
              hash: tx.hash,
              confirmedAtMs: Date.now(),
            }));
          clearTx(chainId, account);
          if (receipt.status === 1 && onConfirmed) onConfirmed();
          return;
        }
          setTx((prev) => ({ ...prev, stage: "pending", label: tx.label, hash: tx.hash }));
        return;
      }

      // If not mined yet, wait with timeout to avoid indefinite pending.
      await provider.waitForTransaction(tx.hash, TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS);
        setTx((prev) => ({ ...prev, stage: "confirmed", label: tx.label, hash: tx.hash, confirmedAtMs: Date.now() }));
      clearTx(chainId, account);
      if (onConfirmed) onConfirmed();
    } catch (e) {
      const normalized = normalizeError(e);
      const isTimeout = normalized.code === "TIMEOUT" || /timeout/i.test(normalized.message);
        setTx((prev) => ({
          ...prev,
          stage: isTimeout ? "stuck" : "failed",
          label: tx.label,
          hash: tx.hash,
          error: normalized,
          confirmedAtMs: isTimeout ? prev.confirmedAtMs : Date.now(),
        }));
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
      if (!usd8 || !account) throw new Error(errorWalletNotConnected);
      const allowance = (await usd8.allowance(account, simpleLendingAddress!)) as bigint;
      if (allowance >= requiredAmount) return true;
      if (!provider) throw new Error(errorWalletNotConnected);

      const desiredAllowance = approveMode === "infinite" ? MaxUint256 : requiredAmount;

      setSplitMatch(splitMatch ?? true);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      if (provider) {
        try {
          const network = await provider.getNetwork();
          const pendingNonce = await provider.getTransactionCount(signerAddress, "pending");
          logSendPath("preWrite.walletState", { walletChainId: Number(network.chainId), pendingNonce });
        } catch {
          // ignore
        }
      }
      logSendPath("approve.signer", { signerAddress });
      const token = getWriteToken(usd8, signer);

      // Enterprise compatibility: some tokens require approve(0) before approve(non-zero).
      const doApprove = async (value: bigint, label: string) => {
        logSendPath("approve.write", { label, value: value.toString() });
        const baseOpts = chainId !== undefined
          ? { persist: { chainId, account }, confirmations: TX_CONFIRMATIONS, provider }
          : { confirmations: TX_CONFIRMATIONS, provider };
        return runTxDetailed(
          label,
          () => token.approve(simpleLendingAddress!, value),
          setTx,
          {
            ...baseOpts,
            meta: { chainId, contractAddress: (usd8 as { target?: string })?.target, method: "approve", args: [simpleLendingAddress, value.toString()] },
          },
        );
      };

      const r1 = await doApprove(desiredAllowance, approveLabelUsd8);
      if (r1.receipt) {
        if (onConfirmed) onConfirmed();
        return true;
      }

      // If the user rejected, do NOT attempt any fallback (avoid multiple wallet prompts).
      if (r1.error && isUserRejected(r1.error)) return false;

      // When estimateGas fails (CALL_EXCEPTION), force-send approve with fixed gasLimit so MetaMask can pop up.
      if (r1.error) {
        const callException = isCallException(r1.error);
        if (callException) {
          logSendPath("approve.forceSend", { reason: "callException" });
          const r1Force = await runTxDetailed(
            approveLabelUsd8,
            () =>
              usd8.connect(signer).getFunction("approve")(simpleLendingAddress!, desiredAllowance, { gasLimit: 150000n }),
            setTx,
            {
              ...(chainId !== undefined ? { persist: { chainId, account }, confirmations: TX_CONFIRMATIONS, provider } : { confirmations: TX_CONFIRMATIONS, provider }),
              meta: { chainId, contractAddress: (usd8 as { target?: string })?.target, method: "approve", args: [simpleLendingAddress, desiredAllowance.toString()] },
            },
          );
          if (r1Force.receipt) {
            if (onConfirmed) onConfirmed();
            return true;
          }
          if (r1Force.error && isUserRejected(r1Force.error)) return false;
        } else {
          logSendPath("approve.skipForceSend", {
            code: (r1.error as { code?: unknown })?.code,
            message: (r1.error as { message?: string })?.message?.slice(0, 80),
          });
        }
      }

      // Fallback path (only when direct approve failed).
      if (allowance !== 0n && desiredAllowance !== 0n) {
        const r0 = await doApprove(0n, approveLabelUsd8Reset);
        if (r0.receipt) {
          const r2 = await doApprove(desiredAllowance, approveLabelUsd8);
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
    [account, approveMode, chainId, onConfirmed, provider, simpleLendingAddress, splitMatch, usd8],
  );

  const supply = useCallback(
    async (amountStr: string) => {
      const label = labelSupply;
      try {
        if (!ready) throw new Error(errorWalletNotConnected);
        await withLock("supply", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          lastSubmittedAmountRef.current = amountStr;
          const before = await readPosition();
          const approved = await approveIfNeeded(amount);
          if (!approved) return;
          setSplitMatch(splitMatch ?? true);
          const signer = await provider!.getSigner();
          const signerAddress = await signer.getAddress();
          try {
            const network = await provider!.getNetwork();
            const pendingNonce = await provider!.getTransactionCount(signerAddress, "pending");
            logSendPath("preWrite.walletState", { walletChainId: Number(network.chainId), pendingNonce });
          } catch {
            // ignore
          }
          logSendPath("actions.supply.signer", { signerAddress, label });
          const write = getWriteLending(lending!, signer);
          logSendPath("actions.supply.write", { label, amount: amount.toString() });
          const txOpts = {
            ...(chainId !== undefined ? { persist: { chainId, account: account! }, provider } : { provider }),
            meta: { chainId, contractAddress: simpleLendingAddress!, method: "supply", args: [amount.toString()] },
          };
          let r = await runTxDetailed(label, () => write.supply(amount), setTx, txOpts);
          if (!r.receipt && r.error) {
            if (isCallException(r.error)) {
              logSendPath("actions.supply.forceSend", { reason: "callException" });
              r = await runTxDetailed(
                label,
                () => lending!.connect(signer).getFunction("supply")(amount, { gasLimit: 300000n }),
                setTx,
                txOpts,
              );
            } else {
              logSendPath("actions.supply.skipForceSend", {
                code: (r.error as { code?: unknown })?.code,
                message: (r.error as { message?: string })?.message?.slice(0, 80),
              });
            }
          }
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "supply" });
          }
        });
      } catch (e) {
        logRpcError("actions.supply", e);
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
      splitMatch,
      verifyPostState,
      withLock,
    ],
  );

  const withdraw = useCallback(
    async (amountStr: string) => {
      const label = labelWithdraw;
      try {
        if (!ready) throw new Error(errorWalletNotConnected);
        await withLock("withdraw", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          lastSubmittedAmountRef.current = amountStr;
          const before = await readPosition();

          // UX-only: avoid sending a tx that will obviously fail due to insufficient pool liquidity.
          const poolAddress = simpleLendingAddress!;
          const poolLiquidity = (await usd8!.balanceOf(poolAddress)) as bigint;
          if (poolLiquidity < amount) {
            throw new Error(errorInsufficientLiquidity);
          }

          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.withdraw(amount),
            setTx,
            {
              ...(chainId !== undefined ? { persist: { chainId, account: account! }, provider } : { provider }),
              meta: { chainId, contractAddress: simpleLendingAddress!, method: "withdraw", args: [amount.toString()] },
            },
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "withdraw" });
          }
        });
      } catch (e) {
        logRpcError("actions.withdraw", e);
        fail(label, e);
      }
    },
    [account, chainId, decimals, fail, lending, onConfirmed, provider, readPosition, ready, simpleLendingAddress, usd8, verifyPostState, withLock],
  );

  const borrow = useCallback(
    async (amountStr: string) => {
      const label = labelBorrow;
      try {
        if (!ready) throw new Error(errorWalletNotConnected);
        await withLock("borrow", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          lastSubmittedAmountRef.current = amountStr;
          const before = await readPosition();
          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.borrow(amount),
            setTx,
            {
              ...(chainId !== undefined ? { persist: { chainId, account: account! }, provider } : { provider }),
              meta: { chainId, contractAddress: simpleLendingAddress!, method: "borrow", args: [amount.toString()] },
            },
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "borrow" });
          }
        });
      } catch (e) {
        logRpcError("actions.borrow", e);
        fail(label, e);
      }
    },
    [account, chainId, decimals, fail, lending, onConfirmed, provider, readPosition, ready, verifyPostState, withLock],
  );

  const repay = useCallback(
    async (amountStr: string) => {
      const label = labelRepay;
      try {
        if (!ready) throw new Error(errorWalletNotConnected);
        await withLock("repay", async () => {
          const amount = requireAmountStrict(amountStr, decimals);
          lastSubmittedAmountRef.current = amountStr;
          const before = await readPosition();
          const approved = await approveIfNeeded(amount);
          if (!approved) return;
          const signer = await provider!.getSigner();
          const write = getWriteLending(lending!, signer);
          const r = await runTxDetailed(
            label,
            () => write.repay(amount),
            setTx,
            {
              ...(chainId !== undefined ? { persist: { chainId, account: account! }, provider } : { provider }),
              meta: { chainId, contractAddress: simpleLendingAddress!, method: "repay", args: [amount.toString()] },
            },
          );
          if (r.receipt && r.hash) {
            if (onConfirmed) onConfirmed();
            void verifyPostState({ label, hash: r.hash, before, amount, kind: "repay" });
          }
        });
      } catch (e) {
        logRpcError("actions.repay", e);
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

