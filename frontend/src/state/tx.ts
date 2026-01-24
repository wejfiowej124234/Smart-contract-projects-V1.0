import type { TransactionReceipt, TransactionResponse } from "ethers";
import { normalizeError, type AppError } from "./errors";
import { TX_CONFIRMATIONS, TX_PENDING_TIMEOUT_MS } from "../config/runtime";
import { clearTx, savePendingTx } from "./txStore";

export type TxStage = "idle" | "signing" | "pending" | "stuck" | "confirmed" | "failed";

export type TxState = {
  stage: TxStage;
  label?: string;
  hash?: string;
  error?: AppError;
  postState?: {
    status: "verifying" | "verified" | "unverified";
    note?: string;
  };
};

export const TX_IDLE: TxState = { stage: "idle" };

export async function runTxDetailed(
  label: string,
  send: () => Promise<TransactionResponse>,
  setTx: (next: TxState) => void,
  opts?: {
    confirmations?: number;
    persist?: { chainId: number; account: string };
  },
): Promise<{ receipt?: TransactionReceipt; error?: unknown; hash?: string }> {
  setTx({ stage: "signing", label });
  try {
    const tx = await send();
    setTx({ stage: "pending", label, hash: tx.hash });
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
      // Best-effort replacement detection (ethers surfaces TRANSACTION_REPLACED on replaceable transactions).
      const code = (e as { code?: unknown })?.code;
      const replacement = (e as { replacement?: TransactionResponse })?.replacement;
      const reason = (e as { reason?: unknown })?.reason;

      if (code === "TRANSACTION_REPLACED" && replacement && typeof replacement.hash === "string") {
        finalHash = replacement.hash;
        setTx({ stage: "pending", label, hash: replacement.hash });
        if (opts?.persist) {
          savePendingTx(opts.persist.chainId, opts.persist.account, label, replacement.hash);
        }
        try {
          receipt = await waitWithTimeout(replacement);
        } catch (e2) {
          // If replacement tracking times out, treat as stuck.
          if ((e2 as Error)?.message === "TX_TIMEOUT") {
            setTx({ stage: "stuck", label, hash: replacement.hash });
            return { hash: replacement.hash, error: e2 };
          }
          setTx({ stage: "failed", label, error: normalizeError(e2) });
          if (opts?.persist) {
            clearTx(opts.persist.chainId, opts.persist.account);
          }
          return { error: e2 };
        }
      } else if ((e as Error)?.message === "TX_TIMEOUT") {
        // Timeout: do not mark failed (avoid false negatives); keep persisted pending.
        setTx({ stage: "stuck", label, hash: tx.hash });
        return { hash: tx.hash, error: e };
      } else {
        // If it's a replacement-cancel, that's a definitive outcome.
        const cancelled = (e as { cancelled?: unknown })?.cancelled;
        if (code === "TRANSACTION_REPLACED" && cancelled) {
          setTx({ stage: "failed", label, error: normalizeError(new Error(`Transaction was cancelled (${String(reason ?? "replaced")})`)) });
          if (opts?.persist) {
            clearTx(opts.persist.chainId, opts.persist.account);
          }
          return { error: e };
        }
        throw e;
      }
    }

    setTx({ stage: "confirmed", label, hash: finalHash });
    if (opts?.persist) {
      clearTx(opts.persist.chainId, opts.persist.account);
    }
    return { receipt, hash: finalHash };
  } catch (e) {
    setTx({ stage: "failed", label, error: normalizeError(e) });
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
  },
): Promise<TransactionReceipt | undefined> {
  const r = await runTxDetailed(label, send, setTx, opts);
  return r.receipt;
}
