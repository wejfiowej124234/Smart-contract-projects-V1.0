/**
 * Single source for all UI copy: app name, chain label, placeholders, buttons, and error messages.
 * Components read from here (or via props) so we never scatter hardcoded strings.
 */

import { DEFAULT_LOCAL_RPC, EXPECTED_CHAIN_NAME, LOCAL_CHAIN_ID } from "./network";

export const appName = "Lending Dashboard";
/** Optional header logo (emoji or single char); if empty, only appName is shown. Default placeholder. */
export const appLogo = "◆";

/** Chain display name; value from config/network or deployments (do not hardcode). */
export const chainName = EXPECTED_CHAIN_NAME;

/** Unknown or unavailable; use "0" for zero; use explicit copy (e.g. connect hint) when wallet not connected. */
export const emptyPlaceholder = "—";

export const connectWallet = "Connect wallet";
/** Shown as tooltip on Connect button: if picker does not appear, disconnect site in MetaMask first. */
export const connectWalletHint =
  "To choose a different account, disconnect this site in MetaMask (Settings → Connected sites), then click Connect again.";
export const connected = "Connected";
export const disconnectWallet = "Disconnect";
/** Tooltip on Disconnect button: clarifies that balances clear, and how to revoke site access in MetaMask. */
export const disconnectWalletHint =
  "Disconnect wallet. Balances will clear. To revoke site access entirely, also disconnect this site in MetaMask → Connected sites.";
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
/** Shown under Actions title when connected so users see the four cards below. */
export const actionsSectionIntro = "Supply, Withdraw, Borrow, or Repay using the cards below.";
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
/** Shown when pending/stuck: expand to show raw hash and error details. */
export const showRawLabel = "Show raw";
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
/** Shown under balance placeholder when not connected: how to fully disconnect so balances disappear. */
export const connectWalletToLoadBalancesDisconnectHint =
  "To disconnect: click Disconnect in the header, or disconnect this site in MetaMask (Connected sites).";
/** Shown in balance card when connected but data failed to load (e.g. node restarted, redeploy needed). */
export const balancesLoadFailedHint =
  "Balances not loaded. Start the node, run npm run deploy:localhost (and npm run deploy:p9 if needed), then click Refresh.";
export const loading = "Loading…";
export const poolTitle = "Pool";
/** Pool overview list item labels (PoolOverview). */
/** Release-grade Dashboard KPIs (DeFi first-screen) */
export const kpiTotalCollateralUsd = "Total collateral (USD)";
export const kpiBorrowLimit = "Borrow limit";
export const kpiBorrowLimitUsed = "Borrow limit used";
export const kpiBorrowLimitUsedDenominatorHint = "Borrowed / Borrow limit (LTV cap = max borrowable).";
/** Aave-style: threshold bands for color (mainnet / protocol wording). */
export const kpiBorrowLimitUsedThresholdHint = "<60% safe · 60–85% warning · >85% close to limit";
/** When borrow limit used >100%: Over limit (red). */
export const kpiBorrowOverLimitHint = "Over limit: borrowed exceeds max borrowable.";
export const kpiAvailableToBorrow = "Available to borrow";
export const kpiNetApy = "Net APY";

export const poolTotalSupplyLabel = "Total supply";
/** Single row for Pool card: supply and borrow (hover for full precision). */
export const poolTotalsLabel = "Pool totals";
/** Inline labels in Pool totals value: "111.11 supplied / 83.33 borrowed". */
export const poolSuppliedShortLabel = "supplied";
export const poolBorrowedShortLabel = "borrowed";
export const poolTotalBorrowLabel = "Total borrow";
export const poolUtilizationRateLabel = "Utilization rate";
export const poolSupplyRateLabel = "Supply rate";
export const poolBorrowRateLabel = "Borrow rate";
/** Pool totals unit hint for tooltip (e.g. "Token amount (USD8)"). */
export const poolTotalsUnitTooltipSuffix = "Token amount (same unit as pool asset, e.g. USD8).";

export const userPositionTitle = "User Position";
/** User position list item labels (UserPosition). */
export const positionSuppliedLabel = "supplied";
export const positionBorrowedLabel = "borrowed";
export const positionHealthFactorLabel = "Health factor";
export const positionMaxWithdrawLabel = "Max withdraw";
export const positionMaxBorrowLabel = "Max borrow";
export const dashboardTitle = "Dashboard (Part 2)";
export const dashboardSectionAria = "Decision & position: view balances, pool, health factor, and take actions.";
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
/** Short hint for health factor thresholds; must match format.ts HEALTH_FACTOR_* (≥1.5 safe, 1.1–1.5 warn, <1.1 danger). */
export const healthFactorThresholdHint = "HF ≥1.5 safe, 1.1–1.5 warning, <1.1 danger.";
/** HF threshold legend — Warning (orange). */
export const healthFactorWarnThresholdLabel = "1.1–1.5 Warning";
/** HF threshold legend — Danger (red). */
export const healthFactorDangerThresholdLabel = "< 1.1 Danger";
export const allowanceTooltip = "ERC20 allowance: how much the lending contract can spend from your wallet for this token.";
export const utilizationRateTooltip = "Pool utilization: total borrowed / total supplied.";
export const utilizationTooltipHigh = "High utilization";
export const utilizationTooltipMedium = "Medium utilization";
export const utilizationTooltipLow = "Low utilization";
/** DeFi core metric tooltip: supply APY. */
export const supplyRateTooltip = "Current supply APY: annualized interest earned on supplied assets.";
export const borrowRateTooltip = "Current borrow APY: annualized interest paid on borrowed assets.";
export const maxWithdrawTooltip = "Maximum amount you can withdraw without making your position unhealthy.";

