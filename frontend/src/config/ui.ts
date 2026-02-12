/**
 * Single source for all UI copy: app name, chain label, placeholders, buttons, and error messages.
 * Components read from here (or via props) so we never scatter hardcoded strings.
 */

import { EXPECTED_CHAIN_NAME } from "./network";

export const appName = "Lending Dashboard";
/** Optional header logo (emoji or single char); if empty, only appName is shown. Default placeholder. */
export const appLogo = "◆";

/** Chain display name; value from config/network or deployments (do not hardcode). */
export const chainName = EXPECTED_CHAIN_NAME;

export const emptyPlaceholder = "—";

export const connectWallet = "Connect wallet";
/** Shown as tooltip on Connect button: if picker does not appear, disconnect site in MetaMask first. */
export const connectWalletHint =
  "To choose a different account, disconnect this site in MetaMask (Settings → Connected sites), then click Connect again.";
export const connected = "Connected";
export const disconnectWallet = "Disconnect";
export const wrongNetwork = "Wrong network";
export const switchNetwork = "Switch network";
/** Shown when wallet is connected but chain is not in supported list (multi-chain). */
export const unsupportedNetworkBanner =
  "This network is not supported. Please switch to a supported chain (e.g. Hardhat Local or the chain you deployed to).";
/** Shown on local chain (31337): if balances in MetaMask don't match the page after restarting the node, reset the account. */
export const localChainResetAccountHint =
  "Using local network. If you restarted the node and MetaMask shows wrong balances, go to MetaMask → Settings → Advanced → Reset account for this network.";
export const installMetaMask = "Install MetaMask";
export const supply = "Supply";
export const withdraw = "Withdraw";
export const borrow = "Borrow";
export const repay = "Repay";
export const actionsSectionTitle = "Actions";
export const refresh = "Refresh";
/** Auto-refresh toggle label. */
export const autoRefreshLabel = "Auto refresh";
export const autoRefreshOn = "On";
export const autoRefreshOff = "Off";
export const max = "Max";
export const approve = "Approve";
export const allowanceColon = "Allowance: ";
export const sufficientLabel = "Sufficient";
export const needsApproveLabel = "Needs approve";
export const blockedPrefix = "Blocked: ";
export const dismiss = "Dismiss";
export const copy = "Copy";
export const copied = "Copied";
export const show = "Show";
export const hide = "Hide";
/** Block explorer link label. */
export const viewOnExplorerLabel = "View on explorer";
export const details = "Details";
export const hideDetails = "Hide details";
export const confirm = "Confirm";
export const cancel = "Cancel";
export const metaMaskMissing = "MetaMask missing";
export const metaMaskNotDetected = "MetaMask not detected";
export const metaMaskBannerBody = "Install or enable MetaMask, then refresh this page to connect.";
export const getMetaMask = "Get MetaMask";
export const refreshing = "Refreshing…";
export const copyHash = "Copy hash";

/** Status / section labels */
export const dataLabel = "Data";
export const updatedLabel = "Updated";
export const blockLabel = "Block";
export const actionsDisabled = "Actions disabled";
export const balancesTitle = "Balances";
export const connectWalletToLoadBalances = "Connect wallet to load balances";
/** Shown in balance card when connected but data failed to load (e.g. node restarted, redeploy needed). */
export const balancesLoadFailedHint =
  "Balances not loaded. Start the node, run the deploy script (e.g. npx hardhat run scripts/deploy.ts --network localhost), then click Refresh.";
export const loading = "Loading…";
export const poolTitle = "Pool";
/** Pool overview list item labels (PoolOverview). */
export const poolTotalSupplyLabel = "totalSupply";
export const poolTotalBorrowLabel = "totalBorrow";
export const poolUtilizationRateLabel = "utilizationRate";
export const poolSupplyRateLabel = "supplyRate";
export const poolBorrowRateLabel = "borrowRate";

