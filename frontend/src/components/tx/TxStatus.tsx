import { useState } from "react";
import { Link } from "react-router-dom";
import { COPY_FEEDBACK_MS } from "../../config/runtime";
import type { AppError } from "../../state/errors";
import { TX_IDLE } from "../../state/tx";
import {
  copyHash,
  copied as copiedLabel,
  hideDetails,
  details,
  showRawLabel,
  dismiss,
  emptyPlaceholder,
  stillPendingOnNetwork,
  txStuckHint,
  refreshStatus,
  clearPending,
  postStateLabel,
  stageLabel,
  labelLabel,
  hashLabel,
  rawLabel,
  postStateNoteLabel,
  elapsedLabel,
  errorKindLabel,
  errorCodeLabel,
  txLabelPrefix,
  txHashDisplayChars,
  txConfirmedPositionHint,
  txFailureReasonLabel,
  copyErrorDetailsLabel,
  copyErrorDetailsCopied,
  copyDebugBundleLabel,
  copyDebugBundleCopied,
  txSuggestionLabel,
  txSubmittedAtLabel,
  txMinedAtLabel,
  txReplacedByLineTemplate,
  txDroppedLineDefault,
  txDroppedLineNotFound,
  txDroppedLineRpcDegraded,
} from "../../config/ui";
import { shortAddress } from "../../utils/format";
import type { TxStatusProps } from "../../types/dashboard";

