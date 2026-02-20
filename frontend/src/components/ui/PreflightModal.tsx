import { AddressDisplay } from "./AddressDisplay";
import { useState, useEffect } from "react";
import {
  cancel,
  emptyPlaceholder,
  confirmPreflightTitle,
  closeLabel,
  actionLabel,
  amountLabel,
  chainIdLabel,
  accountLabel,
  tokenLabel,
  spenderLabel,
  approvalLabel,
  exactLabel,
  infiniteLabel,
  preflightChecking,
  confirmAndOpenWallet,
  checkingLabel,
  enterpriseNotePreflight,
  preflightMayPromptTemplate,
  supply,
  borrow,
  repay,
  approveModeValueInfinite,
  transactionOverviewTitle,
  supplyApyLabel,
  borrowApyLabel,
  collateralizationLabel,
  collateralizationNa,
  preflightImpactTitle,
  preflightRiskWorsensSummary,
  preflightImpactHint,
  preflightImpactBeforeLabel,
  preflightImpactAfterLabel,
  preflightImpactDeltaLabel,
  estimatedGasLabel,
  estimatedFeeLabel,
  simulationFailedHint,
  simulationFailedWarnAllowTitle,
  simulationFailedWarnAllowCheckbox,
  simulationFailedNoPopupHint,
  preflightTxInProgressHint,
} from "../../config/ui";
import type { PreflightAction } from "../../types/dashboard";
import type { PreflightImpact } from "../../utils/preflightImpact";

type PreflightSnapshot = {
  action: PreflightAction;
  amountText: string;
  snapshot: { account?: string; chainId?: number; approveMode: "exact" | "infinite"; token: string; spender: string };
};