export const userPositionTitle = "User Position";
/** User position list item labels (UserPosition). */
export const positionSuppliedLabel = "supplied";
export const positionBorrowedLabel = "borrowed";
export const positionHealthFactorLabel = "healthFactor";
export const positionMaxWithdrawLabel = "maxWithdraw";
export const positionMaxBorrowLabel = "maxBorrow";
export const dashboardTitle = "Dashboard (Part 2)";
export const connectionLabel = "Connection";
export const networkLabel = "Network";
/** Header: pill when chain matches expected (e.g. "OK"). */
export const networkOkLabel = "OK";
/** Header pill tooltip when network matches expected chain. */
export const networkOkTitle = "Network matches expected chain. Connection OK.";
export const accountLabel = "Account";
export const expectedLabel = "expected";

/** Health factor term tooltip (title attribute) for new users. */
export const healthFactorTooltip = "Health factor: ratio of collateral to debt. Below 1 may trigger liquidation.";
/** Short hint for health factor thresholds (HF > 1.0 safe, ≤1.0 risky). */
export const healthFactorThresholdHint = "HF > 1.0 safe, ≤1.0 risky.";
/** HF threshold legend — Warning (orange), Aave-style. */
export const healthFactorWarnThresholdLabel = "< 2.0 Warning";
/** HF threshold legend — Danger (red), Aave-style. */
export const healthFactorDangerThresholdLabel = "< 1.0 Danger";
export const allowanceTooltip = "ERC20 allowance: how much the lending contract can spend from your wallet for this token.";
export const utilizationRateTooltip = "Pool utilization: total borrowed / total supplied.";
/** DeFi core metric tooltip: supply APY. */
export const supplyRateTooltip = "Current supply APY: annualized interest earned on supplied assets.";
export const borrowRateTooltip = "Current borrow APY: annualized interest paid on borrowed assets.";
export const maxWithdrawTooltip = "Maximum amount you can withdraw without making your position unhealthy.";

/** Short action hint when health factor is in danger. */
export const healthFactorCriticalHint = "Add collateral or repay debt to improve your health factor.";

/** Empty-state hints when pool/position are zero. */
export const poolEmptyHint = "No supply or borrow yet. Supply assets to start.";
export const positionEmptyHint = "You have no supply or borrow. Supply or borrow to see position.";
/** Empty-state CTA label; scrolls to Supply card. */
export const poolEmptyCtaLabel = "Start by supplying USD8";
export const positionEmptyCtaLabel = "Start by supplying USD8";
/** Risk hint before Borrow (borrowing lowers health factor). */
export const borrowHfWarning = "Borrowing will lower your health factor.";
/** Risk hint before Withdraw (withdrawing may lower health factor). */
export const withdrawHfWarning = "Withdrawing may lower your health factor.";

/** Warning icon before enterprise notice (use aria-hidden for a11y). */
export const enterpriseNoticeWarningChar = "⚠";

/** P2.1 Theme toggle (no hardcoding in Header). P4: three-way cycle Light → Dark → Navy → Light. */
export const themeLightLabel = "Light";
export const themeDarkLabel = "Dark";
export const themeNavyLabel = "Navy";

export function themeToggleTitle(currentThemeLabel: string, nextThemeLabel: string): string {
  return `Current theme: ${currentThemeLabel}. Click to switch to ${nextThemeLabel}.`;
}

/** P2.2.2 Health factor status text (accessibility: not color-only). */
export const healthFactorStatusHealthy = "Healthy";
export const healthFactorStatusWarning = "At risk";
export const healthFactorStatusDanger = "Critical";
export const healthFactorStatusInfinite = "No debt";

/** P2.3.1 Loading: connect button. */
export const connectingLabel = "Connecting…";

/** Preflight modal */
export const confirmPreflightTitle = "Confirm transaction (pre-wallet)";
export const closeLabel = "Close";
export const actionLabel = "Action";
export const amountLabel = "Amount";
/** Amount input placeholder (user-friendly, not raw "18 decimals"). */
export const amountPlaceholder = "0.00";
/** Amount input title/tooltip for decimals limit. */
export const amountDecimalsTooltip = "Amount (max 18 decimal places)";
/** For input placeholder e.g. "Amount (18 decimals)". */
export const decimalsLabel = "decimals";

