import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getDeployments } from "../contracts/deployments";
import {
  emptyPlaceholder,
  actionsSectionTitle,
  actionsSectionIntro,
  actionsConnectWalletBanner,
  actionEnterAmountHint,
  contractsSectionLabel,
  walletErrorPrefix,
  dashboardErrorPrefix,
  usd8Label,
  wethLabel,
  simpleLendingLabel,
  defaultSymbol,
  dataSourceOracleLabel,
  dashboardSectionAria,
  txSuccessViewActivity,
  txSuccessToastMessage,
  txSuccessViewInExplorer,
  dashboardAssetsNote,
  dashboardAssetsComingSoonCta,
  dashboardPendingTxHint,
  navActivity,
  marketsMockExplanationModalTitle,
  marketsMockExplanationModalBody,
  closeLabel as closeLabelUi,
  readOnlyMainnetBannerTitle,
  readOnlyMainnetBannerBody,
  preflightOpenWalletToast,
  preflightErrorNetworkMismatch,
  statusBarPositionRiskAtRisk,
  statusBarPositionRiskDanger,
} from "../config/ui";
import { getExplorerTxUrl, LOCAL_CHAIN_ID } from "../config/network";
import { useToast } from "../state/toast";
import { isSupportedChain, isMainnet } from "../config/network";
import { READ_ONLY_MAINNET, CONTRACTS_AUDITED } from "../config/runtime";
import { DEFAULT_DECIMALS, ORACLE_PRICE_DECIMALS, TOKEN_AMOUNT_DECIMALS_MAIN, BLOCK_DEBOUNCE_MS, TX_IDLE_RESET_DELAY_MS, BLOCK_STALE_THRESHOLD } from "../config/runtime";
import { useWallet } from "../hooks/useWallet";
import { useGenesisBlockHash } from "../hooks/useGenesisBlockHash";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import { useDashboard } from "../hooks/useDashboard";
import { useReserveRiskParams } from "../hooks/useReserveRiskParams";
import { useActions } from "../hooks/useActions";
import { useAllowance } from "../hooks/useAllowance";
import { useDashboardForm } from "../hooks/useDashboardForm";
import { useTxDisplay } from "../hooks/useTxDisplay";
import { usePreflight } from "../hooks/usePreflight";
import { useRuntimeRisk } from "../hooks/useRuntimeRisk";
import { useChainAddressMatch } from "../hooks/useChainAddressMatch";
import { TX_IDLE } from "../state/tx";
import { safeMaxWei } from "../utils/amount";
import { formatHealthFactorForDisplay, healthFactorColor, healthFactorBand, formatAmountForDisplay, formatHeadroomDisplay } from "../utils/format";
import { formatUnits } from "ethers";
import { AddressDisplay } from "../components/ui/AddressDisplay";
import { DataStatusBar } from "../components/layout/DataStatusBar";
import { ActionCardsGrid } from "../components/actions/ActionCardsGrid";
import { DashboardGrid } from "../components/dashboard/DashboardGrid";
import { ChainProofAnchors } from "../components/dashboard/ChainProofAnchors";
import { DashboardKpiBar } from "../components/dashboard/DashboardKpiBar";
import { RiskVizCard } from "../components/dashboard/RiskVizCard";
import { RiskParametersPanel } from "../components/dashboard/RiskParametersPanel";
import { ApproveToolbar } from "../components/actions/ApproveToolbar";
import { TxStatus } from "../components/tx/TxStatus";
import { PreflightModal } from "../components/ui/PreflightModal";
import { DataProvenanceBlock } from "../components/ui/DataProvenanceBlock";
import { InlineError } from "../components/ui/InlineError";
import { PauseUnpauseBar } from "../components/admin/PauseUnpauseBar";
import { useSetNavBadges } from "../state/navBadges";
import { useSplitProviderState } from "../state/splitProviderContext";
import { getSnapshot } from "../state/sessionEvidence";
import { computeConfigFingerprint } from "../utils/configFingerprint";

