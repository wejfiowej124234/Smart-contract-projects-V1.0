import type { Provider, TransactionReceipt, TransactionResponse } from "ethers";
import { normalizeError, type AppError } from "./errors";
import {
  TX_CONFIRMATIONS,
  TX_PENDING_TIMEOUT_MS,
  TX_DROPPED_POLL_ATTEMPTS,
  TX_DROPPED_POLL_DELAY_MS,
} from "../config/runtime";
import { clearTx, savePendingTx } from "./txStore";
import { append as appendSessionEvidence } from "./sessionEvidence";
import { appendRevertDiagnostic } from "./revertDiagnostics";
import { logRpcError, logSendPath } from "../utils/rpcErrorLog";
import { recordTxCreated, recordSendError } from "./sendPathEvidence";
import { errorDashboardContractReadFailed, errorTxRevertedOnChain, errorWriteRevertedBeforeSend } from "../config/ui";

export type TxStage = "idle" | "signing" | "pending" | "stuck" | "confirmed" | "failed";

export type TxState = {
  stage: TxStage;
  label?: string;
  hash?: string;
  /** Optional amount string for Activity history (e.g. "1,000 USD8"). */
  amount?: string;
  error?: AppError;
  startedAtMs?: number;
  submittedAtMs?: number;
  confirmedAtMs?: number;
  /** When confirmed: block number (audit traceability). */
  blockNumber?: number;
  /** When confirmed: gas used (audit traceability). */
  gasUsed?: string;
  /** When confirmed: seconds from submit to confirm (client clock); UI shows "Confirmed in Xs". */
  confirmedInSeconds?: number;
  /** When pending/confirmed: number of confirmations (if polled). */
  confirmations?: number;
  /** Block timestamp (seconds) when tx was mined; for minedAt display. */
  minedAt?: number;
  /** Terminal outcome for timeline/Activity badge. */
  outcome?: "confirmed" | "failed" | "replaced" | "dropped";
  /** When outcome is "replaced", hash of the tx that replaced this one (for Activity "replaced by <hash>"). */
  replacementHash?: string;
  /** When outcome is "dropped", reason for audit/session evidence. */
  droppedReason?: "timeout" | "notFound" | "rpcDegraded";
  postState?: {
    status: "verifying" | "verified" | "unverified";
    note?: string;
  };
};

export const TX_IDLE: TxState = { stage: "idle" };