/** ActionCard helpText prefixes (ActionCardsGrid). */
export const helpAvailablePrefix = "Available: ";
export const helpMaxWithdrawablePrefix = "Max withdrawable (safe): ";
export const helpMaxBorrowablePrefix = "Max borrowable (safe): ";
export const helpBorrowedPrefix = "Borrowed: ";
export const chainIdLabel = "ChainId";
export const tokenLabel = "Token";
export const spenderLabel = "Spender";
export const approvalLabel = "Approval";
export const exactLabel = "Exact";
export const infiniteLabel = "Infinite";
export const preflightChecking = "Checking feasibility and liquidity…";
export const confirmAndOpenWallet = "Confirm & open wallet";
export const checkingLabel = "Checking…";
export const enterpriseNotePreflight = "Enterprise note: this summary makes the target addresses and allowance mode explicit before any wallet prompt.";
/** Preflight step hint (what to do next). */
export const preflightStepHint = "Step 1: Confirm below → Step 2: Confirm in wallet";
/** Preflight transaction overview block title (Aave-style). */
export const transactionOverviewTitle = "Transaction overview";
export const supplyApyLabel = "Supply APY";
export const borrowApyLabel = "Borrow APY";
export const collateralizationLabel = "Collateralization";
export const collateralizationNa = "N/A";
/** Preflight approval hint: "(may prompt Approve → " + action + ")". */
export const preflightMayPromptTemplate = "(may prompt Approve → ";

/** TxStatus */
export const stillPendingOnNetwork = "Still pending on network";
export const txStuckHint = "This tx may be dropped, replaced (sped up), or delayed by the RPC. Use \"Refresh status\" to re-check, or \"Clear pending\" to remove the local pending entry.";
export const refreshStatus = "Refresh status";
export const clearPending = "Clear pending";
export const postStateLabel = "post-state";
export const stageLabel = "stage";
export const labelLabel = "label";
export const hashLabel = "hash";
export const rawLabel = "raw";
export const postStateNoteLabel = "post-state note";
/** useActions: note when post-state is unverified (RPC lag). */
export const postStateUnverifiedNote = "RPC reads may be lagging; use Refresh to re-check";
export const elapsedLabel = "elapsed: ";
export const errorKindLabel = "error.kind";
export const errorCodeLabel = "error.code";
export const txLabelPrefix = "Tx: ";

/** Approve toolbar */
export const approvalModeLabel = "Approval mode";
export const exactSafer = "Exact (safer)";
export const infiniteConvenience = "Infinite (convenience)";
/** Enterprise notice title (security warning). */
export const enterpriseNoticeTitle = "Security warning";
export const enterpriseNoteInfiniteApproval = "Security warning: infinite approval increases exposure if the lending contract is compromised.";

/** Error titles for TxStatus; must match state/errors.ts AppError.kind. */
export const errorTitles: Record<
  | "UserRejected"
  | "NetworkMismatch"
  | "Revert"
  | "Rpc"
  | "InsufficientBalance"
  | "InsufficientAllowance"
  | "Validation"
  | "Unknown",
  string
> = {
  UserRejected: "User rejected",
  NetworkMismatch: "Wrong network",
  Revert: "Transaction reverted",
  Rpc: "Network error",
  InsufficientBalance: "Insufficient balance",
  InsufficientAllowance: "Insufficient allowance",
  Validation: "Validation failed",
  Unknown: "Unknown error",
};

/** Fallback when tx error kind is not in errorTitles. */
export const txFailedFallback = "Transaction failed";

