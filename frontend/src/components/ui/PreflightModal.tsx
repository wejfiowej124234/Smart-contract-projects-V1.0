import { AddressDisplay } from "./AddressDisplay";
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
} from "../../config/ui";
import type { PreflightAction } from "../../types/dashboard";

type PreflightSnapshot = {
  action: PreflightAction;
  amountText: string;
  snapshot: { account?: string; chainId?: number; approveMode: "exact" | "infinite"; token: string; spender: string };
};

export function PreflightModal(props: {
  preflight: PreflightSnapshot;
  preflightError: string | undefined;
  preflightSubmitting: boolean;
  symbol: string;
  txBusy: boolean;
  supplyApyFormatted?: string;
  borrowApyFormatted?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { preflight, preflightError, preflightSubmitting, symbol, txBusy, supplyApyFormatted, borrowApyFormatted, onClose, onConfirm } = props;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modalOverlay"
      onClick={() => { if (!preflightSubmitting) onClose(); }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">{confirmPreflightTitle}</div>
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
          </div>
          {preflightError && <div className="errorText">{preflightError}</div>}
          {preflightSubmitting && <div className="muted">{preflightChecking}</div>}
          <div className="preflightNote">
            {enterpriseNotePreflight}
          </div>
        </div>
        <div className="modalFooter">
          <button className="btn btnSecondary" onClick={onClose} disabled={preflightSubmitting}>{cancel}</button>
          <button className="btn btnPrimary" onClick={() => void onConfirm()} disabled={preflightSubmitting || txBusy}>
            {preflightSubmitting ? checkingLabel : confirmAndOpenWallet}
          </button>
        </div>
      </div>
    </div>
  );
}