export function PreflightModal(props: {
  preflight: PreflightSnapshot & { impact?: PreflightImpact | null; gasEstimate?: { estimatedGas?: string | number; estimatedFee?: string; simulationFailed?: boolean; simulationFailedPolicy?: "block" | "warn_allow" } };
  preflightError: string | undefined;
  preflightSubmitting: boolean;
  symbol: string;
  /** When true, confirm is disabled and we show a hint to complete/reject tx in MetaMask first. */
  txBusy: boolean;
  supplyApyFormatted?: string;
  borrowApyFormatted?: string;
  impact?: PreflightImpact | null;
  estimatedGas?: string | number;
  estimatedFee?: string;
  simulationFailed?: boolean;
  simulationFailedPolicy?: "block" | "warn_allow";
  onClose: () => void;
  onConfirm: () => Promise<void>;
  /** When true, confirm is disabled and no wallet popup will occur; show networkMismatchMessage. */
  writesDisabledByMismatch?: boolean;
  /** Shown when writesDisabledByMismatch is true (e.g. switch MetaMask to chain 31337). */
  networkMismatchMessage?: string;
}) {
  const {
    preflight,
    preflightError,
    preflightSubmitting,
    symbol,
    txBusy,
    writesDisabledByMismatch = false,
    networkMismatchMessage,
    supplyApyFormatted,
    borrowApyFormatted,
    impact,
    estimatedGas: estimatedGasProp,
    estimatedFee: estimatedFeeProp,
    simulationFailed: simulationFailedProp,
    simulationFailedPolicy,
    onClose,
    onConfirm,
  } = props;
  const gasEst = preflight.gasEstimate;
  const estimatedGas = estimatedGasProp ?? gasEst?.estimatedGas;
  const estimatedFee = estimatedFeeProp ?? gasEst?.estimatedFee;
  const simulationFailed = simulationFailedProp ?? gasEst?.simulationFailed;
  const policy = simulationFailedPolicy ?? gasEst?.simulationFailedPolicy ?? "warn_allow";
  const [warnAllowChecked, setWarnAllowChecked] = useState(false);
  const blockConfirm = simulationFailed && policy === "block";
  const warnAllowConfirmDisabled = simulationFailed && policy === "warn_allow" && !warnAllowChecked;
  const confirmDisabled = preflightSubmitting || txBusy || blockConfirm || warnAllowConfirmDisabled || writesDisabledByMismatch;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preflightSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, preflightSubmitting]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preflight-modal-title"
      className="modalOverlay"
      onClick={() => { if (!preflightSubmitting) onClose(); }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div id="preflight-modal-title" className="modalTitle">{confirmPreflightTitle}</div>
          <button className="btn btnSecondary btnSmall" onClick={onClose} disabled={preflightSubmitting}>{closeLabel}</button>
        </div>
        <div className="modalBody">
          <div>{actionLabel}: <b>{preflight.action}</b></div>
          <div>{amountLabel}: <b>{preflight.amountText.trim() || emptyPlaceholder}</b> <span translate="no">{symbol}</span></div>
          <div>{chainIdLabel}: <b>{preflight.snapshot.chainId ?? emptyPlaceholder}</b></div>
          <AddressDisplay label={accountLabel} address={preflight.snapshot.account} />
          <AddressDisplay label={tokenLabel} address={preflight.snapshot.token} />
          <AddressDisplay label={spenderLabel} address={preflight.snapshot.spender} />
          {(preflight.action === supply || preflight.action === repay) && (
            <div className="preflightApprovalRow">
              {approvalLabel}: <b>{preflight.snapshot.approveMode === approveModeValueInfinite ? infiniteLabel : exactLabel}</b> {preflightMayPromptTemplate}{preflight.action})
            </div>
          )}
          <div className="preflightTransactionOverview">
            <div className="preflightTransactionOverviewTitle">{transactionOverviewTitle}</div>
            {preflight.action === supply && supplyApyFormatted != null && (
              <div className="preflightOverviewRow">{supplyApyLabel}: <span className="preflightValue">{supplyApyFormatted}</span></div>
            )}
            {preflight.action === borrow && borrowApyFormatted != null && (
              <div className="preflightOverviewRow">{borrowApyLabel}: <span className="preflightValue">{borrowApyFormatted}</span></div>
            )}
            <div className="preflightOverviewRow preflightOverviewRow--muted">{collateralizationLabel}: {collateralizationNa}</div>
            {estimatedGas != null && !simulationFailed && (
              <div className="preflightOverviewRow preflightOverviewRow--muted">
                {estimatedGasLabel}: <span className="preflightValue">~{String(estimatedGas)}</span>
                {estimatedFee != null && <> · {estimatedFeeLabel}: ~{estimatedFee}</>}
              </div>
            )}
            {simulationFailed && (
              <div className="preflightOverviewRow preflightOverviewRow--muted errorText">
                {simulationFailedHint}
                {policy === "warn_allow" && (
                  <>
                    <p className="preflightSimulationWarn" role="alert">{simulationFailedWarnAllowTitle}</p>
                    <label className="preflightSimulationCheckbox">
                      <input type="checkbox" checked={warnAllowChecked} onChange={(e) => setWarnAllowChecked(e.target.checked)} />
                      {simulationFailedWarnAllowCheckbox}
                    </label>
                    <p className="preflightSimulationNoPopupHint muted" role="status">{simulationFailedNoPopupHint}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="preflightImpactBlock" role="region" aria-label={preflightImpactTitle}>
            <div className="preflightImpactTitle">{preflightImpactTitle}</div>
            {impact?.anyWorse && (
              <p className="preflightImpactWorseSummary" role="status" aria-live="polite">
                {preflightRiskWorsensSummary}
              </p>
            )}
            {impact?.rows?.length ? (
              <div className="preflightImpactTableWrap">
                <table className="preflightImpactTable" role="presentation">
                  <thead>
                    <tr>
                      <th scope="col" className="preflightImpactThLabel" />
                      <th scope="col" className="preflightImpactTh preflightImpactTh--before">{preflightImpactBeforeLabel}</th>
                      <th scope="col" className="preflightImpactTh preflightImpactTh--after">{preflightImpactAfterLabel}</th>
                      <th scope="col" className="preflightImpactTh preflightImpactTh--delta">{preflightImpactDeltaLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.rows.map((row) => (
                      <tr key={row.label} className={row.worse ? "preflightImpactRow preflightImpactRow--worse" : "preflightImpactRow"}>
                        <td className="preflightImpactCell preflightImpactCellLabel">{row.label}</td>
                        <td className="preflightImpactCell preflightImpactCellBefore">{row.before}</td>
                        <td className="preflightImpactCell preflightImpactCellAfter">{row.after}</td>
                        <td className="preflightImpactCell preflightImpactCellDelta">{row.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {impact.anyWorse && <p className="preflightImpactWorseHint muted">{preflightImpactHint}</p>}
              </div>
            ) : (
              <p className="preflightImpactHint muted">{preflightImpactHint}</p>
            )}
          </div>
          {writesDisabledByMismatch && networkMismatchMessage && (
            <div className="errorText" role="alert">
              {networkMismatchMessage}
            </div>
          )}
          {preflightError && !writesDisabledByMismatch && <div className="errorText">{preflightError}</div>}
          {preflightSubmitting && <div className="muted">{preflightChecking}</div>}
          {confirmDisabled && txBusy && (
            <p className="preflightTxInProgressHint muted" role="status">{preflightTxInProgressHint}</p>
          )}
          <div className="preflightNote">
            {enterpriseNotePreflight}
          </div>
        </div>
        <div className="modalFooter">
          <button className="btn btnSecondary" onClick={onClose} disabled={preflightSubmitting}>{cancel}</button>
          <button className="btn btnPrimary" onClick={() => void onConfirm()} disabled={confirmDisabled}>
            {preflightSubmitting ? checkingLabel : confirmAndOpenWallet}
          </button>
        </div>
      </div>
    </div>
  );
}