/** Runs a tx from signing through confirmation (or failure) and persists pending state so a refresh doesn’t lose it. */
export async function runTxDetailed(
  label: string,
  send: () => Promise<TransactionResponse>,
  setTx: (next: TxState) => void,
  opts?: {
    confirmations?: number;
    persist?: { chainId: number; account: string };
    provider?: Provider;
    /** For revert diagnostics bundle (chainId + contract + method + args). */
    meta?: { chainId?: number; contractAddress?: string; method?: string; args?: unknown[] };
  },
): Promise<{ receipt?: TransactionReceipt; error?: unknown; hash?: string }> {
  const startedAtMs = Date.now();
  setTx({ stage: "signing", label, startedAtMs });
  try {
    logSendPath("runTxDetailed.send", { label });
    const tx = await send();
    logSendPath("runTxDetailed.txCreated", { hash: tx.hash });
    recordTxCreated(tx.hash);
    const submittedAtMs = Date.now();
    setTx({ stage: "pending", label, hash: tx.hash, startedAtMs, submittedAtMs });
    if (opts?.persist) {
      savePendingTx(opts.persist.chainId, opts.persist.account, label, tx.hash);
    }

    const confirmations = opts?.confirmations ?? TX_CONFIRMATIONS;

    const waitWithTimeout = async (resp: TransactionResponse): Promise<TransactionReceipt | undefined> => {
      let timer: number | undefined;
      try {
        const timeout = TX_PENDING_TIMEOUT_MS;
        const timed = new Promise<never>((_, reject) => {
          timer = window.setTimeout(() => reject(new Error("TX_TIMEOUT")), timeout);
        });
        const receipt = (await Promise.race([resp.wait(confirmations), timed])) as TransactionReceipt | null;
        return receipt ?? undefined;
      } finally {
        if (timer !== undefined) window.clearTimeout(timer);
      }
    };

    let receipt: TransactionReceipt | undefined;
    let finalHash = tx.hash;
    try {
      receipt = await waitWithTimeout(tx);
    } catch (e: unknown) {
      // ethers v6: TRANSACTION_REPLACED has code, replacement (TransactionResponse), cancelled (boolean).
      const code = (e as { code?: unknown })?.code;
      const replacement = (e as { replacement?: TransactionResponse })?.replacement;
      const cancelled = (e as { cancelled?: boolean })?.cancelled === true;
      const reason = (e as { reason?: unknown })?.reason;
      const replacementHash = replacement && typeof replacement.hash === "string" ? replacement.hash : undefined;

      if (code === "TRANSACTION_REPLACED" && cancelled) {
        setTx({
          stage: "failed",
          label,
          hash: tx.hash,
          outcome: "replaced",
          replacementHash,
          error: normalizeError(new Error(`Transaction was cancelled (${String(reason ?? "replaced")})`)),
          startedAtMs,
          submittedAtMs,
          confirmedAtMs: Date.now(),
        });
        if (opts?.persist) {
          clearTx(opts.persist.chainId, opts.persist.account);
        }
        return { error: e };
      }
      if (code === "TRANSACTION_REPLACED" && replacement && replacementHash) {
        finalHash = replacement.hash;
        const replacedSubmittedAtMs = Date.now();
        setTx({ stage: "pending", label, hash: replacement.hash, startedAtMs, submittedAtMs: replacedSubmittedAtMs });
        if (opts?.persist) {
          savePendingTx(opts.persist.chainId, opts.persist.account, label, replacement.hash);
        }
        try {
          receipt = await waitWithTimeout(replacement);
        } catch (e2) {
          if ((e2 as Error)?.message === "TX_TIMEOUT") {
            setTx({ stage: "stuck", label, hash: replacement.hash, startedAtMs, submittedAtMs: replacedSubmittedAtMs });
            return { hash: replacement.hash, error: e2 };
          }
          setTx({
            stage: "failed",
            label,
            outcome: "failed",
            error: normalizeError(e2),
            startedAtMs,
            submittedAtMs: replacedSubmittedAtMs,
            confirmedAtMs: Date.now(),
          });
          if (opts?.persist) {
            clearTx(opts.persist.chainId, opts.persist.account);
          }
          return { error: e2 };
        }
      } else if ((e as Error)?.message === "TX_TIMEOUT") {
        let droppedReason: "timeout" | "notFound" | "rpcDegraded" = "timeout";
        if (opts?.provider && tx.hash) {
          for (let attempt = 0; attempt < TX_DROPPED_POLL_ATTEMPTS; attempt++) {
            await new Promise((r) => setTimeout(r, TX_DROPPED_POLL_DELAY_MS));
            try {
              const existing = await opts.provider.getTransaction(tx.hash);
              if (existing == null) {
                droppedReason = "notFound";
                break;
              }
            } catch {
              droppedReason = "rpcDegraded";
              break;
            }
          }
        }
        appendSessionEvidence("TxFail", {
          action: label,
          kind: "dropped",
          droppedReason,
          txHash: tx.hash,
        });
        const message =
          droppedReason === "notFound"
            ? "Transaction dropped (not found). Suggest: bump gas & resend."
            : droppedReason === "rpcDegraded"
              ? "Transaction status unclear (RPC issue). Check explorer or resend."
              : "Transaction dropped (timeout). Suggest: bump gas & resend.";
        setTx({
          stage: "stuck",
          label,
          hash: tx.hash,
          outcome: "dropped",
          droppedReason,
          error: normalizeError(new Error(message)),
          startedAtMs,
          submittedAtMs,
        });
        return { hash: tx.hash, error: e };
      } else {
        throw e;
      }
    }

    const gasUsedStr = receipt?.gasUsed != null ? String(receipt.gasUsed) : undefined;
    const confirmedAtMs = Date.now();
    const confirmedInSeconds =
      submittedAtMs != null ? Math.max(0, Math.floor((confirmedAtMs - submittedAtMs) / 1000)) : undefined;
    setTx({
      stage: "confirmed",
      label,
      hash: finalHash,
      startedAtMs,
      submittedAtMs,
      confirmedAtMs,
      blockNumber: receipt?.blockNumber,
      gasUsed: gasUsedStr,
      confirmedInSeconds,
      confirmations: confirmations,
      outcome: "confirmed",
    });
    if (opts?.persist) {
      clearTx(opts.persist.chainId, opts.persist.account);
    }
    return { receipt, hash: finalHash };
  } catch (e) {
    const err = e as {
      code?: unknown;
      message?: string;
      shortMessage?: string;
      reason?: string;
      data?: string;
      transaction?: { hash?: string };
      receipt?: { transactionHash?: string; status?: number };
    };
    const sendErrorPayload = {
      code: err?.code,
      message: err?.message ?? (typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : String(e)),
      name: (e as { name?: string })?.name,
    };
    logSendPath("runTxDetailed.sendError", sendErrorPayload);
    recordSendError(sendErrorPayload);
    logRpcError(`runTxDetailed.send.${label}`, e);

    const txHash = err?.transaction?.hash ?? err?.receipt?.transactionHash ?? undefined;
    const entry = {
      ts: Date.now(),
      label,
      txHash,
      shortMessage: typeof err?.shortMessage === "string" ? err.shortMessage : undefined,
      reason: typeof err?.reason === "string" ? err.reason : undefined,
      data: typeof err?.data === "string" ? err.data : undefined,
      chainId: opts?.meta?.chainId ?? opts?.persist?.chainId,
      contractAddress: opts?.meta?.contractAddress,
      method: opts?.meta?.method,
      args: opts?.meta?.args,
    };
    appendRevertDiagnostic(entry);
    appendSessionEvidence("TxRevert", {
      ...entry,
      args: entry.args?.map((a) => (typeof a === "bigint" ? a.toString() : a)),
    });

    const normalized = normalizeError(e);
    const code = (e as { code?: string }).code;
    const receipt = (e as { receipt?: { status?: number } }).receipt;
    const isRevertedCall = normalized.message === errorDashboardContractReadFailed && (receipt?.status === 0 || code === "CALL_EXCEPTION");
    const isWriteRevertedBeforeSend = code === "CALL_EXCEPTION" && /supply|approve|withdraw|borrow|repay/i.test(label);
    const message = isWriteRevertedBeforeSend
      ? errorWriteRevertedBeforeSend
      : isRevertedCall
        ? errorTxRevertedOnChain
        : normalized.message;
    const error = { ...normalized, message };
    setTx({
      stage: "failed",
      label,
      outcome: "failed",
      error,
      startedAtMs,
      confirmedAtMs: Date.now(),
    });
    if (opts?.persist) {
      clearTx(opts.persist.chainId, opts.persist.account);
    }
    return { error: e };
  }
}

export async function runTx(
  label: string,
  send: () => Promise<TransactionResponse>,
  setTx: (next: TxState) => void,
  opts?: {
    confirmations?: number;
    persist?: { chainId: number; account: string };
    provider?: Provider;
    meta?: { chainId?: number; contractAddress?: string; method?: string; args?: unknown[] };
  },
): Promise<TransactionReceipt | undefined> {
  const r = await runTxDetailed(label, send, setTx, opts);
  return r.receipt;
}