/** Short action hint when health factor is in danger. */
export const healthFactorCriticalHint = "Add collateral or repay debt to improve your health factor.";
/** Risk & Parameters panel (Dashboard). */
/** Risk visualization card (Aave-style: HF bar, liquidation value, borrow usage ring). */
export const riskVizTitle = "Risk overview";
export const riskLiquidationThresholdUsd = "Liquidation below (USD)";
/** Tooltip: liquidation threshold meaning (Aave-style). */
export const riskLiquidationThresholdTooltipLong =
  "Collateral value below this amount (in USD) may trigger liquidation. Equivalent to: debt value at liquidation threshold %.";
export const riskLiquidationMarginUsd = "Safety margin (USD)";
export const riskBorrowUsageLabel = "Borrow usage";

export const riskParametersTitle = "Risk & parameters";
export const riskLtvLabel = "LTV";
export const riskLtvTooltip = "Loan-to-Value: max borrow as % of collateral.";
export const riskLiquidationThresholdLabel = "Liquidation threshold";
export const riskLiquidationThresholdTooltip = "Collateral value below this % of debt may trigger liquidation.";
export const riskLiquidationPriceLabel = "Liquidation price";
/** Protocol-level wording for mainnet. For auditors: we only support single-collateral today; this copy is future-proof so multi-collateral won’t require UI wording changes. */
export const riskLiquidationPriceTooltip = "Computed using oracle price; multi-collateral uses the earliest liquidation threshold.";
export const riskBorrowLimitUsedLabel = "Borrow limit used";
export const riskBorrowLimitUsedTooltip = "Current borrow as % of your borrow limit (LTV-based).";
export const riskCurrentLtvLabel = "Current LTV";
export const riskCurrentLtvTooltip = "Current LTV / LTV cap (right value is the borrowing limit).";

/** Empty-state hints when pool/position are zero. */
export const poolEmptyHint = "No supply or borrow yet. Supply assets to start.";
export const positionEmptyHint = "You have no supply or borrow. Supply or borrow to see position.";
/** Empty-state CTA label; scrolls to Supply card. */
export const poolEmptyCtaLabel = "Start by supplying USD8";
export const positionEmptyCtaLabel = "Start by supplying USD8";

/** Markets page */
export const marketsTitle = "Markets";
export const marketsSubtitle = "Supply and borrow assets. Connect wallet to see live rates.";
/** Shown when wallet is connected: clarifies pool stats are live, rate curve is simulated. */
export const marketsLiveRatesFromChain = "Live pool stats · Simulated rate curve";
/** Chart caption/tooltip: rate curve is simulated, pool totals are live. */
export const chartRateModelSimulatedCaption = "Rate model curve is simulated; pool totals are live.";
/** Short badge text on chart (annotation only); subtitle carries full summary. */
export const chartSimulatedBadgeShort = "Simulated";
export const marketsSectionAria = "Discover & compare: view reserves, APY, LTV, and filter by asset.";
export const marketsSortByLabel = "Sort by";
export const marketsSortByApy = "Supply APY";
export const marketsSortByUtilization = "Utilization";
export const marketsSortByTotalSupply = "Total supply";
export const marketsFilterByAssetLabel = "Asset";
export const riskLtvShortLabel = "LTV";
export const riskLtShortLabel = "LT";
export const marketSupplyApy = "Supply APY";
export const marketBorrowApy = "Borrow APY";
export const marketTotalLiquidity = "Total liquidity";
export const marketTotalLiquidityUsd = "Total liquidity (USD)";
export const marketUtilization = "Utilization";
export const marketSupplyCta = "Supply";
export const marketBorrowCta = "Borrow";
export const marketsConnectToLoad = "Connect wallet to load market data.";
export const chartPriceLabel = "Price";
export const chartVolumeLabel = "Volume";
export const chartTimeRange1d = "1D";
export const chartTimeRange1w = "1W";
export const chartTimeRange1y = "1Y";
export const poolActivityTitle = "Pool activity (simulated)";
export const marketsChartTitleSimulated = "Rate model (simulated)";
export const marketsChartUtilizationLocalTitle = "Utilization (local)";
export const marketsChartDataSourceExplanation =
  "Chart uses local or simulated data. On mainnet, utilization and the borrow rate curve (kink model) come from the pool contract.";
