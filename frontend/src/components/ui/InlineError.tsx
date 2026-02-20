import { useState, useCallback } from "react";
import { retryLabel, switchToChain31337Label, openDiagnosticLabel, copyErrorDetailsLabel, copyErrorDetailsCopied } from "../../config/ui";
import { COPY_FEEDBACK_MS } from "../../config/runtime";

/** F6/F7: Inline error with optional Retry / Switch to 31337 / Open diagnostic / Copy details */
export function InlineError({
  message,
  diagnostic,
  onRetry,
  onSwitchTo31337,
  onOpenDiagnostic,
}: {
  message: string;
  /** Full diagnostic string for "Copy error details" (e.g. message + code). */
  diagnostic?: string;
  onRetry?: () => void;
  onSwitchTo31337?: () => void;
  onOpenDiagnostic?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const toCopy = diagnostic ?? message;
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // ignore
    }
  }, [toCopy]);
  return (
    <div className="inlineError" role="alert">
      <p className="inlineErrorMessage">{message}</p>
      <div className="inlineErrorActions">
        <button type="button" className="inlineErrorBtn" onClick={() => void onCopy()} aria-label={copyErrorDetailsLabel}>
          {copied ? copyErrorDetailsCopied : copyErrorDetailsLabel}
        </button>
        {onRetry && (
          <button type="button" className="inlineErrorBtn" onClick={onRetry} aria-label={retryLabel}>
            {retryLabel}
          </button>
        )}
        {onSwitchTo31337 && (
          <button type="button" className="inlineErrorBtn" onClick={onSwitchTo31337} aria-label={switchToChain31337Label}>
            {switchToChain31337Label}
          </button>
        )}
        {onOpenDiagnostic && (
          <button type="button" className="inlineErrorBtn" onClick={onOpenDiagnostic} aria-label={openDiagnosticLabel}>
            {openDiagnosticLabel}
          </button>
        )}
      </div>
    </div>
  );
}
