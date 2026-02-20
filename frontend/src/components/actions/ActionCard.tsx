import { useState } from "react";
import { supply, withdraw, borrow, repay, max, emptyPlaceholder, amountLabel, loading as loadingText, allowanceColon, sufficientLabel, needsApproveLabel, blockedPrefix, allowanceTooltip, errorContractReadFailedShort } from "../../config/ui";
import type { ActionCardProps } from "../../types/dashboard";

const ACTION_LABELS: Record<ActionCardProps["type"], string> = {
  Supply: supply,
  Withdraw: withdraw,
  Borrow: borrow,
  Repay: repay,
};

export function ActionCard({
  type,
  value,
  onChange,
  onMax,
  onSubmit,
  disabled,
  maxButtonDisabled,
  actionDisabledReason,
  allowanceStatus,
  symbol,
  placeholder,
  inputTitle,
  parsedError,
  helpText,
  submitButtonLabel,
  cardHint,
  cardId,
  submitBusy,
}: ActionCardProps) {
  const [hasTouched, setHasTouched] = useState(false);
  const buttonLabel = submitButtonLabel ?? ACTION_LABELS[type];
  const showBusy = Boolean(disabled && submitBusy);

  const handleSubmit = () => {
    setHasTouched(true);
    onSubmit();
  };

  return (
    <div className="card actionCard" id={cardId}>
      <div className="cardTitle">{ACTION_LABELS[type]} (<span translate="no">{symbol}</span>)</div>
      <div className="fieldLabel" id={`${type}-amount-label`}>{amountLabel}</div>
      <div className="inlineRow">
        <button
          type="button"
          className="btn btnSecondary btnSmall btnMax"
          onClick={onMax}
          disabled={maxButtonDisabled}
          aria-label={max}
        >
          {max}
        </button>
        {helpText && (
          <div className="helpText actionCardHelpTop">
            {helpText}
          </div>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setHasTouched(true)}
        placeholder={placeholder ?? amountLabel}
        title={inputTitle}
        className={`fullWidth ${parsedError ? "inputInvalid" : ""} ${value?.trim() && !parsedError ? "inputValid" : ""}`}
        aria-label={amountLabel}
        aria-invalid={!!parsedError}
        aria-describedby={parsedError ? undefined : `${type.toLowerCase()}-help`}
        inputMode="decimal"
        autoComplete="off"
      />
      {parsedError && (
        <div className="errorText actionCardParsedError" role="alert" aria-live="polite">
          {parsedError}
        </div>
      )}
      {allowanceStatus !== undefined && (
        <div id={`${type.toLowerCase()}-help`} className="actionCardAllowanceRow" title={allowanceTooltip}>
          {allowanceColon}
          {allowanceStatus.loading
            ? loadingText
            : allowanceStatus.value ?? emptyPlaceholder}
          {allowanceStatus.sufficient !== undefined && (
            <>
              {" "}
              <span className={`pill ${allowanceStatus.sufficient ? "pillOk" : "pillWarn"} actionCardPill`}>
                {allowanceStatus.sufficient ? sufficientLabel : needsApproveLabel}
              </span>
            </>
          )}
          {allowanceStatus.error && (
            <span className="errorText actionCardAllowanceError" role="alert" title={allowanceStatus.error}>
              {allowanceStatus.error.length > 80 && allowanceStatus.error.includes("Contract read failed")
                ? errorContractReadFailedShort
                : allowanceStatus.error}
            </span>
          )}
        </div>
      )}
      {cardHint && <p className="muted cardHint" role="note">{cardHint}</p>}
      <button
        type="button"
        className={`btn btnPrimary fullWidth actionCardSubmit${showBusy ? " actionCardSubmit--busy" : ""}`}
        disabled={disabled}
        onClick={handleSubmit}
        aria-label={showBusy ? loadingText : buttonLabel}
      >
        {showBusy ? (
          <>
            <span className="actionCardSubmitSpinner" aria-hidden="true" />
            {loadingText}
          </>
        ) : (
          buttonLabel
        )}
      </button>
      {(hasTouched || disabled) && actionDisabledReason && (
        <div className="actionDisabledReason" role="alert">{blockedPrefix}{actionDisabledReason}</div>
      )}
    </div>
  );
}