/** Data trust: oracle/source hint next to key metrics. */
export const dataSourceOracleLabel = "Data from chain · Oracle";
export const dataSourceExpandLabel = "Data source & formula";
export const dataSourceBlockLabel = "Block";
export const dataSourceUpdatedLabel = "Updated";
export const dataSourceOracleAddressLabel = "Oracle";
export const dataSourcePrecisionLabel = "Precision";
export const dataSourcePrecisionUsdHint = "USD: 8 decimals (chain)";
export const dataSourceFormulaHfHint = "Health factor = (maxBorrowable × 100) / borrowed; ≥150 safe, <100 at risk.";
export const dataSourceFormulaRatesHint = "Supply/borrow APY from pool interest rate model (utilization-based).";
/** Oracle source type when not from a known feed (e.g. Chainlink). */
export const dataSourceOracleSourceLabel = "Oracle source";
export const dataSourceOracleSourceOnChain = "On-chain oracle (see address below)";
export const networkStatusSynced = "Synced";
export const networkStatusLabel = "Network";
/** Block freshness: data is N blocks behind chain head. */
export const blockFreshnessBehindLabel = "Data is {n} blocks behind";
export const blockFreshnessAgoLabel = "Data as of {s}s ago";
export const dataSourceBlockTimestampLabel = "Block time";
export const dataSourceBlockTimestampAgoTemplate = "Block {block} · {ago}";
export const dataSourceBlockTimestampTooltip = "from RPC block.timestamp";
export const dataSourceBlockTimestampJustNow = "just now";
export const dataSourceBlockTimestampZeroAgo = "~0s ago";
export const dataSourceOracleDelayLabel = "Oracle delay";
export const dataSourceOracleDelayBlocksTemplate = "{n} blocks behind";
export const dataSourceOracleDelayUnknown = "—";
export const dataSourceOracleDelayUnknownReason = "Oracle data not available on this network, or contract does not expose last update.";
export const rpcFallbackBannerTitle = "Using fallback RPC";
export const rpcFallbackBannerBody = "Primary RPC is unavailable. Data may be delayed. ({reason})";
/** DataStatusBar: unified mode badge (mainnet-style). */
export const statusBarModeOk = "OK";
export const statusBarModeDegraded = "Degraded";
export const statusBarModeWritesDisabled = "Writes disabled";
export const statusBarDetailsSummary = "Details";
/** Fallback when positionRiskSummary not provided: generic hint. */
export const statusBarOkPositionRiskHint = "(local gate) · Risk: see Risk overview";
/** Position risk labels for status bar: "Position risk: {label} (HF 1.06)". */
export const statusBarPositionRiskAtRisk = "At risk";
export const statusBarPositionRiskDanger = "Danger";
/** In Details when status is OK: clarify that OK = infra/data OK, position risk is separate. */
export const statusBarOkExplanation = "Status OK = infra/data OK. Position risk (e.g. Health factor at risk) is shown in Risk overview; does not change status on local chain.";
/** Health enum for observability: ok | degraded | writesDisabled. Used in aria-label and Evidence Pack. */
export const statusBarHealthEnumOk = "ok";
export const statusBarHealthEnumDegraded = "degraded";
export const statusBarHealthEnumWritesDisabled = "writesDisabled";
/** Degraded risk UX: tooltip when status bar shows Degraded (data/risk conditions; confirm before submit). */
export const statusBarDegradedTooltip = "Degraded: data or risk conditions. Confirm before submitting. Open Details for causes (e.g. Health factor at risk, Oracle/data delay, fallback RPC).";
export const diagnosticsRpcUrlInUseLabel = "RPC in use";
export const diagnosticsRpcUrlInUseHint = "Masked host only (e.g. rpc.chain.io)";
export const diagnosticsRpcFailCountLabel = "RPC fail count";
export const diagnosticsRpcLastOkAtLabel = "RPC last OK at";
/** Split provider (31337): read RPC section on /diagnostics. */
export const diagnosticsReadRpcSectionTitle = `Local read (${LOCAL_CHAIN_ID})`;
export const diagnosticsReadRpcUrlLabel = "Read RPC URL";
export const diagnosticsReadChainIdLabel = "Read chainId (from node)";
export const diagnosticsWalletChainIdLabel = "Wallet chainId";
export const diagnosticsReadMatchLabel = "Read chainId = Wallet chainId";
/** Banner when readChainId !== walletChainId on 31337; writes disabled. */
export const networkMismatchBannerTitle = "Network mismatch";
export const networkMismatchBannerBody = `Read chain (from node) does not match wallet chain. Writes disabled. Fix MetaMask network (RPC ${DEFAULT_LOCAL_RPC}, chainId ${LOCAL_CHAIN_ID}) or switch to the same chain.`;
/** Preflight: when split provider mismatch, block confirm. */
export const preflightErrorNetworkMismatch = `Network mismatch. Read chain does not match wallet. Fix MetaMask network (RPC ${DEFAULT_LOCAL_RPC}, chainId ${LOCAL_CHAIN_ID}) and try again.`;

/** Chart data source label when using mock/simulated data (P2 audit: label as simulated). */
export const chartSimulatedDataLabel = "Simulated data";
/** Markets: multi-asset visual placeholder (contract may have single reserve). */
export const marketsMockAssetComingSoon = "Coming soon";
export const marketsMockAssetNotAvailable = "Trading not available for this asset.";
/** Section header for reserves that are live and tradeable. */
export const marketsEnabledSectionTitle = "Enabled";
/** Section header for reserves shown for discovery but not yet tradeable. */
export const marketsComingSoonSectionTitle = "Coming soon";
export const marketsMockExplanationModalTitle = "About \"Coming soon\" assets";
export const marketsMockExplanationModalBody =
  "USDC, ETH, and DAI are listed for discovery only. Supply and borrow are not yet available for these assets. Only the enabled asset (e.g. USD8 on this deployment) can be used for supply and borrow. When multi-reserve support is added, these assets will become tradeable.";
