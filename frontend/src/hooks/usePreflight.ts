import { useState, useEffect, useRef, useMemo } from "react";
import type { Deployments } from "../contracts/deployments";
import type { BrowserProvider } from "ethers";
import { PREFLIGHT_GAS_ESTIMATE_TIMEOUT_MS, PREFLIGHT_GAS_DEBOUNCE_MS } from "../config/runtime";
import { useDebounce } from "./useDebounce";
import {
  preflightErrorWalletOrNetworkChanged,
  preflightErrorApprovalModeChanged,
  preflightErrorWrongNetwork,
  preflightErrorRpcUnreachable,
  preflightErrorInsufficientUsd8Balance,
  preflightErrorRepayExceedsBorrowed,
  preflightErrorAmountExceedsMaxWithdrawable,
  preflightErrorInsufficientPoolLiquidity,
  preflightErrorAmountExceedsMaxBorrowable,
  preflightErrorNetworkMismatch,
  preflightErrorPoolPaused,
  preflightErrorNoCollateralForBorrow,
} from "../config/ui";
import { parseAmountStrict } from "../utils/amount";
import { logRpcError } from "../utils/rpcErrorLog";
import type { PreflightAction } from "../types/dashboard";
import { append as appendSessionEvidence } from "../state/sessionEvidence";
import { computePreflightImpact, type PreflightImpact } from "../utils/preflightImpact";
import { formatHealthFactorForDisplay, formatBorrowUsagePercent } from "../utils/format";
import { formatUnits } from "ethers";

