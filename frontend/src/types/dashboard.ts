/**
 * Stage-zero types: component Props and Hook boundaries.
 * Single file: frontend/src/types/dashboard.ts (do not split).
 */

import type { TxState } from "../state/tx";

export type PreflightAction = "Supply" | "Withdraw" | "Borrow" | "Repay";

export interface AddressDisplayProps {
  label: string;
  address: string | undefined;
  /** Optional chainId for block explorer link. */
  chainId?: number;
}

export type Theme = "light" | "dark" | "dark-navy";

export interface HeaderProps {
  appName: string;
  /** Optional header logo (emoji or single character). */
  appLogo?: string;
  theme: Theme;
  onThemeToggle: () => void;
  connecting?: boolean;
  wallet: {
    account?: string;
    chainId?: number;
    provider?: unknown;
    connect: () => void;
    ensureCorrectNetwork: () => void;
    isMetaMaskAvailable: boolean;
    error?: string;
  };
  expectedChainId: number;
  chainName: string;
  onConnect: () => void;
  onDisconnect?: () => void;
  onSwitchNetwork: () => void;
  usd8Balance?: bigint;
  wethBalance?: bigint;
}

export interface PoolOverviewProps {
  totalSupply: string | bigint;
  totalBorrow: string | bigint;
  utilization: string | bigint;
  supplyRate: string | bigint;
  borrowRate: string | bigint;
  formatToken?: (v: bigint, decimals: number) => string;
  formatPercent?: (v: bigint) => string;
  /** Optional pool asset symbol for unit hint (e.g. "Pool totals (USD8)"). */
  symbol?: string;
}

export interface UserPositionProps {
  supplied: string | bigint;
  borrowed: string | bigint;
  healthFactor: string | bigint;
  maxWithdraw: string | bigint;
  maxBorrow: string | bigint;
  healthColor?: string;
  /** Token decimals from ERC20.decimals() (e.g. USD8). Used for supplied/borrowed/maxWithdraw/maxBorrow display; no minimum clamp. */
  tokenDecimals?: number;
  formatToken?: (v: bigint, decimals: number) => string;
  formatPercent?: (v: bigint) => string;
}

export interface ActionCardProps {
  type: PreflightAction;
  value: string;
  onChange: (value: string) => void;
  onMax: () => void;
  onSubmit: () => void;
  disabled: boolean;
  maxButtonDisabled?: boolean;
  actionDisabledReason: string | undefined;
  allowanceStatus?: { loading: boolean; sufficient: boolean | undefined; value?: string; error?: string };
  symbol: string;
  decimals: number;
  placeholder?: string;
  /** Amount input title/tooltip (e.g. decimals hint). */
  inputTitle?: string;
  parsedError?: string;
  helpText?: string;
  /** Primary button label when approve is needed first (e.g. "Approve USD8" on Supply card). */
  submitButtonLabel?: string;
  /** Card hint text (e.g. Borrow lowers health factor). */
  cardHint?: string;
  /** Card DOM id for scroll-into-view from empty-state CTA. */
  cardId?: string;
  /** When true, primary button shows spinner during tx. */
  submitBusy?: boolean;
}

export interface TxStatusProps {
  tx: TxState;
  setTx: (next: TxState) => void;
  stageText: string;
  stageClass: string;
  stepText: string | undefined;
  hintText: string | undefined;
  /** When Signing exceeds 10s without hash: hint to check MetaMask popup/pending + troubleshooting link. */
  signingPendingHint?: { text: string; troubleshootingLabel: string };
  errorTitle: string | undefined;
  elapsed: string;
  onCopyHash: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onRefreshPending: () => void;
  onClearPending: () => void;
  timingText?: string;
  disableRefreshClear?: boolean;
  lifecycleSteps?: Array<{ step: string; state: string; label: string; sublabel?: string }>;
  confirmedInText?: string;
  confirmedInHintText?: string;
  blockConfirmationsText?: string;
  suggestion?: string;
  /** Optional context for "Copy tx debug" bundle (chainId, rpcTier, version, etc.). */
  debugContext?: {
    chainId?: number;
    rpcTier?: string;
    version?: string;
    configFingerprint?: string;
    sessionId?: string;
    gasEstimate?: unknown;
    feeData?: unknown;
  };
}

export type DashboardInputs = { supply: string; withdraw: string; borrow: string; repay: string };

/** useDashboardForm return shape (minimal for App composition) */
export interface UseDashboardFormReturn {
  inputs: DashboardInputs;
  setInputs: (updater: DashboardInputs | ((prev: DashboardInputs) => DashboardInputs)) => void;
  parsed: {
    supply?: { ok: boolean; value?: bigint; error?: string };
    withdraw?: { ok: boolean; value?: bigint; error?: string };
    borrow?: { ok: boolean; value?: bigint; error?: string };
    repay?: { ok: boolean; value?: bigint; error?: string };
  };
  canSupply: boolean;
  canWithdraw: boolean;
  canBorrow: boolean;
  canRepay: boolean;
  actionDisabledReason: (action: PreflightAction, args: { rawInput: string; parsed?: { ok: boolean; error?: string } }) => string | undefined;
  formatToken: (v: bigint | undefined, decimals: number) => string;
  formatPercent: (v: bigint | undefined) => string;
  onUseMaxSupply: () => void;
  onUseMaxWithdraw: () => void;
  onUseMaxBorrow: () => void;
  onUseMaxRepay: () => void;
}

/** useTxDisplay return shape */
export interface UseTxDisplayReturn {
  stageText: string;
  stageClass: string;
  stepText: string | undefined;
  hintText: string | undefined;
  signingPendingHint?: { text: string; troubleshootingLabel: string };
  errorTitle: string | undefined;
  elapsed: string;
  timingText: string;
  onCopyHash: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onRefreshPending: () => void;
  onClearPending: () => void;
}

/** usePreflight return shape */
export interface UsePreflightReturn {
  preflight: {
    action: PreflightAction;
    amountText: string;
    snapshot: { account?: string; chainId?: number; approveMode: "exact" | "infinite"; token: string; spender: string };
  } | undefined;
  preflightError: string | undefined;
  preflightSubmitting: boolean;
  openPreflight: (action: PreflightAction, amountText: string) => void;
  closePreflight: () => void;
  confirmPreflight: () => Promise<void>;
}