export const marketsMockExplanationCta = "What does Coming soon mean?";
export const marketsComingSoonWhatMeans = "What does Coming soon mean?";
/** Tooltip when Supply/Borrow disabled on Coming soon row. */
export const marketsDisabledReasonComingSoon = "Not enabled for this asset yet.";
/** Tooltip for enabled Supply/Borrow (APY / utilization hint). */
export const marketsSupplyBtnTooltip = "Supply APY and utilization in table. Use Dashboard to supply.";
export const marketsBorrowBtnTooltip = "Borrow APY in table. Borrowing lowers health factor.";
/** Dashboard/Contracts: short note about multi-asset. */
export const dashboardAssetsNote = "Assets: one enabled (supply/borrow); USDC, ETH, DAI coming soon.";
/** Dashboard/Contracts: CTA to open the same Coming soon explanation as on Markets. */
export const dashboardAssetsComingSoonCta = "What does Coming soon mean?";

/** LTV/LT fallback when chain read fails or not configured (P2 audit: mark as default). */
export const riskParamsDefaultSuffix = " (default)";

/** Activity/Settings placeholder: F5 optional (P2 audit). */
export const activityPlaceholderF5Optional = "Transaction history and pool activity. (F5 optional — not implemented yet.)";
export const settingsPlaceholderF5Optional = "Network and display options. (F5 optional — not implemented yet.)";

/** F8: Activity page — history list and filters */
export const activityTitle = "Activity";
export const activityEmptyHint = "No transactions yet. Supply, borrow, repay or withdraw to see history.";
/** Activity empty state: yield-oriented CTA (Aave/Compound). */
export const activityEmptyYieldHint = "Supply to earn APY; your transactions will appear here after you interact.";
export const activityFilterAll = "All";
export const activityFilterPending = "Pending";
export const activityFilterSuccess = "Success";
export const activityFilterFailed = "Failed";
export const activityConnectHint = "Connect wallet to see your transaction history.";
export const activityTypeLabel = "Type";
export const activityAssetLabel = "Asset";
export const activityAmountLabel = "Amount";
export const activityHashLabel = "Tx hash";
export const activityStatusLabel = "Status";
export const activityBlockLabel = "Block";
export const activityGasLabel = "Gas used";
export const activityStatusTimelinePending = "Pending";
export const activityStatusTimelineConfirmed = "Confirmed";
export const activityStatusTimelineFailed = "Failed";
export const activityOutcomeReplaced = "Replaced";
export const activityOutcomeDropped = "Dropped";
export const activityReplacedByTemplate = "replaced by {hash}";
export const txReplacedByLineTemplate = "Replaced by {hash} (copy)";
export const txDroppedLineDefault = "Dropped (timeout). Suggest: bump gas & resend.";
export const txDroppedLineNotFound = "Dropped (not found). Suggest: bump gas & resend.";
export const txDroppedLineRpcDegraded = "Dropped (RPC issue). Check explorer or resend.";
export const activityTimeLabel = "Time";

/** Governance enhancements */
export const governanceProposalVotes = "Votes";
export const governanceVoteFor = "For";
export const governanceVoteAgainst = "Against";
export const governanceVoteAbstain = "Abstain";
export const governanceQueue = "Queue";
export const governanceExecute = "Execute";
/** Button label to cancel a proposal (governance action). */
export const governanceCancel = "Cancel";
export const governanceTimelockEta = "Executable after";
export const governanceCreateProposal = "Create proposal";
/** Hint under Function call data input: avoid paste truncation. */
export const governanceCalldataHint = "Paste full hex (no truncation). Min length for setLTV: 138 chars (0x + 4-byte selector + 32+32 params).";
export const governanceCalldataInvalid = "Invalid or truncated calldata: each item must be 0x + even-length hex, min 138 chars for single call.";
export const governanceAdminNotTimelock = "Configurator admin is not Timelock. Run: npm run governance:transfer-admin";
export const governanceVote = "Vote";
export const governanceActive = "Active";
export const governancePending = "Pending";
export const governanceExecuted = "Executed";
export const governanceSucceeded = "Succeeded";
export const governanceQueued = "Queued";
export const governanceDefeated = "Defeated";
export const governanceCanceled = "Canceled";
export const governanceExpired = "Expired";
/** P3: Admin entry from Governance page. */
export const governanceAdminLink = "Admin";