export function TxStatus({
  tx,
  setTx,
  stageText,
  stageClass,
  stepText,
  hintText,
  signingPendingHint,
  errorTitle,
  elapsed,
  onCopyHash,
  detailsOpen,
  onToggleDetails,
  onRefreshPending,
  onClearPending,
  timingText,
  disableRefreshClear,
  lifecycleSteps,
  confirmedInText,
  confirmedInHintText,
  blockConfirmationsText,
  suggestion,
  debugContext,
}: TxStatusProps) {
  const [copied, setCopied] = useState(false);
  const [errorDetailsCopied, setErrorDetailsCopied] = useState(false);
  const [debugBundleCopied, setDebugBundleCopied] = useState(false);
  const [replacementCopied, setReplacementCopied] = useState(false);
  const onCopy = async () => {
    onCopyHash();
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };
  const copyButtonLabel = tx.hash ? (copied ? copiedLabel : copyHash) : "";

  const getErrorDetailsString = (err: AppError): string => {
    const parts = [err.kind ? `[${err.kind}] ` : "", err.message];
    if (err.meta?.rawMessage && typeof err.meta.rawMessage === "string") {
      parts.push("\nRaw: " + err.meta.rawMessage);
    }
    return parts.join("");
  };
  const onCopyErrorDetails = async () => {
    if (!tx.error) return;
    try {
      await navigator.clipboard.writeText(getErrorDetailsString(tx.error));
      setErrorDetailsCopied(true);
      window.setTimeout(() => setErrorDetailsCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* noop */
    }
  };

  const getDebugBundle = (): string => {
    const payload: Record<string, unknown> = {
      chainId: debugContext?.chainId,
      rpcTier: debugContext?.rpcTier,
      blockNumber: tx.blockNumber,
      action: tx.label,
      amount: tx.amount,
      gasEstimate: debugContext?.gasEstimate ?? "n/a",
      feeData: debugContext?.feeData ?? "n/a",
      errorKind: tx.error?.kind,
      errorMessage: tx.error?.message,
      errorRaw: tx.error?.meta?.rawMessage,
      version: debugContext?.version,
      configFingerprint: debugContext?.configFingerprint,
      sessionId: debugContext?.sessionId,
      txHash: tx.hash,
      stage: tx.stage,
      outcome: tx.outcome,
      replacementHash: tx.replacementHash,
    };
    return JSON.stringify(payload, null, 2);
  };
  const onCopyDebugBundle = async () => {
    try {
      await navigator.clipboard.writeText(getDebugBundle());
      setDebugBundleCopied(true);
      window.setTimeout(() => setDebugBundleCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* noop */
    }
  };
  const onCopyReplacement = async () => {
    if (!tx.replacementHash) return;
    try {
      await navigator.clipboard.writeText(tx.replacementHash);
      setReplacementCopied(true);
      window.setTimeout(() => setReplacementCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* noop */
    }
  };
  const droppedLineText =
    tx.droppedReason === "notFound"
      ? txDroppedLineNotFound
      : tx.droppedReason === "rpcDegraded"
        ? txDroppedLineRpcDegraded
        : txDroppedLineDefault;

  return (
    <div className="txBox" role="status" aria-live="polite">
      <div className="txRow">
        <div>
          {txLabelPrefix}<b>{tx.label}</b>
        </div>
        <div className={`txStage ${stageClass}`}>{stageText}</div>
        {elapsed ? <div className="muted">{elapsedLabel}{elapsed}</div> : null}
        {timingText ? <div className="muted">{timingText}</div> : null}
        {tx.hash ? (
          <div className="txHashShort">({tx.hash.slice(0, txHashDisplayChars)}…)</div>
        ) : null}
        {tx.hash ? (
          <button type="button" className="btn btnSecondary btnSmall" onClick={() => void onCopy()} aria-label={copyButtonLabel || copyHash}>
            {copyButtonLabel}
          </button>
        ) : null}
        {(tx.stage === "confirmed" || tx.stage === "failed") && (
          <button
            className="btn btnSecondary btnSmall"
            onClick={() => {
              setTx(TX_IDLE);
            }}
          >
            {dismiss}
          </button>
        )}
        <button
          className="btn btnSecondary btnSmall"
          onClick={onToggleDetails}
          aria-expanded={detailsOpen}
        >
          {detailsOpen ? hideDetails : (tx.stage === "pending" || tx.stage === "stuck" ? showRawLabel : details)}
        </button>
      </div>
      {stepText ? <div className="txStep">{stepText}</div> : null}
      {hintText ? (
        <div className="muted txHintRow">
          {hintText}
        </div>
      ) : null}
      {signingPendingHint ? (
        <div className="muted txHintRow txSigningPendingHint" role="status">
          {signingPendingHint.text}{" "}
          <Link to="/diagnostics" className="navLink">{signingPendingHint.troubleshootingLabel}</Link>
        </div>
      ) : null}
      {tx.stage === "confirmed" && (
        <div className="txConfirmedHint" role="status">
          {txConfirmedPositionHint}
        </div>
      )}
      {confirmedInText && (tx.stage === "confirmed" || tx.stage === "failed") && (
        <div className="txConfirmedInRow muted" role="status">
          {confirmedInText}
          {confirmedInHintText && <span className="txConfirmedInHint"> ({confirmedInHintText})</span>}
        </div>
      )}
      {blockConfirmationsText && tx.stage === "confirmed" && (
        <div className="txBlockConfirmationsRow muted">{blockConfirmationsText}</div>
      )}
      {lifecycleSteps && lifecycleSteps.length > 0 && (
        <div className="txLifecycleTimeline" role="status" aria-label="Transaction lifecycle">
          {lifecycleSteps.map((s, i) => (
            <div key={i} className={`txLifecycleStep txLifecycleStep--${s.state}`}>
              <span className="txLifecycleStepLabel">{s.label}</span>
              {s.sublabel && <span className="txLifecycleStepSublabel muted">{s.sublabel}</span>}
            </div>
          ))}
        </div>
      )}
      {tx.error ? (
        <div className="errorText txFailureBlock" role="alert" aria-live="assertive">
          {tx.error.kind != null && (
            <div className="txFailureReason">
              <span className="txFailureReasonLabel">{txFailureReasonLabel}:</span>
              <span className="pill pillErr txFailureReasonPill">{tx.error.kind}</span>
            </div>
          )}
          {errorTitle ? <div><b>{errorTitle}</b></div> : null}
          <div>{tx.error.message}</div>
          {suggestion && (
            <div className="txSuggestionBlock" role="status">
              <span className="txSuggestionLabel">{txSuggestionLabel}:</span> {suggestion}
            </div>
          )}
          <button type="button" className="btn btnSecondary btnSmall txCopyErrorBtn" onClick={() => void onCopyErrorDetails()} aria-label={errorDetailsCopied ? copyErrorDetailsCopied : copyErrorDetailsLabel}>
            {errorDetailsCopied ? copyErrorDetailsCopied : copyErrorDetailsLabel}
          </button>
          <button type="button" className="btn btnSecondary btnSmall txCopyDebugBtn" onClick={() => void onCopyDebugBundle()} aria-label={debugBundleCopied ? copyDebugBundleCopied : copyDebugBundleLabel}>
            {debugBundleCopied ? copyDebugBundleCopied : copyDebugBundleLabel}
          </button>
        </div>
      ) : null}

      {tx.outcome === "replaced" && tx.replacementHash && (
        <div className="txOutcomeLine txOutcomeLine--replaced muted">
          {txReplacedByLineTemplate.replace("{hash}", shortAddress(tx.replacementHash))}
          <button type="button" className="btn btnSecondary btnSmall txCopyReplacementBtn" onClick={() => void onCopyReplacement()} aria-label={replacementCopied ? copiedLabel : copyHash}>
            {replacementCopied ? copiedLabel : copyHash}
          </button>
        </div>
      )}
      {tx.outcome === "dropped" && (
        <div className="txOutcomeLine txOutcomeLine--dropped muted" role="status">
          {droppedLineText}
        </div>
      )}

      {(tx.stage === "pending" || tx.stage === "stuck") && (
        <div className="banner bannerWarn txStuckBanner">
          {tx.stage === "stuck" && (
            <>
              <div className="bannerTitle">{stillPendingOnNetwork}</div>
              <div className="txStuckHint">{txStuckHint}</div>
            </>
          )}
          <div className="txStuckActions">
            <button
              className="btn btnSecondary"
              onClick={() => void onRefreshPending()}
              disabled={disableRefreshClear}
            >
              {refreshStatus}
            </button>
            <button
              className="btn btnWarn"
              onClick={() => onClearPending()}
              disabled={disableRefreshClear}
            >
              {clearPending}
            </button>
          </div>
        </div>
      )}

      {tx.postState && (
        <div className="muted">
          {postStateLabel}: {tx.postState.status}
          {tx.postState?.status === "unverified" && tx.postState.note
            ? ` (${tx.postState.note})`
            : ""}
        </div>
      )}

      {detailsOpen && (
        <div className="details">
          <div className="detailRow">
            <button type="button" className="btn btnSecondary btnSmall" onClick={() => void onCopyDebugBundle()} aria-label={debugBundleCopied ? copyDebugBundleCopied : copyDebugBundleLabel}>
              {debugBundleCopied ? copyDebugBundleCopied : copyDebugBundleLabel}
            </button>
          </div>
          {tx.outcome && (
            <div className="detailRow">
              <span className="muted">Outcome</span>
              <span>{tx.outcome}</span>
            </div>
          )}
          <div className="detailRow">
            <span className="muted">{stageLabel}</span>
            <span>{tx.stage}</span>
            <span className="muted">{labelLabel}</span>
            <span>{tx.label ?? emptyPlaceholder}</span>
          </div>
          <div className="detailRow">
            <span className="muted">{hashLabel}</span>
            <span className="mono">{tx.hash ?? emptyPlaceholder}</span>
          </div>
          {tx.submittedAtMs != null && (
            <div className="detailRow">
              <span className="muted">{txSubmittedAtLabel}</span>
              <span>{new Date(tx.submittedAtMs).toLocaleString()}</span>
            </div>
          )}
          {tx.minedAt != null && (
            <div className="detailRow">
              <span className="muted">{txMinedAtLabel}</span>
              <span>{new Date(tx.minedAt * 1000).toLocaleString()}</span>
            </div>
          )}
          {tx.error && (
            <>
              <div className="detailRow">
                <span className="muted">{errorKindLabel}</span>
                <span>{tx.error.kind ?? emptyPlaceholder}</span>
                <span className="muted">{errorCodeLabel}</span>
                <span className="mono">
                  {tx.error.code !== undefined ? String(tx.error.code) : emptyPlaceholder}
                </span>
              </div>
              {typeof tx.error.meta?.rawMessage === "string" && (
                <div className="detailRow">
                  <span className="muted">{rawLabel}</span>
                  <span className="mono">{tx.error.meta.rawMessage}</span>
                </div>
              )}
            </>
          )}
          {tx.postState?.note && (
            <div className="detailRow">
              <span className="muted">{postStateNoteLabel}</span>
              <span>{tx.postState.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
