import { useEffect, useMemo, useState } from "react";
import type { TxState } from "../state/tx";
/**
 * Turns raw tx state into copy and timing for the TxStatus UI so the user always sees the right label, hint, and elapsed time.
 */
import {
  errorTitles,
  txFailedFallback,
  stageTextSigning,
  stageTextPending,
  stageTextStuck,
  stageTextConfirmed,
  stageTextFailed,
  hintTextSigning,
  hintTextPending,
  hintTextStuck,
  hintTextConfirmed,
  hintTextFailed,
  hintTextUserRejected,
  stepPrefix1of2,
  stepPrefix2of2,
  stepPrefix1of3,
  stepPrefix2of3,
  stepPrefix3of3,
  stepLabelResetAllowance,
  stepLabelApproveToken,
  supply,
  repay,
  approveLabelUsd8,
  approveLabelUsd8Reset,
} from "../config/ui";
import { TX_ELAPSED_INTERVAL_MS } from "../config/runtime";
import { formatLocalTime } from "../utils/format";

const STAGE_TEXT: Record<string, string> = {
  signing: stageTextSigning,
  pending: stageTextPending,
  stuck: stageTextStuck,
  confirmed: stageTextConfirmed,
  failed: stageTextFailed,
};

const STAGE_CLASS: Record<string, string> = {
  signing: "txStage--signing",
  pending: "txStage--pending",
  confirmed: "stageOk",
  failed: "stageErr",
  stuck: "stageWarn",
};

const HINT_TEXT: Record<string, string> = {
  signing: hintTextSigning,
  pending: hintTextPending,
  stuck: hintTextStuck,
  confirmed: hintTextConfirmed,
  failed: hintTextFailed,
};

export function useTxDisplay(params: {
  tx: TxState;
  setTx: (next: TxState) => void;
  refreshPendingTx: () => void;
  clearPendingTx: () => void;
}) {
  const { tx, refreshPendingTx, clearPendingTx } = params;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [txTick, setTxTick] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (tx.stage !== "signing" && tx.stage !== "pending" && tx.stage !== "stuck") return;
    const t = window.setInterval(() => {
      setTxTick((v) => v + 1);
      setNowMs(Date.now());
    }, TX_ELAPSED_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [tx.stage]);

  useEffect(() => {
    if (tx.stage === "confirmed" || tx.stage === "failed") queueMicrotask(() => setNowMs(Date.now()));
  }, [tx.stage]);

  const stageText = STAGE_TEXT[tx.stage] ?? tx.stage;
  const stageClass = STAGE_CLASS[tx.stage] ?? "";

  const stepText = useMemo(() => {
    const label = tx.label;
    if (!label) return undefined;
    const needsApprove = label === supply || label === repay || label === approveLabelUsd8 || label === approveLabelUsd8Reset;
    if (!needsApprove) return undefined;
    const sawReset = label === approveLabelUsd8Reset || (typeof tx.label === "string" && tx.label.includes("reset"));
    if (label === approveLabelUsd8Reset) return stepPrefix1of3 + stepLabelResetAllowance;
    if (label === approveLabelUsd8) return sawReset ? stepPrefix2of3 + stepLabelApproveToken : stepPrefix1of2 + stepLabelApproveToken;
    if (label === supply || label === repay) return sawReset ? stepPrefix3of3 + label : stepPrefix2of2 + label;
    return undefined;
  }, [tx.label]);

  const hintText = useMemo(() => {
    if (tx.stage === "failed" && tx.error?.kind === "UserRejected") return hintTextUserRejected;
    return HINT_TEXT[tx.stage];
  }, [tx.stage, tx.error?.kind]);

  const errorTitle = useMemo(() => {
    const e = tx.error;
    if (!e) return undefined;
    const kind = e.kind ?? "Unknown";
    return errorTitles[kind as keyof typeof errorTitles] ?? txFailedFallback;
  }, [tx.error]);

  const elapsed = useMemo(() => {
    void txTick;
    if (tx.stage === "signing" && tx.startedAtMs) {
      const s = Math.max(0, Math.floor((nowMs - tx.startedAtMs) / TX_ELAPSED_INTERVAL_MS));
      return s ? `${s}s` : "";
    }
    if ((tx.stage === "pending" || tx.stage === "stuck") && tx.submittedAtMs) {
      const s = Math.max(0, Math.floor((nowMs - tx.submittedAtMs) / TX_ELAPSED_INTERVAL_MS));
      return s ? `${s}s` : "";
    }
    if ((tx.stage === "confirmed" || tx.stage === "failed") && tx.confirmedAtMs) {
      const s = Math.max(0, Math.floor((nowMs - tx.confirmedAtMs) / TX_ELAPSED_INTERVAL_MS));
      return s ? `${s}s ago` : "";
    }
    return "";
  }, [tx.confirmedAtMs, tx.stage, tx.startedAtMs, tx.submittedAtMs, txTick, nowMs]);

  const timingText = useMemo(() => {
    void txTick;
    const parts: string[] = [];
    if (tx.startedAtMs) parts.push(`started ${formatLocalTime(tx.startedAtMs)}`);
    if (tx.submittedAtMs) parts.push(`sent ${formatLocalTime(tx.submittedAtMs)}`);
    if (tx.confirmedAtMs && (tx.stage === "confirmed" || tx.stage === "failed")) {
      parts.push(`final ${formatLocalTime(tx.confirmedAtMs)}`);
    }
    return parts.length ? parts.join(" · ") : "";
  }, [tx.confirmedAtMs, tx.stage, tx.startedAtMs, tx.submittedAtMs, txTick]);

  const onCopyHash = async () => {
    if (!tx.hash) return;
    try {
      await navigator.clipboard.writeText(tx.hash);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (tx.stage === "idle") queueMicrotask(() => setDetailsOpen(false));
  }, [tx.stage]);

  return {
    stageText,
    stageClass,
    stepText,
    hintText,
    errorTitle,
    elapsed,
    timingText,
    onCopyHash,
    detailsOpen,
    onToggleDetails: () => setDetailsOpen((v) => !v),
    onRefreshPending: refreshPendingTx,
    onClearPending: clearPendingTx,
  };
}
