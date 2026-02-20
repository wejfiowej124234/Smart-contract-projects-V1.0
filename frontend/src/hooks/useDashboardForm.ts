import { formatUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { DISPLAY_MAX_DECIMALS } from "../config/runtime";
import {
  emptyPlaceholder,
  actionReasonMetaMaskNotDetected,
  actionReasonConnectWallet,
  actionReasonWrongNetworkTemplate,
  actionReasonLoadingContracts,
  actionReasonTxInProgress,
  actionReasonEnterAmount,
  actionReasonInvalidAmount,
} from "../config/ui";
import { DEFAULT_CHAIN_ID } from "../config/network";
import { parseAmountStrict } from "../utils/amount";
import { clampDecimalsForDisplay, formatAmountForDisplayWithStrategy } from "../utils/format";
import type { PreflightAction, DashboardInputs } from "../types/dashboard";

export function useDashboardForm(params: {
  usd8Decimals: number;
  dashboardData: {
    usd8Balance?: bigint;
    position?: { maxWithdraw?: bigint; maxBorrow?: bigint; borrowed?: bigint };
  } | undefined;
  wallet: { account?: string; chainId?: number; isMetaMaskAvailable: boolean };
  isCorrectNetwork: boolean;
  actionsReady: boolean;
  txBusy: boolean;
  safeMaxWei: (maxWei: bigint | undefined) => bigint | undefined;
}) {
  const {
    usd8Decimals,
    dashboardData,
    wallet,
    isCorrectNetwork,
    actionsReady,
    txBusy,
    safeMaxWei,
  } = params;

  const [inputs, setInputs] = useState<DashboardInputs>({
    supply: "",
    withdraw: "",
    borrow: "",
    repay: "",
  });

  const supplyParsed = useMemo(
    () => (inputs.supply.trim() ? parseAmountStrict(inputs.supply, usd8Decimals) : undefined),
    [inputs.supply, usd8Decimals]
  );
  const withdrawParsed = useMemo(
    () => (inputs.withdraw.trim() ? parseAmountStrict(inputs.withdraw, usd8Decimals) : undefined),
    [inputs.withdraw, usd8Decimals]
  );
  const borrowParsed = useMemo(
    () => (inputs.borrow.trim() ? parseAmountStrict(inputs.borrow, usd8Decimals) : undefined),
    [inputs.borrow, usd8Decimals]
  );
  const repayParsed = useMemo(
    () => (inputs.repay.trim() ? parseAmountStrict(inputs.repay, usd8Decimals) : undefined),
    [inputs.repay, usd8Decimals]
  );

  const canSupply = !!supplyParsed?.ok;
  const canWithdraw = !!withdrawParsed?.ok;
  const canBorrow = !!borrowParsed?.ok;
  const canRepay = !!repayParsed?.ok;

  // When dashboard refreshes and a cap becomes 0, clear the corresponding input to avoid e.g. "11.110999" with "Max withdrawable: 0"
  useEffect(() => {
    const pos = dashboardData?.position;
    if (pos === undefined) return;
    setInputs((prev) => {
      let next = prev;
      if (pos.maxWithdraw === 0n && prev.withdraw.trim()) next = { ...next, withdraw: "" };
      if (pos.maxBorrow === 0n && prev.borrow.trim()) next = { ...next, borrow: "" };
      if (pos.borrowed === 0n && prev.repay.trim()) next = { ...next, repay: "" };
      return next !== prev ? next : prev;
    });
  }, [dashboardData?.position]);

  const formatToken = (v: bigint | undefined, decimals: number): string => {
    if (v === undefined || v < 0n) return emptyPlaceholder;
    return formatAmountForDisplayWithStrategy(v, decimals);
  };
  const formatPercent = (v: bigint | undefined) => (v !== undefined ? `${v.toString()}%` : emptyPlaceholder);

  const actionDisabledReason = (
    _action: PreflightAction,
    args: { rawInput: string; parsed?: { ok: boolean; error?: string } }
  ): string | undefined => {
    if (!wallet.isMetaMaskAvailable) return actionReasonMetaMaskNotDetected;
    if (!wallet.account) return actionReasonConnectWallet;
    if (!isCorrectNetwork) return actionReasonWrongNetworkTemplate.replace("{chainId}", String(DEFAULT_CHAIN_ID));
    if (!actionsReady) return actionReasonLoadingContracts;
    if (txBusy) return actionReasonTxInProgress;
    if (!args.rawInput.trim()) return actionReasonEnterAmount;
    if (args.parsed && !args.parsed.ok) return args.parsed.error ?? actionReasonInvalidAmount;
    return undefined;
  };

  const onUseMaxSupply = () => {
    const balWei = dashboardData?.usd8Balance;
    if (!balWei || balWei === 0n) return;
    setInputs((p) => ({ ...p, supply: clampDecimalsForDisplay(formatUnits(balWei, usd8Decimals), DISPLAY_MAX_DECIMALS) }));
  };
  const onUseMaxWithdraw = () => {
    const safeWei = safeMaxWei(dashboardData?.position?.maxWithdraw);
    if (!safeWei || safeWei === 0n) return;
    setInputs((p) => ({ ...p, withdraw: clampDecimalsForDisplay(formatUnits(safeWei, usd8Decimals), DISPLAY_MAX_DECIMALS) }));
  };
  const onUseMaxBorrow = () => {
    const safeWei = safeMaxWei(dashboardData?.position?.maxBorrow);
    if (!safeWei || safeWei === 0n) return;
    setInputs((p) => ({ ...p, borrow: clampDecimalsForDisplay(formatUnits(safeWei, usd8Decimals), DISPLAY_MAX_DECIMALS) }));
  };
  const onUseMaxRepay = () => {
    const balWei = dashboardData?.usd8Balance;
    const borrowedWei = dashboardData?.position?.borrowed;
    if (!balWei || !borrowedWei) return;
    const maxWei = balWei < borrowedWei ? balWei : borrowedWei;
    if (maxWei === 0n) return;
    setInputs((p) => ({ ...p, repay: clampDecimalsForDisplay(formatUnits(maxWei, usd8Decimals), DISPLAY_MAX_DECIMALS) }));
  };

  return {
    inputs,
    setInputs,
    parsed: {
      supply: supplyParsed,
      withdraw: withdrawParsed,
      borrow: borrowParsed,
      repay: repayParsed,
    },
    canSupply,
    canWithdraw,
    canBorrow,
    canRepay,
    actionDisabledReason,
    formatToken,
    formatPercent,
    onUseMaxSupply,
    onUseMaxWithdraw,
    onUseMaxBorrow,
    onUseMaxRepay,
  };
}