export type GasEstimateResult = {
  estimatedGas?: string | number;
  estimatedFee?: string;
  simulationFailed?: boolean;
  simulationFailedPolicy?: "block" | "warn_allow";
};

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
      position?: {
        supplied?: bigint;
        borrowed?: bigint;
        collateralValue?: bigint;
        healthFactor?: bigint;
        maxWithdraw?: bigint;
        maxBorrow?: bigint;
      };
    };
    contracts?: { usd8?: unknown; lending?: unknown };
  };
  wallet: { account?: string; chainId?: number; rpcStatus?: { rpcUrlInUse?: string } };
  usd8Decimals: number;
  approveMode: "exact" | "infinite";
  isCorrectNetwork: boolean;
  currentDeployments?: Deployments | null;
  reserveRiskParams?: { ltPct: number; ltvPct: number } | null;
  formatToken: (v: bigint | undefined, decimals: number) => string;
  provider?: BrowserProvider;
  isMainnet?: boolean;
  contractsAudited?: boolean;
  runtimeRiskTier?: "low" | "medium" | "high";
  /** When true (readChainId !== walletChainId on 31337), block confirm and show error. */
  writesDisabledByMismatch?: boolean;
  /** Called right before opening the wallet (after preflight close). Use to e.g. show a toast. */
  onBeforeOpenWallet?: () => void;
}) {
  const {
    actions,
    dashboard,
    wallet,
    usd8Decimals,
    approveMode,
    isCorrectNetwork,
    currentDeployments,
    reserveRiskParams,
    formatToken,
    provider,
    isMainnet,
    contractsAudited,
    runtimeRiskTier,
    writesDisabledByMismatch,
    onBeforeOpenWallet,
  } = params;

  const simulationFailedPolicy: "block" | "warn_allow" =
    (isMainnet && !contractsAudited) || runtimeRiskTier === "high" ? "block" : "warn_allow";

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
        impact?: PreflightImpact | null;
        gasEstimate?: GasEstimateResult;
      }
    | undefined
  >(undefined);
  const [preflightError, setPreflightError] = useState<string | undefined>(undefined);
  const [preflightSubmitting, setPreflightSubmitting] = useState(false);
  const gasRequestIdRef = useRef(0);
  const gasTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preflightRef = useRef(preflight);
  preflightRef.current = preflight;

  const debouncedAmountText = useDebounce(preflight?.amountText ?? "", PREFLIGHT_GAS_DEBOUNCE_MS);
  const preflightKey = useMemo(
    () =>
      preflight
        ? JSON.stringify({
            action: preflight.action,
            amountText: debouncedAmountText,
            chainId: wallet.chainId,
            rpcUrlInUse: wallet.rpcStatus?.rpcUrlInUse,
          })
        : "",
    [preflight, debouncedAmountText, wallet.chainId, wallet.rpcStatus?.rpcUrlInUse]
  );

  const openPreflight = (action: PreflightAction, amountText: string) => {
    if (!currentDeployments) return;
    setPreflightError(undefined);
    appendSessionEvidence("PreflightOpen", { action, amountNormalized: amountText });
    const parsed = parseAmountStrict(amountText, usd8Decimals);
    const amountWei = parsed.ok ? parsed.value : 0n;
    const pos = dashboard.data?.position;
    let impact: PreflightImpact | null = null;
    if (reserveRiskParams && pos && pos.supplied !== undefined && pos.borrowed !== undefined && pos.collateralValue !== undefined && pos.healthFactor !== undefined && pos.maxBorrow !== undefined && amountWei > 0n) {
      impact = computePreflightImpact(
        action,
        amountWei,
        {
          supplied: pos.supplied,
          borrowed: pos.borrowed,
          collateralValue: pos.collateralValue,
          healthFactor: pos.healthFactor,
          maxBorrow: pos.maxBorrow,
          maxBorrowable: pos.borrowed + pos.maxBorrow,
        },
        reserveRiskParams.ltPct,
        reserveRiskParams.ltvPct,
        formatHealthFactorForDisplay,
        (n) => formatBorrowUsagePercent(Math.max(0, Math.min(100, n))),
        (v) => formatToken(v, 8),
      );
    }
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
      impact: impact ?? undefined,
    });
  };

  useEffect(() => {
    const p = preflightRef.current;
    if (!preflightKey || !p || !provider || !wallet.account || !dashboard.contracts?.lending) return;
    const parsed = parseAmountStrict(debouncedAmountText, usd8Decimals);
    if (!parsed.ok || parsed.value === 0n) return;

    const myRequestId = ++gasRequestIdRef.current;
    const timeoutMs = PREFLIGHT_GAS_ESTIMATE_TIMEOUT_MS;

    const run = async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        gasTimeoutIdRef.current = setTimeout(() => reject(new Error("GAS_ESTIMATE_TIMEOUT")), timeoutMs);
      });
      try {
        const signer = await provider.getSigner(wallet.account!);
        const lendingWithSigner = (dashboard.contracts!.lending as { connect: (s: unknown) => { getFunction: (name: string) => { estimateGas: (a: bigint) => Promise<bigint> } } }).connect(signer);
        const amountWei = parsed.value;
        const fn = lendingWithSigner.getFunction(
          p.action === "Supply" ? "supply" : p.action === "Withdraw" ? "withdraw" : p.action === "Borrow" ? "borrow" : "repay"
        );
        const gasLimit = await Promise.race([
          (fn as { estimateGas: (a: bigint) => Promise<bigint> }).estimateGas(amountWei),
          timeoutPromise,
        ]);
        if (gasRequestIdRef.current !== myRequestId) return;
        const feeData = await Promise.race([
          provider.getFeeData(),
          timeoutPromise,
        ]);
        if (gasRequestIdRef.current !== myRequestId) return;
        const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;
        const feeWei = gasLimit * gasPrice;
        const feeFormatted = feeWei > 0n ? formatUnits(feeWei, 18).slice(0, 8) + " ETH" : undefined;
        setPreflight((prev) =>
          prev ? { ...prev, gasEstimate: { estimatedGas: String(gasLimit), estimatedFee: feeFormatted, simulationFailedPolicy } } : prev
        );
      } catch (e) {
        if (gasRequestIdRef.current !== myRequestId) return;
        logRpcError("preflight.estimateGas", e);
        setPreflight((prev) =>
          prev ? { ...prev, gasEstimate: { simulationFailed: true, simulationFailedPolicy } } : prev
        );
      }
    };
    void run();
    return () => {
      if (gasTimeoutIdRef.current != null) {
        clearTimeout(gasTimeoutIdRef.current);
        gasTimeoutIdRef.current = null;
      }
    };
  }, [
    preflightKey,
    debouncedAmountText,
    provider,
    dashboard.contracts,
    wallet.account,
    usd8Decimals,
    simulationFailedPolicy,
  ]);

  const closePreflight = () => {
    setPreflight(undefined);
    setPreflightError(undefined);
    setPreflightSubmitting(false);
  };

  const confirmPreflight = async () => {
    if (!preflight) return;
    const { action, amountText, snapshot } = preflight;

    if (preflightSubmitting) return;
    if (writesDisabledByMismatch) {
      setPreflightError(preflightErrorNetworkMismatch);
      return;
    }
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

      const lending = dashboard.contracts?.lending as { paused?: () => Promise<boolean> } | undefined;
      if (lending?.paused) {
        try {
          const paused = await lending.paused();
          if (failIf(!!paused, preflightErrorPoolPaused)) return;
        } catch {
          // ignore
        }
      }

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
        const supplied = dash?.position?.supplied ?? 0n;
        if (failIf(supplied === 0n, preflightErrorNoCollateralForBorrow)) return;
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

      if (provider) {
        try {
          await provider.getBlockNumber();
        } catch (e) {
          logRpcError("preflight.preSendCheck", e);
          setPreflightError(preflightErrorRpcUnreachable);
          return;
        }
      }

      closePreflight();
      try {
        if (typeof window !== "undefined") window.focus();
      } catch {
        /* ignore */
      }
      onBeforeOpenWallet?.();
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