/** Governance overview KPI (release-grade) */
export const governanceOverviewTitle = "Governance overview";
export const governanceKpiActiveProposals = "Active proposals";
export const governanceKpiTotalProposals = "Total proposals";
export const governanceKpiTimelock = "Timelock";
export const governanceKpiVotingPower = "Voting power";
export const governanceKpiDelegatedTo = "Delegated to";
export const governanceKpiPoolPause = "Pool pause";
export const governanceKpiPoolPaused = "Paused";
export const governanceKpiPoolActive = "Active";
export const governanceKpiQuorum = "Quorum";
export const governanceDaoParamsTitle = "DAO parameters";
export const governanceVotingPeriodLabel = "Voting period";
export const governanceVotingPeriodBlocks = "{n} blocks";
export const governanceProposalThresholdLabel = "Proposal threshold";
export const governanceTimelockDelayLabel = "Timelock delay";
export const governanceTimelockDelaySeconds = "{n}s";
export const governanceQuorumProgressLabel = "Votes / Quorum";
export const governanceQuorumMet = "Met";
export const governanceQuorumNotMet = "Not met";
/** DAO parameters: provenance (audit). */
export const governanceDaoParamsSourceLabel = "Source: on-chain governance contract";
/** P1: When deployments have no governor (Governance not deployed). */
export const governanceNotDeployed = "Governance not deployed for this network. Deploy P9 to see proposals.";
/** P1: Proposal created success echo (chain-authoritative). */
export const governanceProposalCreatedEcho = "Proposal created: ID {id}. Snapshot block: {snapshot}, Voting deadline: {deadline}.";
/** P1: Quorum / votes at snapshot (parameter drift visibility). */
export const governanceProposalQuorumVotesEcho = "Quorum(snapshot): {quorum} · Your votes at snapshot: {votes} · txHash: {txHash}";

/** Proposal list */
export const governanceProposalListTitle = "Proposals";
export const governanceProposalId = "ID";
export const governanceProposalTitle = "Title";
export const governanceProposalStatus = "Status";
export const governanceProposalEta = "ETA";
export const governanceProposalDetails = "Details";
export const governanceProposalTitlePlaceholder = "Proposal";

/** My governance info card */
export const governanceMyInfoTitle = "My governance";
export const governanceMyVotingPower = "Voting power";
export const governanceMyDelegatedTo = "Delegated to";
export const governanceMyCanExecute = "Can execute proposal";
export const governanceMyCanExecuteYes = "Yes";
export const governanceMyCanExecuteNo = "No";
export const governanceDelegateBtn = "Delegate";
export const governanceViewHistoryBtn = "View history";
export const governanceNotConnected = "Connect wallet to see your voting power.";
/** P0: When balance > 0 and already self-delegated but voting power still 0 (snapshot / 1 block delay). */
export const governanceVotesSnapshotHint = "Votes are snapshotted; wait 1 block after delegation.";
/** P0: When balance > 0 but not self-delegated yet. */
export const governanceSelfDelegateHint = "Please self-delegate first.";
/** Shippable: one-line governance flow for first-time users. */
export const governanceFlowHint = "Connect wallet → view proposals → Vote on active proposals or Create proposal (admin).";
export const governanceSectionAria = "DAO flow: view proposal timeline, vote, queue, and execute.";
/** Shippable: data provenance label (Dashboard / Markets). */
export const dataFromChainLabel = "Data from chain";
/** Shippable: link after tx confirmed to view in Activity. */
export const txSuccessViewActivity = "View in Activity";
/** Dashboard: when there is a pending tx, prompt to recheck/clear or go to Activity. */
export const dashboardPendingTxHint = "You have a pending transaction. Recheck or clear it below, or view in Activity.";
/** Nav label for Activity (transaction history). */
export const navActivity = "Activity";
/** Shippable: Markets empty state when no reserves or no data yet. */
export const marketsEmptyDataHint = "Connect wallet to see live rates. Supply or borrow from Dashboard to see pool activity.";
/** Shown under Markets connect hint when not connected (same as Dashboard: how to fully disconnect). */
export const marketsDisconnectHint = "To disconnect: click Disconnect in the header, or disconnect this site in MetaMask (Connected sites).";
/** Shippable: Governance empty proposal list hint. */
export const governanceEmptyProposalsHint = "No proposals yet. Create a proposal (admin) or wait for existing proposals to appear.";
/** Productized empty state: no proposals yet. */
export const governanceEmptyStateTitle = "No proposals yet";
/** Hint next to lifecycle timeline when there are no proposals (avoids implying a real proposal state). */
export const governanceTimelinePlaceholderHint = "Lifecycle states (example)";
export const governanceEmptyStateCta = "Create the first governance proposal.";

/** Activity onboarding when no txs. */
export const activityOnboardingHint = "Your transactions will appear here after you supply, borrow, repay, or withdraw.";
/** Activity empty state: CTA to go to Dashboard for first supply/borrow. */
export const activityGoToDashboardCta = "Go to Dashboard to supply";

/** Tx success toast: message and explorer link text. */
export const txSuccessToastMessage = "Transaction confirmed";
export const txSuccessViewInExplorer = "View in explorer";
/** P3: Single-asset mode note on AssetDetail (assetId for URL consistency). */
export const assetDetailSingleAssetNote = "Single-asset mode: assetId is for URL consistency; pool data is the same as Markets.";

