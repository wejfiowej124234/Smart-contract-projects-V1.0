import { useState } from "react";
import { COPY_FEEDBACK_MS } from "../../config/runtime";
import { TX_IDLE } from "../../state/tx";
import {
  copyHash,
  copied as copiedLabel,
  hideDetails,
  details,
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
} from "../../config/ui";
import type { TxStatusProps } from "../../types/dashboard";

export function TxStatus({
  tx,
  setTx,
  stageText,
  stageClass,
  stepText,
  hintText,
  errorTitle,
  elapsed,
  onCopyHash,
  detailsOpen,
  onToggleDetails,
  onRefreshPending,
  onClearPending,
  timingText,
  disableRefreshClear,
}: TxStatusProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    onCopyHash();
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };
  const copyButtonLabel = tx.hash ? (copied ? copiedLabel : copyHash) : "";

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
          {detailsOpen ? hideDetails : details}
        </button>
      </div>
      {stepText ? <div className="txStep">{stepText}</div> : null}
      {hintText ? (
        <div className="muted txHintRow">
          {hintText}
        </div>
      ) : null}
      {tx.stage === "confirmed" && (
        <div className="txConfirmedHint" role="status">
          {txConfirmedPositionHint}
        </div>
      )}
      {tx.error ? (
        <div className="errorText" role="alert" aria-live="assertive">
          {errorTitle ? <div><b>{errorTitle}</b></div> : null}
          <div>{tx.error.message}</div>
        </div>
      ) : null}

      {tx.stage === "stuck" && (
        <div className="banner bannerWarn txStuckBanner">
          <div className="bannerTitle">{stillPendingOnNetwork}</div>
          <div className="txStuckHint">
            {txStuckHint}
          </div>
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
            <span className="muted">{stageLabel}</span>
            <span>{tx.stage}</span>
            <span className="muted">{labelLabel}</span>
            <span>{tx.label ?? emptyPlaceholder}</span>
          </div>
          <div className="detailRow">
            <span className="muted">{hashLabel}</span>
            <span className="mono">{tx.hash ?? emptyPlaceholder}</span>
          </div>
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
