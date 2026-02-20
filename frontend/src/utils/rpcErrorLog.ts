/**
 * Structured RPC error logging for diagnosis (Internal JSON-RPC error, etc.).
 * Only logs when VITE_DEBUG_RPC=true or in development.
 * Use tag to identify call site: preflight.estimateGas, actions.supply, dashboard.refresh, runTxDetailed.send.
 */
const DEBUG_RPC =
  typeof import.meta.env !== "undefined" &&
  (import.meta.env.DEV || String(import.meta.env.VITE_DEBUG_RPC || "").toLowerCase() === "true");

function toRecord(err: unknown): Record<string, unknown> {
  if (err == null) return {};
  if (typeof err === "object") {
    const e = err as Record<string, unknown> & { error?: { code?: unknown; message?: unknown; data?: unknown } };
    return {
      code: e.code ?? e.error?.code,
      message: e.message ?? e.shortMessage ?? e.reason ?? e.error?.message,
      data: e.data ?? e.error?.data,
      stack: e.stack,
      raw: err,
    };
  }
  return { message: String(err) };
}

export function logRpcError(tag: string, err: unknown): void {
  if (!DEBUG_RPC) return;
  const record = toRecord(err);
  console.warn(`[RPC] ${tag}`, record);
}

import { recordTag as recordSendPathTag } from "../state/sendPathEvidence";

/**
 * Instrumentation to prove the send path is reached (signer + contract write).
 * Logs only when DEV or VITE_DEBUG_RPC. Records to sendPathEvidence for export.
 * If you see runTxDetailed.send but no popup, check browser popup blocking and MetaMask pending request.
 */
export function logSendPath(tag: string, data: Record<string, unknown>): void {
  if (!DEBUG_RPC) return;
  console.info(`[SendPath] ${tag}`, data);
  recordSendPathTag(tag, data);
}