/** Risk hint before Borrow (borrowing lowers health factor). */
export const borrowHfWarning = "Borrowing will lower your health factor.";
/** Risk hint before Withdraw (withdrawing may lower health factor). */
export const withdrawHfWarning = "Withdrawing may lower your health factor.";
export const preflightImpactTitle = "Risk impact preview";
/** Shown when any metric worsens (Before→After + Δ table). */
export const preflightRiskWorsensSummary = "One or more risk metrics will worsen (highlighted below). Review before confirming.";
export const preflightImpactHint = "This action may change your health factor, borrow usage, and liquidation margin. Check Dashboard after confirmation.";
export const preflightImpactBeforeLabel = "Before";
export const preflightImpactAfterLabel = "After";
export const preflightImpactDeltaLabel = "Δ";

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
/** HF badge tooltip: threshold bands (must match format.ts: Healthy ≥1.5, At risk 1.1–1.5, Critical <1.1). */
export const healthFactorBadgeThresholdsTooltip = "Healthy: HF ≥ 1.5; At risk: 1.1 ≤ HF < 1.5; Critical: HF < 1.1; No debt: —";

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
/** Shown when confirm is disabled because a tx is already in progress. */
export const preflightTxInProgressHint = "A transaction is in progress. Please confirm or reject it in MetaMask first.";
/** Toast when user has confirmed preflight and we are about to open the wallet. */
export const preflightOpenWalletToast = "Please confirm in the MetaMask window. If you don't see a popup, click the MetaMask extension icon in your browser toolbar.";
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
export const refreshStatus = "Recheck";
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
/** Tooltip for approval mode: when to use exact vs infinite (mainnet UX). */
export const approvalModeTooltip =
  "Exact: approve only the amount you are about to use (recommended for security). Infinite: one-time approve for unlimited amount (convenient but higher exposure if the contract is compromised).";
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
/** Shown under Supply when chain/contract mismatch (getCode empty). */
export const actionReasonDashboardNotReady = "Run: npm run deploy:localhost && npm run deploy:p9, then refresh the page.";
/** Shown when read chain ≠ wallet chain (31337). */
export const actionReasonNetworkMismatch = "Wallet network does not match node. Switch to local chain (see top banner).";
/** Shown when mainnet read-only: writes disabled. */
export const actionReasonReadOnlyMode = "Read-only mode on this network. Writes are disabled.";
/** Shown when runtime risk tier is high: writes disabled. */
export const actionReasonRuntimeRiskHigh = "High risk detected. Writes are temporarily disabled.";

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
/** When pre-send RPC check (getBlockNumber) fails. */
export const preflightErrorRpcUnreachable = `RPC unreachable. For local ${LOCAL_CHAIN_ID}: start node (npx hardhat node), set MetaMask RPC to ${DEFAULT_LOCAL_RPC}, then refresh.`;
export const preflightErrorInsufficientUsd8Balance = "Insufficient USD8 balance.";
export const preflightErrorRepayExceedsBorrowed = "Repay amount exceeds your borrowed amount.";
export const preflightErrorAmountExceedsMaxWithdrawable = "Amount exceeds max withdrawable.";
export const preflightErrorInsufficientPoolLiquidity = "Insufficient pool liquidity.";
export const preflightErrorAmountExceedsMaxBorrowable = "Amount exceeds max borrowable.";
export const preflightErrorPoolPaused = "Pool is paused. Unpause in Admin (or wait for guardian) before Supply/Borrow/Withdraw/Repay.";
export const preflightErrorNoCollateralForBorrow = "No supplied collateral. Supply first, then borrow.";

/** TxStatus stage text (useTxDisplay). */
export const stageTextSigning = "Wallet confirmation";
export const stageTextPending = "Pending (on-chain)";
export const stageTextStuck = "Pending (taking longer)";
export const stageTextConfirmed = "Confirmed";
export const stageTextFailed = "Failed";

/** TxStatus hint text by stage (useTxDisplay). */
export const hintTextSigning = "Review the details in MetaMask, then confirm.";
/** Shown when Signing stage exceeds 10s without tx hash: guide user to MetaMask popup/pending. */
export const signingPendingLongHint = "Wallet confirmation pending. Check the MetaMask extension popup or click the fox icon for a pending request.";
export const signingPendingTroubleshootingLabel = "Troubleshooting";
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
/** Shown when a submitted tx reverted on-chain but we got no revert reason (missing revert data). */
export const errorTxRevertedOnChain =
  "Transaction reverted on-chain. Possible causes: pool paused, zero amount, reserve paused, or contract invariant. Check pool state (e.g. pause status) or try a smaller amount. Copy error details for raw message.";
/** When a write (supply/approve/etc.) fails before reaching MetaMask (call/estimateGas reverted). Explains why no wallet popup and gives Supply-specific fix. */
export const errorWriteRevertedBeforeSend =
  "Request reverted before wallet (no MetaMask popup). If you see “Needs approve”: click Supply → approve in MetaMask → then click Supply again and confirm. For local 31337: run npm run deploy:localhost && npm run deploy:p9 and hard-refresh; or run npm run ops:fix-supply-revert and retry.";
/** Dashboard read failed (missing revert data): often means contract not deployed or wrong network. */
export const errorDashboardContractReadFailed =
  `Contract read failed (RPC/contract not available). For local chain ${LOCAL_CHAIN_ID}: 1) Start node: npx hardhat node. 2) Deploy: npm run deploy:localhost && npm run deploy:p9. 3) Set MetaMask RPC ${DEFAULT_LOCAL_RPC}, chainId ${LOCAL_CHAIN_ID}. 4) Refresh the page.`;
