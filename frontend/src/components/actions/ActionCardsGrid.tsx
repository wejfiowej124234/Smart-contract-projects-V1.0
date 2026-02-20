import { formatUnits } from "ethers";
import { amountPlaceholder, amountDecimalsTooltip, helpAvailablePrefix, helpMaxWithdrawablePrefix, helpMaxBorrowablePrefix, helpBorrowedPrefix, supply, withdraw, borrow, repay, actionReasonNoWithdrawable, actionReasonNoBorrowable, actionReasonNoDebtToRepay, actionReasonDashboardNotReady, actionReasonNetworkMismatch, actionReasonReadOnlyMode, actionReasonRuntimeRiskHigh, emptyPlaceholder, approveLabelUsd8, borrowHfWarning, withdrawHfWarning } from "../../config/ui";
import { sanitizeAmountInput, safeMaxWei } from "../../utils/amount";
import { formatWithThousandsSeparator } from "../../utils/format";
import { ActionCard } from "./ActionCard";
import type { UseDashboardFormReturn } from "../../types/dashboard";
import type { PreflightAction } from "../../types/dashboard";

type Parsed = { ok: boolean; value?: bigint; error?: string };

export function ActionCardsGrid(props: {
  form: UseDashboardFormReturn;
  preflight: { openPreflight: (action: PreflightAction, amountText: string) => void };
  actions: { ready: boolean };
  dashboardReady: boolean;
  txBusy: boolean;
  wallet: { account?: string };
  dashboard: { data?: { usd8Balance?: bigint; position?: { maxWithdraw?: bigint; maxBorrow?: bigint; borrowed?: bigint } } };
  allowance: { loading: boolean; allowance?: bigint };
  symbol: string;
  usd8Decimals: number;
  /** When true (e.g. mainnet read-only), all write actions are disabled. */
  readOnlyMode?: boolean;
  /** Protocol-grade: when true (runtime risk high), all write actions are disabled. */
  runtimeRiskTierHigh?: boolean;
  /** Split provider: when true (readChainId !== walletChainId on 31337), all write actions are disabled. */
  networkMismatch?: boolean;
}) {
  const { form, preflight, actions, dashboardReady, txBusy, wallet, dashboard, allowance, symbol, usd8Decimals, readOnlyMode = false, runtimeRiskTierHigh = false, networkMismatch = false } = props;
  const p = (key: "supply" | "withdraw" | "borrow" | "repay"): Parsed | undefined =>
    form.parsed[key] ? { ok: form.parsed[key]!.ok, error: form.parsed[key]!.ok ? undefined : (form.parsed[key] as { error: string }).error } : undefined;
  const maxWithdrawWei = safeMaxWei(dashboard.data?.position?.maxWithdraw);
  const maxBorrowWei = safeMaxWei(dashboard.data?.position?.maxBorrow);
  const borrowedWei = dashboard.data?.position?.borrowed;
  const reason = (action: PreflightAction, args: { rawInput: string; parsed?: Parsed }) => {
    if (!wallet.account) return undefined;
    if (networkMismatch) return actionReasonNetworkMismatch;
    if (readOnlyMode) return actionReasonReadOnlyMode;
    if (runtimeRiskTierHigh) return actionReasonRuntimeRiskHigh;
    if (!dashboardReady && wallet.account) return actionReasonDashboardNotReady;
    if (action === withdraw && (maxWithdrawWei === undefined || maxWithdrawWei === 0n)) return actionReasonNoWithdrawable;
    if (action === borrow && (maxBorrowWei === undefined || maxBorrowWei === 0n)) return actionReasonNoBorrowable;
    if (action === repay && (borrowedWei === undefined || borrowedWei === 0n)) return actionReasonNoDebtToRepay;
    return form.actionDisabledReason(action, { rawInput: args.rawInput, parsed: args.parsed });
  };
  const withdrawDisabledByCapability = !dashboard.data?.position?.maxWithdraw || maxWithdrawWei === 0n;
  const borrowDisabledByCapability = !dashboard.data?.position?.maxBorrow || maxBorrowWei === 0n;
  const repayDisabledByCapability = !dashboard.data?.position?.borrowed || borrowedWei === 0n;
  const fmtNum = (raw: string) => raw === emptyPlaceholder ? raw : formatWithThousandsSeparator(raw) + " " + symbol;
  const supplyAllowanceSufficient = form.parsed.supply?.ok && allowance.allowance !== undefined && allowance.allowance >= form.parsed.supply!.value!;
  /* When amount is valid and allowance is not sufficient (or still loading), show "Approve USD8" so user knows first click = approve. */
  const supplyNeedsApprove =
    form.parsed.supply?.ok && (allowance.allowance === undefined || allowance.allowance < form.parsed.supply!.value!);
  const supplySubmitLabel = supplyNeedsApprove ? approveLabelUsd8 : undefined;
  const repayAllowanceSufficient = form.parsed.repay?.ok && allowance.allowance !== undefined && allowance.allowance >= form.parsed.repay!.value!;
  const repayNeedsApprove =
    form.parsed.repay?.ok && (allowance.allowance === undefined || allowance.allowance < form.parsed.repay!.value!);
  const repaySubmitLabel = repayNeedsApprove ? approveLabelUsd8 : undefined;
  const gate = (d: boolean) => d || readOnlyMode || runtimeRiskTierHigh || networkMismatch;
  /* Supply: when "Needs approve", allow click without dashboardReady so user can send Approve first; after that Supply requires dashboardReady. */
  const supplyDisabled = supplyNeedsApprove
    ? gate(!actions.ready || !form.canSupply || txBusy)
    : gate(!actions.ready || !dashboardReady || !form.canSupply || txBusy);
  /* Repay: same as Supply — when "Needs approve", allow click without dashboardReady for first Approve. */
  const repayDisabled = repayNeedsApprove
    ? gate(!actions.ready || !form.canRepay || txBusy || repayDisabledByCapability)
    : gate(!actions.ready || !dashboardReady || !form.canRepay || txBusy || repayDisabledByCapability);
  return (
    <div className="grid actionsGrid">
      <ActionCard type={supply} cardId="action-card-supply" submitBusy={txBusy} value={form.inputs.supply} onChange={(v) => form.setInputs((prev) => ({ ...prev, supply: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxSupply} onSubmit={() => preflight.openPreflight(supply, form.inputs.supply)} disabled={supplyDisabled} maxButtonDisabled={!wallet.account || !dashboard.data || dashboard.data.usd8Balance === 0n} actionDisabledReason={reason(supply, { rawInput: form.inputs.supply, parsed: p("supply") })} allowanceStatus={{ loading: allowance.loading, sufficient: supplyAllowanceSufficient, value: allowance.allowance !== undefined ? formatUnits(allowance.allowance, usd8Decimals) : undefined, error: allowance.error }} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.supply ? (form.parsed.supply.ok ? undefined : form.parsed.supply.error) : undefined} helpText={`${helpAvailablePrefix}${fmtNum(form.formatToken(dashboard.data?.usd8Balance, usd8Decimals))}`} submitButtonLabel={supplySubmitLabel} />
      <ActionCard type={withdraw} cardId="action-card-withdraw" submitBusy={txBusy} value={form.inputs.withdraw} onChange={(v) => form.setInputs((prev) => ({ ...prev, withdraw: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxWithdraw} onSubmit={() => preflight.openPreflight(withdraw, form.inputs.withdraw)} disabled={gate(!actions.ready || !dashboardReady || !form.canWithdraw || txBusy || withdrawDisabledByCapability)} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.maxWithdraw || maxWithdrawWei === 0n} actionDisabledReason={reason(withdraw, { rawInput: form.inputs.withdraw, parsed: p("withdraw") })} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.withdraw ? (form.parsed.withdraw.ok ? undefined : form.parsed.withdraw.error) : undefined} helpText={`${helpMaxWithdrawablePrefix}${fmtNum(form.formatToken(maxWithdrawWei, usd8Decimals))}`} cardHint={withdrawHfWarning} />
      <ActionCard type={borrow} cardId="action-card-borrow" submitBusy={txBusy} value={form.inputs.borrow} onChange={(v) => form.setInputs((prev) => ({ ...prev, borrow: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxBorrow} onSubmit={() => preflight.openPreflight(borrow, form.inputs.borrow)} disabled={gate(!actions.ready || !dashboardReady || !form.canBorrow || txBusy || borrowDisabledByCapability)} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.maxBorrow || maxBorrowWei === 0n} actionDisabledReason={reason(borrow, { rawInput: form.inputs.borrow, parsed: p("borrow") })} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.borrow ? (form.parsed.borrow.ok ? undefined : form.parsed.borrow.error) : undefined} helpText={`${helpMaxBorrowablePrefix}${fmtNum(form.formatToken(maxBorrowWei, usd8Decimals))}`} cardHint={borrowHfWarning} />
      <ActionCard type={repay} cardId="action-card-repay" submitBusy={txBusy} value={form.inputs.repay} onChange={(v) => form.setInputs((prev) => ({ ...prev, repay: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxRepay} onSubmit={() => preflight.openPreflight(repay, form.inputs.repay)} disabled={repayDisabled} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.borrowed || borrowedWei === 0n || dashboard.data?.usd8Balance === 0n} actionDisabledReason={reason(repay, { rawInput: form.inputs.repay, parsed: p("repay") })} allowanceStatus={{ loading: allowance.loading, sufficient: repayAllowanceSufficient, value: allowance.allowance !== undefined ? formatUnits(allowance.allowance, usd8Decimals) : undefined, error: allowance.error }} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.repay ? (form.parsed.repay.ok ? undefined : form.parsed.repay.error) : undefined} helpText={`${helpBorrowedPrefix}${fmtNum(form.formatToken(dashboard.data?.position?.borrowed, usd8Decimals))}`} submitButtonLabel={repaySubmitLabel} />
    </div>
  );
}