/** Action disabled reasons (useDashboardForm actionDisabledReason). */
export const actionReasonMetaMaskNotDetected = "MetaMask not detected";
export const actionReasonConnectWallet = "Connect MetaMask to enable actions";
/** Single banner above Actions when wallet not connected; hidden after connect. */
export const actionsConnectWalletBanner = "Please connect your MetaMask wallet to enable transactions.";
/** Template: use {chainId} placeholder, replace with deployments.chainId. */
export const actionReasonWrongNetworkTemplate = "Wrong network. Switch to chainId {chainId}";
export const actionReasonLoadingContracts = "Loading contracts…";
export const actionReasonTxInProgress = "Transaction in progress";
export const actionReasonEnterAmount = "Enter an amount";
export const actionReasonInvalidAmount = "Invalid amount";
/** Reason when action is not executable (no withdrawable / no capacity / no debt). */
export const actionReasonNoWithdrawable = "No funds to withdraw";
export const actionReasonNoBorrowable = "No borrow capacity";
export const actionReasonNoDebtToRepay = "No debt to repay";

/** parseAmountStrict / ValidationError messages (utils/amount). */
export const amountErrorRequired = "Amount is required";
export const amountErrorScientificNotation = "Scientific notation is not allowed";
export const amountErrorSeparators = "Separators are not allowed";
export const amountErrorMustBePositive = "Amount must be positive";
export const amountErrorInvalidFormat = "Invalid amount format";
/** Template: use {max} placeholder for decimals. */
export const amountErrorTooManyDecimalsTemplate = "Too many decimal places (max {max})";
export const amountErrorMustBeGreaterThanZero = "Amount must be greater than 0";
export const amountErrorInvalidAmount = "Invalid amount";

/** App error section prefixes. */
export const walletErrorPrefix = "Wallet error: ";
export const dashboardErrorPrefix = "Dashboard error: ";

/** Contract/address labels (meta grid, preflight). */
export const usd8Label = "USD8";
export const wethLabel = "WETH";
export const simpleLendingLabel = "SimpleLending";
/** Bottom contracts section collapsible block label. */
export const contractsSectionLabel = "Contracts";
/** Short hint when no amount entered in action area (optional). */
export const actionEnterAmountHint = "Enter amount above to enable.";

/** Default symbol when useTokenMetadata returns no symbol. */
export const defaultSymbol = "USD8";
/** Display convention: amount as "value + space + symbol" (e.g. 10000 USD8); align with helpText and card titles. */

/** Preflight modal setPreflightError messages. */
export const preflightErrorWalletOrNetworkChanged = "Wallet account or network changed. Please review and confirm again.";
export const preflightErrorApprovalModeChanged = "Approval mode changed. Please review and confirm again.";
export const preflightErrorWrongNetwork = "Wrong network. Please switch to the expected chain and try again.";
export const preflightErrorInsufficientUsd8Balance = "Insufficient USD8 balance.";
export const preflightErrorRepayExceedsBorrowed = "Repay amount exceeds your borrowed amount.";
export const preflightErrorAmountExceedsMaxWithdrawable = "Amount exceeds max withdrawable.";
export const preflightErrorInsufficientPoolLiquidity = "Insufficient pool liquidity.";
export const preflightErrorAmountExceedsMaxBorrowable = "Amount exceeds max borrowable.";

/** TxStatus stage text (useTxDisplay). */
export const stageTextSigning = "Wallet confirmation";
export const stageTextPending = "Pending (on-chain)";
export const stageTextStuck = "Pending (taking longer)";
export const stageTextConfirmed = "Confirmed";
export const stageTextFailed = "Failed";

/** TxStatus hint text by stage (useTxDisplay). */
export const hintTextSigning = "Review the details in MetaMask, then confirm.";
export const hintTextPending = "Transaction sent. Waiting for confirmation…";
export const hintTextStuck = "Still pending. Use \"Refresh status\" to re-check, or \"Clear pending\" to remove the local pending entry.";
export const hintTextConfirmed = "Confirmed. Post-state verification runs in the background.";
/** Shown when tx is confirmed: where to see the result (Pool + User Position cards below). */
export const txConfirmedPositionHint = "Your position and pool data have been updated in the cards below.";
export const hintTextFailed = "No changes were confirmed. Review the error and try again.";
export const hintTextUserRejected = "No changes were made (you rejected the wallet prompt).";

