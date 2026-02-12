import { useState } from "react";
import type { Deployments } from "../contracts/deployments";
import {
  preflightErrorWalletOrNetworkChanged,
  preflightErrorApprovalModeChanged,
  preflightErrorWrongNetwork,
  preflightErrorInsufficientUsd8Balance,
  preflightErrorRepayExceedsBorrowed,
  preflightErrorAmountExceedsMaxWithdrawable,
  preflightErrorInsufficientPoolLiquidity,
  preflightErrorAmountExceedsMaxBorrowable,
} from "../config/ui";
import { parseAmountStrict } from "../utils/amount";
import type { PreflightAction } from "../types/dashboard";

/**
 * Runs a confirmation step before opening the wallet: we validate amount, balances, and network
 * so the user sees a clear summary and can fix issues (e.g. wrong network) before signing.
 */
export function usePreflight(params: {
  actions: {
    supply: (amountText: string) => Promise<void>;
    withdraw: (amountText: string) => Promise<void>;
    borrow: (amountText: string) => Promise<void>;
    repay: (amountText: string) => Promise<void>;
  };
  dashboard: {
    data?: {
      usd8Balance?: bigint;
      position?: { maxWithdraw?: bigint; maxBorrow?: bigint; borrowed?: bigint };
    };
    contracts?: { usd8?: unknown };
  };
  wallet: { account?: string; chainId?: number };
  usd8Decimals: number;
  approveMode: "exact" | "infinite";
  isCorrectNetwork: boolean;
  currentDeployments?: Deployments | null;
}) {
  const { actions, dashboard, wallet, usd8Decimals, approveMode, isCorrectNetwork, currentDeployments } = params;

  const [preflight, setPreflight] = useState<
    | {
        action: PreflightAction;
        amountText: string;
        snapshot: {
          account?: string;
          chainId?: number;
          approveMode: "exact" | "infinite";
          token: string;
          spender: string;
        };
      }
    | undefined
  >(undefined);
  const [preflightError, setPreflightError] = useState<string | undefined>(undefined);
  const [preflightSubmitting, setPreflightSubmitting] = useState(false);

  const openPreflight = (action: PreflightAction, amountText: string) => {
    if (!currentDeployments) return;
    setPreflightError(undefined);
    setPreflight({
      action,
      amountText,
      snapshot: {
        account: wallet.account,
        chainId: wallet.chainId,
        approveMode,
        token: currentDeployments.usd8Address,
        spender: currentDeployments.simpleLendingAddress,
      },
    });
  };

  const closePreflight = () => {
    setPreflight(undefined);
    setPreflightError(undefined);
    setPreflightSubmitting(false);
  };

  const confirmPreflight = async () => {
    if (!preflight) return;
    const { action, amountText, snapshot } = preflight;

    if (preflightSubmitting) return;
    setPreflightSubmitting(true);
    try {
      const parsed = parseAmountStrict(amountText, usd8Decimals);
      if (!parsed.ok) {
        setPreflightError(parsed.error);
        return;
      }

      if (wallet.account !== snapshot.account || wallet.chainId !== snapshot.chainId) {
        setPreflightError(preflightErrorWalletOrNetworkChanged);
        return;
      }
      if (approveMode !== snapshot.approveMode) {
        setPreflightError(preflightErrorApprovalModeChanged);
        return;
      }
      if (!isCorrectNetwork) {
        setPreflightError(preflightErrorWrongNetwork);
        return;
      }

      const amountWei = parsed.value;
      const dash = dashboard.data;
      const usd8Bal = dash?.usd8Balance;
      const maxWithdraw = dash?.position?.maxWithdraw;
      const maxBorrow = dash?.position?.maxBorrow;
      const borrowed = dash?.position?.borrowed;

      const failIf = (cond: boolean, msg: string) => {
        if (!cond) return false;
        setPreflightError(msg);
        return true;
      };

      if (action === "Supply") {
        if (usd8Bal !== undefined && failIf(usd8Bal < amountWei, preflightErrorInsufficientUsd8Balance)) return;
      }

      if (action === "Repay") {
        if (borrowed !== undefined && failIf(amountWei > borrowed, preflightErrorRepayExceedsBorrowed)) return;
        if (usd8Bal !== undefined && failIf(usd8Bal < amountWei, preflightErrorInsufficientUsd8Balance)) return;
      }

      if (action === "Withdraw") {
        if (maxWithdraw !== undefined && failIf(amountWei > maxWithdraw, preflightErrorAmountExceedsMaxWithdrawable)) return;
        try {
          const token = dashboard.contracts?.usd8 as { balanceOf: (addr: string) => Promise<bigint> } | undefined;
          if (token?.balanceOf && currentDeployments) {
            const liq = await token.balanceOf(currentDeployments.simpleLendingAddress);
            if (failIf(liq < amountWei, preflightErrorInsufficientPoolLiquidity)) return;
          }
        } catch {
          // ignore
        }
      }

      if (action === "Borrow") {
        if (maxBorrow !== undefined && failIf(amountWei > maxBorrow, preflightErrorAmountExceedsMaxBorrowable)) return;
        try {
          const token = dashboard.contracts?.usd8 as { balanceOf: (addr: string) => Promise<bigint> } | undefined;
          if (token?.balanceOf && currentDeployments) {
            const liq = await token.balanceOf(currentDeployments.simpleLendingAddress);
            if (failIf(liq < amountWei, preflightErrorInsufficientPoolLiquidity)) return;
          }
        } catch {
          // ignore
        }
      }

      closePreflight();
      if (action === "Supply") return void actions.supply(amountText);
      if (action === "Withdraw") return void actions.withdraw(amountText);
      if (action === "Borrow") return void actions.borrow(amountText);
      return void actions.repay(amountText);
    } finally {
      setPreflightSubmitting(false);
    }
  };

  return {
    preflight,
    preflightError,
    preflightSubmitting,
    openPreflight,
    closePreflight,
    confirmPreflight,
  };
}