const frontendVersion =
  typeof import.meta.env !== "undefined" && import.meta.env?.VITE_APP_VERSION
    ? String(import.meta.env.VITE_APP_VERSION)
    : "dev";

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [approveMode, setApproveMode] = useState<"exact" | "infinite">("exact");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSuccessHighlight, setShowSuccessHighlight] = useState(false);
  const [configFingerprint, setConfigFingerprint] = useState<string | undefined>(undefined);
  const lastToastHashRef = useRef<string | null>(null);
  const addToast = useToast().addToast;
  const setNavBadges = useSetNavBadges();
  const currentDeployments = getDeployments(wallet.chainId);
  const genesisBlockHash = useGenesisBlockHash(wallet.provider, wallet.chainId);
  const dashboard = useDashboard(wallet.provider, wallet.account, wallet.chainId);
  const reserveRiskParams = useReserveRiskParams(dashboard.contracts?.lending, currentDeployments?.usd8Address);
  const usd8Meta = useTokenMetadata(dashboard.contracts?.usd8);
  const usd8Decimals = usd8Meta.decimals ?? DEFAULT_DECIMALS;
  const symbol = usd8Meta.symbol ?? defaultSymbol;
  const allowance = useAllowance({
    token: dashboard.contracts?.usd8,
    owner: wallet.account,
    spender: currentDeployments?.simpleLendingAddress,
  });
  const split = useSplitProviderState();
  const { match: chainAddressMatch, loading: chainAddressMatchLoading } = useChainAddressMatch(
    wallet.chainId,
    currentDeployments?.simpleLendingAddress,
    currentDeployments?.usd8Address,
    wallet.chainId === LOCAL_CHAIN_ID ? wallet.provider ?? undefined : undefined
  );
  const writesEnabled = !split.mismatch && (chainAddressMatchLoading || chainAddressMatch);
  const writesDisabledByMismatch = split.mismatch || (!chainAddressMatchLoading && !chainAddressMatch);
  const actions = useActions({
    provider: wallet.provider,
    account: wallet.account,
    chainId: wallet.chainId,
    usd8: dashboard.contracts?.usd8,
    lending: dashboard.contracts?.lending,
    simpleLendingAddress: currentDeployments?.simpleLendingAddress,
    decimals: usd8Decimals,
    approveMode,
    splitMatch: writesEnabled,
    onConfirmed: () => {
      allowance.refresh();
      void dashboard.refresh();
    },
  });
  const isCorrectNetwork = isSupportedChain(wallet.chainId);
  const readOnlyMode = READ_ONLY_MAINNET && isMainnet(wallet.chainId);
  const runtimeRisk = useRuntimeRisk({
    chainId: wallet.chainId,
    blocksBehind: dashboard.blocksBehind,
    dashboardError: dashboard.error,
    healthFactor: dashboard.data?.position?.healthFactor,
  });
  const dashboardReady =
    !!wallet.account && isCorrectNetwork && !!currentDeployments && !readOnlyMode && !split.mismatch && (chainAddressMatchLoading || chainAddressMatch);
  const txBusy = actions.tx.stage === "pending" || actions.tx.stage === "signing" || actions.tx.stage === "stuck";
  useEffect(() => {
    let cancelled = false;
    void computeConfigFingerprint(wallet.chainId ?? undefined, currentDeployments ?? undefined, frontendVersion).then((fp) => {
      if (!cancelled) setConfigFingerprint(fp);
    });
    return () => { cancelled = true; };
  }, [wallet.chainId, currentDeployments]);
  const form = useDashboardForm({
    usd8Decimals,
    dashboardData: dashboard.data,
    wallet: { account: wallet.account, chainId: wallet.chainId, isMetaMaskAvailable: wallet.isMetaMaskAvailable },
    isCorrectNetwork,
    actionsReady: actions.ready,
    txBusy,
    safeMaxWei,
  });
  const txDisplay = useTxDisplay({
    tx: actions.tx,
    setTx: actions.setTx,
    refreshPendingTx: actions.refreshPendingTx,
    clearPendingTx: actions.clearPendingTx,
  });
  const preflight = usePreflight({
    actions: { supply: actions.supply, withdraw: actions.withdraw, borrow: actions.borrow, repay: actions.repay },
    dashboard,
    wallet: { account: wallet.account, chainId: wallet.chainId, rpcStatus: wallet.rpcStatus },
    usd8Decimals,
    approveMode,
    isCorrectNetwork,
    currentDeployments: currentDeployments ?? null,
    reserveRiskParams: reserveRiskParams ?? null,
    formatToken: form.formatToken,
    provider: wallet.provider,
    isMainnet: wallet.chainId != null && isMainnet(wallet.chainId),
    contractsAudited: CONTRACTS_AUDITED,
    runtimeRiskTier: runtimeRisk.tier,
    writesDisabledByMismatch,
    onBeforeOpenWallet: () => addToast(preflightOpenWalletToast, "info"),
  });

  const dashboardRef = useRef(dashboard);
  dashboardRef.current = dashboard;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (wallet.account) void dashboardRef.current.refresh();
  }, [wallet.account, wallet.chainId]);
  useEffect(() => {
    if (!wallet.provider || !wallet.account || !isCorrectNetwork || dashboard.loading || txBusy) return;
    let last = 0;
    const onBlock = () => {
      if (!autoRefresh) return;
      const now = Date.now();
      if (now - last < BLOCK_DEBOUNCE_MS) return;
      last = now;
      void dashboardRef.current.backfillEvents?.();
      void dashboardRef.current.refresh();
    };
    wallet.provider.on("block", onBlock);
    return () => { wallet.provider?.off("block", onBlock); };
  }, [autoRefresh, txBusy, dashboard.loading, isCorrectNetwork, wallet.account, wallet.provider]);
  useEffect(() => {
    if (actions.tx.stage !== "confirmed") return;
    const t = window.setTimeout(() => {
      actionsRef.current.setTx(TX_IDLE);
      lastToastHashRef.current = null;
    }, TX_IDLE_RESET_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [actions.tx.stage]);
  useEffect(() => {
    if (actions.tx.stage === "idle") lastFailedTxRef.current = null;
  }, [actions.tx.stage]);
  useEffect(() => {
    if (actions.tx.stage !== "confirmed") return;
    queueMicrotask(() => setShowSuccessHighlight(true));
    const t = window.setTimeout(() => setShowSuccessHighlight(false), 2500);
    return () => window.clearTimeout(t);
  }, [actions.tx.stage]);

  useEffect(() => {
    if (actions.tx.stage !== "confirmed" || !actions.tx.hash || wallet.chainId == null) return;
    if (lastToastHashRef.current === actions.tx.hash) return;
    lastToastHashRef.current = actions.tx.hash;
    addToast(txSuccessToastMessage, "success", {
      url: getExplorerTxUrl(wallet.chainId, actions.tx.hash),
      label: txSuccessViewInExplorer,
    });
  }, [actions.tx.stage, actions.tx.hash, wallet.chainId, addToast]);

  const lastFailedTxRef = useRef<string | null>(null);
  useEffect(() => {
    if (actions.tx.stage !== "failed" || !actions.tx.error?.message) return;
    const key = `${actions.tx.label ?? ""}-${actions.tx.error.message}`;
    if (lastFailedTxRef.current === key) return;
    lastFailedTxRef.current = key;
    addToast(`Transaction failed: ${actions.tx.error.message}`, "error");
  }, [actions.tx.stage, actions.tx.error?.message, actions.tx.label, addToast]);
  useEffect(() => {
    if (actions.tx.stage !== "confirmed" || !actions.tx.label) return;
    const label = actions.tx.label;
    formRef.current.setInputs((prev) => ({
      ...prev,
      supply: label === "Supply" ? "" : prev.supply,
      withdraw: label === "Withdraw" ? "" : prev.withdraw,
      borrow: label === "Borrow" ? "" : prev.borrow,
      repay: label === "Repay" ? "" : prev.repay,
    }));
  }, [actions.tx.stage, actions.tx.label]);

  // Nav badge: we don’t show dollar amount on the Dashboard tab so it doesn’t look like a second tab (e.g. “Dashboard $111”)
  useEffect(() => {
    setNavBadges({ dashboard: undefined });
  }, [setNavBadges]);

  // P3: scroll to action card when arriving from Markets CTA (?action=supply|borrow)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action !== "supply" && action !== "borrow") return;
    const id = action === "supply" ? "action-card-supply" : "action-card-borrow";
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  const lastUpdatedText = dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleTimeString() : emptyPlaceholder;
  const [assetsExplanationOpen, setAssetsExplanationOpen] = useState(false);

  const statusBarMode =
    runtimeRisk?.tier === "high"
      ? "writesDisabled"
      : runtimeRisk?.tier === "medium" ||
          wallet.rpcStatus?.tier === "fallback" ||
          (dashboard.blocksBehind != null && dashboard.blocksBehind > BLOCK_STALE_THRESHOLD)
        ? "degraded"
        : "ok";
  const positionRiskSummary =
    statusBarMode === "ok" &&
    runtimeRisk?.reasons?.length &&
    dashboard.data?.position?.healthFactor != null
      ? `(local gate) · Position risk: ${runtimeRisk.reasons.some((r) => r.includes("danger")) ? statusBarPositionRiskDanger : statusBarPositionRiskAtRisk} (HF ${formatHealthFactorForDisplay(dashboard.data.position.healthFactor)})`
      : undefined;

  return (
    <>
      {wallet.account && !isCorrectNetwork && (
        <div className="banner bannerWarn" role="alert">
          This network is not supported. Please switch to a supported chain.
        </div>
      )}
      {wallet.account && isCorrectNetwork && wallet.chainId === LOCAL_CHAIN_ID && (
        <div className="banner bannerInfo" role="status" aria-live="polite">
          Using local network. If you restarted the node and MetaMask shows wrong balances, reset account for this network.
        </div>
      )}
      <PauseUnpauseBar
        provider={wallet.provider}
        account={wallet.account}
        poolAddress={currentDeployments?.simpleLendingAddress}
        onSuccess={() => void dashboard.refresh()}
      />
      <div className="dashboardContent" role="region" aria-label={dashboardSectionAria}>
      <DataStatusBar
        onRefresh={() => void dashboard.refresh()}
        loading={dashboard.loading}
        hasAccount={!!wallet.account}
        isCorrectNetwork={isCorrectNetwork}
        lastUpdatedText={lastUpdatedText}
        blockNumber={dashboard.blockNumber}
        blocksBehind={dashboard.blocksBehind}
        isMetaMaskAvailable={wallet.isMetaMaskAvailable}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        runtimeRisk={runtimeRisk}
        rpcStatus={wallet.rpcStatus}
        positionRiskSummary={positionRiskSummary}
      />
      {wallet.account && isCorrectNetwork && (
        <>
          <p className="dataProvenanceHint" role="note" aria-label={dataSourceOracleLabel}>
            {dataSourceOracleLabel}
          </p>
          <DataProvenanceBlock
            blockNumber={dashboard.blockNumber}
            blockTimestamp={dashboard.blockTimestamp}
            updatedAt={lastUpdatedText}
            oracleAddress={currentDeployments?.oracleRouterAddress}
            chainId={wallet.chainId ?? undefined}
          />
        </>
      )}
      {dashboard.error && (
        <InlineError
          message={`${dashboardErrorPrefix}${dashboard.error}`}
          diagnostic={`${dashboardErrorPrefix}${dashboard.error}`}
          onRetry={() => void dashboard.refresh()}
          onSwitchTo31337={wallet.chainId !== LOCAL_CHAIN_ID ? () => void wallet.ensureCorrectNetwork() : undefined}
          onOpenDiagnostic={() => navigate("/diagnostics")}
        />
      )}
      {actions.tx.stage !== "idle" && (
        <div className={`txStatusBlock${showSuccessHighlight ? " txStatusBlock--success" : ""}`}>
          {(actions.tx.stage === "pending" || actions.tx.stage === "stuck") && (
            <p className="dashboardPendingTxHint muted" role="status">
              {dashboardPendingTxHint} <Link to="/activity">{navActivity}</Link>
            </p>
          )}
          <TxStatus
            tx={actions.tx}
            setTx={actions.setTx}
            {...txDisplay}
            disableRefreshClear={!wallet.account}
            debugContext={{
              chainId: wallet.chainId,
              rpcTier: wallet.rpcStatus?.tier,
              version: frontendVersion,
              configFingerprint,
              sessionId: getSnapshot().sessionId,
              gasEstimate: preflight.preflight?.gasEstimate,
            }}
          />
          {actions.tx.stage === "confirmed" && actions.tx.hash && (
            <p className="txSuccessActivityLink">
              <Link to="/activity" className="navLink">{txSuccessViewActivity}</Link>
            </p>
          )}
        </div>
      )}
      {wallet.account && dashboard.loading && (
        <div className="dashboardKpiBar dashboardKpiBar--skeleton" aria-busy="true" aria-label="Loading key metrics">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="dashboardKpiItem">
              <span className="skeleton skeletonKpiLabel" style={{ width: "4rem" }} />
              <span className="skeleton skeletonKpiValue" style={{ width: "3.5rem" }} />
            </div>
          ))}
        </div>
      )}
      {wallet.account && dashboard.data?.pool && (
        <DashboardKpiBar
          totalSupply={formatAmountForDisplay(dashboard.data.pool.totalSupply, usd8Decimals, TOKEN_AMOUNT_DECIMALS_MAIN)}
          totalBorrow={formatAmountForDisplay(dashboard.data.pool.totalBorrow, usd8Decimals, TOKEN_AMOUNT_DECIMALS_MAIN)}
          totalCollateralUsd={
            dashboard.data.position && dashboard.data.position.collateralValue !== undefined
              ? (() => {
                  try {
                    const v = formatUnits(dashboard.data.position!.collateralValue, ORACLE_PRICE_DECIMALS);
                    const n = parseFloat(v);
                    return Number.isFinite(n) ? n.toFixed(2) : "—";
                  } catch {
                    return form.formatToken(dashboard.data.position!.collateralValue, usd8Decimals);
                  }
                })()
              : undefined
          }
          borrowLimit={
            dashboard.data.position
              ? (() => {
                  const { borrowed, maxBorrow } = dashboard.data.position!;
                  const maxBorrowable = borrowed + maxBorrow;
                  return formatAmountForDisplay(maxBorrowable, usd8Decimals, TOKEN_AMOUNT_DECIMALS_MAIN);
                })()
              : undefined
          }
          borrowLimitTitle={
            dashboard.data.position
              ? form.formatToken(dashboard.data.position.borrowed + dashboard.data.position.maxBorrow, usd8Decimals)
              : undefined
          }
          totalSupplyTitle={dashboard.data.pool ? form.formatToken(dashboard.data.pool.totalSupply, usd8Decimals) : undefined}
          totalBorrowTitle={dashboard.data.pool ? form.formatToken(dashboard.data.pool.totalBorrow, usd8Decimals) : undefined}
          availableToBorrow={
            dashboard.data.position
              ? formatHeadroomDisplay(dashboard.data.position.maxBorrow, usd8Decimals, (v, d) => form.formatToken(v, d)).display
              : undefined
          }
          availableToBorrowTooltip={
            dashboard.data.position
              ? formatHeadroomDisplay(dashboard.data.position.maxBorrow, usd8Decimals, (v, d) => form.formatToken(v, d)).tooltip
              : undefined
          }
          netApy={
            dashboard.data.pool && dashboard.data.position
              ? (() => {
                  const { pool, position } = dashboard.data;
                  if (!pool || !position || position.supplied === 0n) return undefined;
                  try {
                    const supplyRate = Number(pool.supplyRate);
                    const borrowRate = Number(pool.borrowRate);
                    const supplied = Number(position.supplied);
                    const borrowed = Number(position.borrowed);
                    const netBps = supplied > 0
                      ? (supplyRate * supplied - borrowRate * borrowed) / supplied
                      : 0;
                    return `${(netBps / 100).toFixed(2)}%`;
                  } catch {
                    return undefined;
                  }
                })()
              : undefined
          }
          borrowLimitUsedPct={
            dashboard.data.position
              ? (() => {
                  const { borrowed, maxBorrow } = dashboard.data.position!;
                  const maxBorrowable = borrowed + maxBorrow;
                  if (maxBorrowable === 0n) return undefined;
                  return Math.min(100, Number((borrowed * 1000000n) / maxBorrowable) / 10000);
                })()
              : undefined
          }
          healthFactorDisplay={dashboard.data.position ? formatHealthFactorForDisplay(dashboard.data.position.healthFactor) : "—"}
          healthFactorColor={dashboard.data.position ? healthFactorColor(dashboard.data.position.healthFactor) : undefined}
          healthFactorBand={dashboard.data.position ? healthFactorBand(dashboard.data.position.healthFactor) : undefined}
          runtimeRiskTierHigh={runtimeRisk.tier === "high"}
        />
      )}
      {wallet.account && reserveRiskParams && (
        <p className="dashboardLtvSummary muted" role="note" aria-label="Risk parameters summary">
          LTV {reserveRiskParams.ltvPct}% · LT {reserveRiskParams.ltPct}%
        </p>
      )}
      {wallet.account && dashboard.data?.position && reserveRiskParams && (
        <RiskVizCard
          healthFactor={dashboard.data.position.healthFactor}
          collateralValue={dashboard.data.position.collateralValue}
          borrowed={dashboard.data.position.borrowed}
          maxBorrow={dashboard.data.position.maxBorrow}
          maxBorrowable={dashboard.data.position.borrowed + dashboard.data.position.maxBorrow}
          ltPct={reserveRiskParams.ltPct}
          ltvPct={reserveRiskParams.ltvPct}
          formatUsd={(v) => {
            try {
              const s = formatUnits(v, ORACLE_PRICE_DECIMALS);
              const n = parseFloat(s);
              if (!Number.isFinite(n)) return "—";
              if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
              if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
              if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
              return n.toFixed(2);
            } catch {
              return "—";
            }
          }}
        />
      )}
      <DashboardGrid hasAccount={!!wallet.account} loading={dashboard.loading} data={dashboard.data} usd8Decimals={usd8Decimals} formatToken={form.formatToken} formatPercent={form.formatPercent} symbol={symbol} />
      <RiskParametersPanel reserveParams={reserveRiskParams} />
      <section className="actionsSection" aria-label={actionsSectionTitle}>
        <h3 className="sectionTitle">{actionsSectionTitle}</h3>
        {wallet.account && <p className="muted actionsSectionIntro" role="status">{actionsSectionIntro}</p>}
        {readOnlyMode && (
          <div className="banner bannerWarn actionsConnectBanner" role="status" aria-live="polite">
            <strong>{readOnlyMainnetBannerTitle}:</strong> {readOnlyMainnetBannerBody}
          </div>
        )}
        {!wallet.account && !readOnlyMode && (
          <div className="banner bannerWarn actionsConnectBanner" role="status" aria-live="polite">
            {actionsConnectWalletBanner}
          </div>
        )}
        <ApproveToolbar approveMode={approveMode} setApproveMode={setApproveMode} disabled={!!preflight.preflight || txBusy || readOnlyMode} />
        <ActionCardsGrid form={form} preflight={preflight} actions={actions} dashboardReady={dashboardReady} txBusy={txBusy} wallet={wallet} dashboard={dashboard} allowance={allowance} symbol={symbol} usd8Decimals={usd8Decimals} readOnlyMode={readOnlyMode} runtimeRiskTierHigh={runtimeRisk.tier === "high"} networkMismatch={split.mismatch || (!chainAddressMatchLoading && !chainAddressMatch)} />
        {wallet.account && !form.inputs.supply.trim() && !form.inputs.withdraw.trim() && !form.inputs.borrow.trim() && !form.inputs.repay.trim() && (
          <p className="muted actionEnterAmountHint" role="status">{actionEnterAmountHint}</p>
        )}
      </section>
      <hr className="divider" />
      <details className="metaGridDetails contentBlock" open={false}>
        <summary className="metaGridSummary">{contractsSectionLabel}</summary>
        <div className="metaGrid">
          <AddressDisplay label={usd8Label} address={currentDeployments?.usd8Address} chainId={wallet.chainId} />
          <AddressDisplay label={wethLabel} address={currentDeployments?.wethAddress} chainId={wallet.chainId} />
          <AddressDisplay label={simpleLendingLabel} address={currentDeployments?.simpleLendingAddress} chainId={wallet.chainId} />
        </div>
        <p className="muted metaGridAssetsNote" role="note">
          {dashboardAssetsNote} <Link to="/markets">Markets</Link>
          {" · "}
          <button type="button" className="btnLink btnLinkMuted" onClick={() => setAssetsExplanationOpen(true)}>
            {dashboardAssetsComingSoonCta}
          </button>
        </p>
        {assetsExplanationOpen && (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="dashboard-assets-explanation-title" onClick={() => setAssetsExplanationOpen(false)}>
            <div className="modal modal--narrow" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h2 id="dashboard-assets-explanation-title" className="modalTitle">{marketsMockExplanationModalTitle}</h2>
                <button type="button" className="btn btnSecondary btnSmall" onClick={() => setAssetsExplanationOpen(false)}>{closeLabelUi}</button>
              </div>
              <div className="modalBody">
                <p className="modalBodyText">{marketsMockExplanationModalBody}</p>
              </div>
            </div>
          </div>
        )}
      </details>
      {wallet.chainId === LOCAL_CHAIN_ID && (wallet.account ?? currentDeployments?.usd8Address ?? genesisBlockHash) && (
        <ChainProofAnchors
          chainId={wallet.chainId}
          account={wallet.account}
          tokenAddress={currentDeployments?.usd8Address}
          genesisBlockHash={genesisBlockHash}
        />
      )}
      </div>
      {wallet.error && wallet.isMetaMaskAvailable && <p className="errorText">{walletErrorPrefix}{wallet.error}</p>}
      {preflight.preflight && (
        <PreflightModal
          preflight={preflight.preflight}
          preflightError={preflight.preflightError}
          preflightSubmitting={preflight.preflightSubmitting}
          symbol={symbol}
          txBusy={txBusy}
          supplyApyFormatted={dashboard.data?.pool != null ? form.formatPercent(dashboard.data.pool.supplyRate) : undefined}
          borrowApyFormatted={dashboard.data?.pool != null ? form.formatPercent(dashboard.data.pool.borrowRate) : undefined}
          impact={preflight.preflight.impact}
          estimatedGas={preflight.preflight.gasEstimate?.estimatedGas}
          estimatedFee={preflight.preflight.gasEstimate?.estimatedFee}
          simulationFailed={preflight.preflight.gasEstimate?.simulationFailed}
          simulationFailedPolicy={preflight.preflight.gasEstimate?.simulationFailedPolicy}
          onClose={preflight.closePreflight}
          onConfirm={preflight.confirmPreflight}
          writesDisabledByMismatch={writesDisabledByMismatch}
          networkMismatchMessage={preflightErrorNetworkMismatch}
        />
      )}
    </>
  );
}