/** Short version for tight UI (e.g. allowance row). Full steps are in docs (local chain standard and addresses). */
export const errorContractReadFailedShort =
  "RPC or contracts unavailable. Follow the local chain setup in docs (09) and hard-refresh the page.";
/** Pool read (getPoolInfo) failed: contract missing or wrong address. */
export const errorDashboardPoolReadFailed =
  `Pool read failed (getPoolInfo). Check: chain running (${DEFAULT_LOCAL_RPC}), deploy:localhost was run, MetaMask chainId is ${LOCAL_CHAIN_ID}, and frontend deployments match.`;
/** Position read (getUserPosition) failed: often oracle not set or revert. */
export const errorDashboardPositionReadFailed =
  "Position read failed (getUserPosition). If the pool uses an oracle, ensure full deploy:localhost was run so the oracle is set.";
/** Balance fetch (balanceOf) failed: wrong contract address or chain mismatch. */
export const errorDashboardBalanceFetchFailed =
  `Balance fetch failed. Check: MetaMask on chain ${LOCAL_CHAIN_ID}, RPC ${DEFAULT_LOCAL_RPC}, run deploy:localhost, and frontend deployments match deployments/${LOCAL_CHAIN_ID}.json.`;
export const errorRpcNetworkCheckNode = "RPC/network error. Check your node and try again.";
export const unknownErrorFallback = "Unknown error";

/** ErrorBoundary (user-facing). */
export const errorBoundaryTitle = "Something went wrong";
export const errorBoundaryBody = "A rendering error occurred. The safest recovery is to reload.";
export const reloadLabel = "Reload";

/** F6/F7: inline error with retry / switch chain / diagnostic */
export const retryLabel = "Retry";
export const copyErrorDetailsLabel = "Copy error details";
export const copyErrorDetailsCopied = "Copied";
export const copyDebugBundleLabel = "Copy tx debug";
export const copyDebugBundleCopied = "Copied";
export const switchToChain31337Label = `Switch to chain ${LOCAL_CHAIN_ID}`;
export const openDiagnosticLabel = "Open diagnostic";

/** F6: component states — empty / loading / error / success (a11y) */
export const stateEmptyLabel = "No data";
export const stateLoadingLabel = "Loading";
export const stateErrorLabel = "Error";
export const stateSuccessLabel = "Success";
export const skeletonLoadingAriaLabel = "Content loading";

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

/** Chain/deployment mismatch: one-click fix CTA (copy deploy command, troubleshooting, diagnostics). */
export const fixCtaDeployCommand = "npm run deploy:localhost";
export const chainDeploymentMismatchTitle = "Wrong network or contracts not deployed";
export const chainDeploymentMismatchBody = "Switch to the correct chain in MetaMask or deploy contracts for this chain.";

/** When getCode(pool) is empty on 31337: chain was restarted but frontend still has old addresses. */
export const chainAddressMismatchBannerTitle = "Chain and contract addresses don’t match";
export const chainAddressMismatchBannerBody =
  "The contracts the app uses are not on the current chain (e.g. node was restarted). Run the local chain deploy steps from docs, then hard-refresh (Ctrl+Shift+R).";
export const chainAddressMismatchDeployCommand = "npm run deploy:localhost && npm run deploy:p9";
export const fixCtaCopyCommandLabel = "Copy deploy command";
export const fixCtaTroubleshootingLabel = "Troubleshooting doc";
export const fixCtaDiagnosticsLabel = "Diagnostics";
export const fixCtaCopiedToast = "Deploy command copied to clipboard";

/** Compliance: risk disclaimer (Aave/Compound-style). Shown in RiskDisclaimerBanner; user can Dismiss. */
export const complianceRiskDisclaimerTitle = "Risk notice";
export const complianceRiskDisclaimerBody =
  "DeFi involves risk. You may lose funds. This interface does not constitute financial advice. Only use funds you can afford to lose.";
/** Short line for compact display (e.g. tooltip). */
export const complianceRiskDisclaimerShort = "DeFi involves risk. Not financial advice. Use only what you can afford to lose.";
/** Compliance: unaudited contracts warning. Hidden when VITE_CONTRACTS_AUDITED=true. */
export const complianceUnauditedTitle = "Unaudited";
export const complianceUnauditedBody = "Smart contracts have not been audited. Use at your own risk.";

/** Read-only mainnet mode (no write txs). */
export const readOnlyMainnetBannerTitle = "Read-only mode";
export const readOnlyMainnetBannerBody = "Mainnet is in read-only mode. No transactions will be sent. Connect wallet on a non–read-only deployment to interact.";

/** Transaction transparency: Gas estimation (pre-submit). */
export const estimatedGasLabel = "Estimated gas";
export const estimatedFeeLabel = "Estimated fee";
export const simulationFailedLabel = "Simulation failed";
export const simulationFailedHint = "Transaction would revert. Check amount and position limits.";
export const simulationFailedWarnAllowTitle = "Simulation failed. You may proceed at your own risk.";
export const simulationFailedWarnAllowCheckbox = "I understand, continue";
/** Shown when simulation failed: why no wallet popup and what to do. */
export const simulationFailedNoPopupHint =
  "If MetaMask doesn’t open after you confirm: click Supply first and approve in the popup, then click Supply again to confirm; or run deploy:localhost per docs and hard-refresh.";
