import { formatUnits } from "ethers";
import { amountPlaceholder, amountDecimalsTooltip, helpAvailablePrefix, helpMaxWithdrawablePrefix, helpMaxBorrowablePrefix, helpBorrowedPrefix, supply, withdraw, borrow, repay, actionReasonNoWithdrawable, actionReasonNoBorrowable, actionReasonNoDebtToRepay, emptyPlaceholder, approveLabelUsd8, borrowHfWarning, withdrawHfWarning } from "../../config/ui";
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
}) {
  const { form, preflight, actions, dashboardReady, txBusy, wallet, dashboard, allowance, symbol, usd8Decimals } = props;
  const p = (key: "supply" | "withdraw" | "borrow" | "repay"): Parsed | undefined =>
    form.parsed[key] ? { ok: form.parsed[key]!.ok, error: form.parsed[key]!.ok ? undefined : (form.parsed[key] as { error: string }).error } : undefined;
  const maxWithdrawWei = safeMaxWei(dashboard.data?.position?.maxWithdraw);
  const maxBorrowWei = safeMaxWei(dashboard.data?.position?.maxBorrow);
  const borrowedWei = dashboard.data?.position?.borrowed;
  const reason = (action: PreflightAction, args: { rawInput: string; parsed?: Parsed }) => {
    if (!wallet.account) return undefined;
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
  const supplyNeedsApprove = form.parsed.supply?.ok && allowance.allowance !== undefined && allowance.allowance < form.parsed.supply!.value!;
  const supplySubmitLabel = supplyNeedsApprove ? approveLabelUsd8 : undefined;
  return (
    <div className="grid actionsGrid">
      <ActionCard type={supply} cardId="action-card-supply" submitBusy={txBusy} value={form.inputs.supply} onChange={(v) => form.setInputs((prev) => ({ ...prev, supply: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxSupply} onSubmit={() => preflight.openPreflight(supply, form.inputs.supply)} disabled={!actions.ready || !dashboardReady || !form.canSupply || txBusy} maxButtonDisabled={!wallet.account || !dashboard.data || dashboard.data.usd8Balance === 0n} actionDisabledReason={reason(supply, { rawInput: form.inputs.supply, parsed: p("supply") })} allowanceStatus={{ loading: allowance.loading, sufficient: supplyAllowanceSufficient, value: allowance.allowance !== undefined ? formatUnits(allowance.allowance, usd8Decimals) : undefined }} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.supply ? (form.parsed.supply.ok ? undefined : form.parsed.supply.error) : undefined} helpText={`${helpAvailablePrefix}${fmtNum(form.formatToken(dashboard.data?.usd8Balance, usd8Decimals))}`} submitButtonLabel={supplySubmitLabel} />
      <ActionCard type={withdraw} value={form.inputs.withdraw} onChange={(v) => form.setInputs((prev) => ({ ...prev, withdraw: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxWithdraw} onSubmit={() => preflight.openPreflight(withdraw, form.inputs.withdraw)} disabled={!actions.ready || !dashboardReady || !form.canWithdraw || txBusy || withdrawDisabledByCapability} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.maxWithdraw || maxWithdrawWei === 0n} actionDisabledReason={reason(withdraw, { rawInput: form.inputs.withdraw, parsed: p("withdraw") })} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.withdraw ? (form.parsed.withdraw.ok ? undefined : form.parsed.withdraw.error) : undefined} helpText={`${helpMaxWithdrawablePrefix}${fmtNum(form.formatToken(maxWithdrawWei, usd8Decimals))}`} cardHint={withdrawHfWarning} />
      <ActionCard type={borrow} submitBusy={txBusy} value={form.inputs.borrow} onChange={(v) => form.setInputs((prev) => ({ ...prev, borrow: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxBorrow} onSubmit={() => preflight.openPreflight(borrow, form.inputs.borrow)} disabled={!actions.ready || !dashboardReady || !form.canBorrow || txBusy || borrowDisabledByCapability} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.maxBorrow || maxBorrowWei === 0n} actionDisabledReason={reason(borrow, { rawInput: form.inputs.borrow, parsed: p("borrow") })} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.borrow ? (form.parsed.borrow.ok ? undefined : form.parsed.borrow.error) : undefined} helpText={`${helpMaxBorrowablePrefix}${fmtNum(form.formatToken(maxBorrowWei, usd8Decimals))}`} cardHint={borrowHfWarning} />
      <ActionCard type={repay} submitBusy={txBusy} value={form.inputs.repay} onChange={(v) => form.setInputs((prev) => ({ ...prev, repay: sanitizeAmountInput(v, usd8Decimals) }))} onMax={form.onUseMaxRepay} onSubmit={() => preflight.openPreflight(repay, form.inputs.repay)} disabled={!actions.ready || !dashboardReady || !form.canRepay || txBusy || repayDisabledByCapability} maxButtonDisabled={!wallet.account || !dashboard.data?.position?.borrowed || borrowedWei === 0n || dashboard.data?.usd8Balance === 0n} actionDisabledReason={reason(repay, { rawInput: form.inputs.repay, parsed: p("repay") })} symbol={symbol} decimals={usd8Decimals} placeholder={amountPlaceholder} inputTitle={amountDecimalsTooltip} parsedError={form.parsed.repay ? (form.parsed.repay.ok ? undefined : form.parsed.repay.error) : undefined} helpText={`${helpBorrowedPrefix}${fmtNum(form.formatToken(dashboard.data?.position?.borrowed, usd8Decimals))}`} />
    </div>
  );
}