/** TxStatus step text building (useTxDisplay). */
export const stepPrefix1of2 = "Step 1/2 — ";
export const stepPrefix2of2 = "Step 2/2 — ";
export const stepPrefix1of3 = "Step 1/3 — ";
export const stepPrefix2of3 = "Step 2/3 — ";
export const stepPrefix3of3 = "Step 3/3 — ";
export const stepLabelResetAllowance = "Reset allowance";
export const stepLabelApproveToken = "Approve token";

/** Tx label for approve flow (useActions); stepText matching uses these. */
export const approveLabelUsd8 = "Approve USD8";
export const approveLabelUsd8Reset = "Approve USD8 (reset)";

/** useActions throw/fail messages (user-facing when surfaced). */
export const errorWalletNotConnected = "Wallet not connected";
export const errorTxAlreadyInProgress = "A transaction is already in progress for this action";
export const errorInsufficientLiquidity = "Insufficient liquidity";
export const errorUserRejectedRequest = "User rejected the request";

/** useWallet / useDashboard (user-facing). */
export const errorMetaMaskNotFound = "MetaMask not found";
/** Template: use {chainId} placeholder. */
export const errorChainNotAddedTemplate = "Chain {chainId} is not added in MetaMask. Add it manually (or set VITE_AUTO_ADD_CHAIN=true) and try again.";
/** Template: use {expected} and {got} placeholders. */
export const errorWrongNetworkExpectedGotTemplate = "Wrong network. Expected chainId {expected}, got {got}.";
/** Dev/config: missing RPC URL for auto-add chain. */
export const errorMissingLocalRpcUrl = "Missing VITE_LOCAL_RPC_URL. Configure it (and optionally VITE_AUTO_ADD_CHAIN=true) to allow auto-adding the chain in MetaMask.";

/** state/errors rewriteMessage (normalized user-facing messages); use {expected},{got} for wrong-network. */
export const errorExceedsBorrowingLimit = "Exceeds borrowing limit.";
export const errorWithdrawalUnhealthy = "Withdrawal would make the position unhealthy.";
export const errorInsufficientPoolLiquidity = "Insufficient pool liquidity.";
export const errorInsufficientSuppliedAmount = "Insufficient supplied amount.";
export const errorRepayExceedsBorrowed = "Repay amount exceeds borrowed amount.";
export const errorAmountMustBeGreaterThanZero = "Amount must be greater than 0.";
export const errorInsufficientAllowanceApproveFirst = "Insufficient allowance. Please approve first.";
export const errorInsufficientTokenBalance = "Insufficient token balance.";
export const errorTransactionReverted = "Transaction reverted.";
/** Dashboard read failed (missing revert data): often means contract not deployed or wrong network. */
export const errorDashboardContractReadFailed =
  "Contract read failed. Ensure the lending contract is deployed on this network (e.g. run deploy script with --network localhost).";
export const errorRpcNetworkCheckNode = "RPC/network error. Check your node and try again.";
export const unknownErrorFallback = "Unknown error";

/** ErrorBoundary (user-facing). */
export const errorBoundaryTitle = "Something went wrong";
export const errorBoundaryBody = "A rendering error occurred. The safest recovery is to reload.";
export const reloadLabel = "Reload";

/** PreflightAction / approveMode value (for comparison, not display). */
export const approveModeValueInfinite = "infinite";

/** Tx hash display: number of leading chars to show (e.g. 10 → "0x1234…5678"). */
export const txHashDisplayChars = 10;

/** MetaMask install / help URL (e.g. open in new tab when wallet not installed). */
export const metaMaskInstallUrl = "https://metamask.io";

/** shortAddress(): prefix length (e.g. 6 → "0x1234…"). */
export const shortAddressPrefixLen = 6;
/** shortAddress(): suffix length (e.g. 4 → "…5678"). */
export const shortAddressSuffixLen = 4;