/** Tx lifecycle (timeline + Activity badge). */
export const txLifecycleSigning = "Signing";
export const txLifecycleSubmitted = "Submitted";
export const txLifecyclePending = "Pending";
export const txLifecycleConfirmed = "Confirmed";
export const txLifecycleFailed = "Failed";
export const txLifecycleReplaced = "Replaced";
export const txLifecycleDropped = "Dropped";
export const txConfirmedInTemplate = "Confirmed in {s}s";
export const txConfirmedInClientClockHint = "client clock-based";
export const txBlockConfirmationsTemplate = "Block {block} ({n} confirmations)";
export const txMinedAtLabel = "Mined at";
export const txSubmittedAtLabel = "Submitted at";
export const txSuggestionLabel = "Suggestion";

/** Tx failure: reason label before message (structured display). */
export const txFailureReasonLabel = "Reason";

/** Diagnostics: frontend version anchor (release evidence). */
export const diagnosticsFrontendVersionLabel = "Frontend version";

/** Diagnostics page */
export const diagnosticsPageTitle = "Diagnostics & troubleshooting";
export const diagnosticsCurrentChainLabel = "Current chain";
export const diagnosticsExpectedChainsLabel = "Expected chain(s)";
export const diagnosticsDeploymentsLabel = "Deployments for current chain";
export const diagnosticsTroubleshootingTitle = "Troubleshooting steps";
export const diagnosticsTroubleshootingSteps = [
  `Ensure the node is running (e.g. npx hardhat node or npm run node) and RPC is ${DEFAULT_LOCAL_RPC}.`,
  "Run the deploy script: npm run deploy:localhost.",
  `Add chain ${LOCAL_CHAIN_ID} in MetaMask with RPC ${DEFAULT_LOCAL_RPC}, then switch to it.`,
  "Run npm run verify:consistency to check node, deployments, and frontend match.",
];
export const backToDashboard = "Back to Dashboard";

/** Runtime risk adaptation (protocol-grade). */
export const runtimeRiskMediumBanner = "Degraded: confirm before submitting.";
export const runtimeRiskHighBanner = "Writes disabled: resolve issues before sending transactions.";
export const runtimeRiskReasonsLabel = "Reasons";
/** Diagnostics: Runtime risk section (health enum + reasons for Evidence Pack). */
export const diagnosticsRuntimeRiskLabel = "Runtime risk (health enum)";
export const diagnosticsRuntimeRiskTierLabel = "Tier";
export const diagnosticsRuntimeRiskTierHint = "ok = normal; degraded = confirm before submit; writesDisabled = resolve before sending.";

/** Session evidence (forensic export). */
export const diagnosticsSessionEvidenceLabel = "Session evidence";
export const diagnosticsSessionEvidenceHint = "Download this session's event log for audit or support.";
export const diagnosticsDownloadSessionEvidenceLabel = "Download session evidence";
export const diagnosticsCopyDebugBundleLabel = "Copy debug bundle";
export const diagnosticsCopyDebugBundleHint = "One-click copy for support tickets: version, fingerprint, RPC tier, blocksBehind, runtime risk, last tx/outcome.";
export const diagnosticsSendpathEvidenceLabel = "Send-path evidence";
export const diagnosticsSendpathEvidenceHint = "Last Approve/Supply run: tags order, tx hash, send error. For E2E: write to e2e/evidence/sendpath-last-run.txt.";
export const diagnosticsCopySendpathLabel = "Copy sendpath evidence";
export const diagnosticsCopySendpathCopied = "Sendpath evidence copied";

/** Config fingerprint (multi-frontend consistency, anti-hijack). */
export const diagnosticsConfigFingerprintLabel = "Config fingerprint";
export const diagnosticsConfigFingerprintHint = "Compare with official frontend to verify consistency.";

/** Revert reason → user message + suggestion (TxStatus Suggestion block). */
export const revertSuggestions: Record<string, { title: string; suggestion?: string }> = {
  "ExceedsBorrowingLimit": { title: errorExceedsBorrowingLimit, suggestion: "Reduce borrow amount or add collateral." },
  "InsufficientLiquidity": { title: errorInsufficientPoolLiquidity, suggestion: "Try a smaller amount or try again later." },
  "WithdrawalUnhealthy": { title: errorWithdrawalUnhealthy, suggestion: "Repay some debt or reduce withdraw amount." },
  "InsufficientSuppliedAmount": { title: errorInsufficientSuppliedAmount, suggestion: "Check your supplied balance." },
  "RepayExceedsBorrowed": { title: errorRepayExceedsBorrowed, suggestion: "Repay up to your borrowed amount." },
  "InsufficientAllowance": { title: errorInsufficientAllowanceApproveFirst, suggestion: "Approve token allowance first." },
  "InsufficientBalance": { title: errorInsufficientTokenBalance, suggestion: "Check your wallet balance." },
};
