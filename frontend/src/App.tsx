import "./App.css";
import { useEffect, useState } from "react";
import { getDeployments } from "./contracts/deployments";
import {
  appName,
  appLogo,
  emptyPlaceholder,
  actionsSectionTitle,
  actionsConnectWalletBanner,
  actionEnterAmountHint,
  contractsSectionLabel,
  walletErrorPrefix,
  dashboardErrorPrefix,
  usd8Label,
  wethLabel,
  simpleLendingLabel,
  defaultSymbol,
  metaMaskInstallUrl,
  unsupportedNetworkBanner,
  localChainResetAccountHint,
} from "./config/ui";
import { DEFAULT_CHAIN_ID, getChainName, isSupportedChain } from "./config/network";
import { DEFAULT_DECIMALS, BLOCK_DEBOUNCE_MS, TX_IDLE_RESET_DELAY_MS } from "./config/runtime";
import { useWallet } from "./hooks/useWallet";
import { useTheme } from "./hooks/useTheme";
import { useTokenMetadata } from "./hooks/useTokenMetadata";
import { useDashboard } from "./hooks/useDashboard";
import { useActions } from "./hooks/useActions";
import { useAllowance } from "./hooks/useAllowance";
import { useDashboardForm } from "./hooks/useDashboardForm";
import { useTxDisplay } from "./hooks/useTxDisplay";
import { usePreflight } from "./hooks/usePreflight";
import { TX_IDLE } from "./state/tx";
import { safeMaxWei } from "./utils/amount";
import { AddressDisplay } from "./components/ui/AddressDisplay";
import { Header } from "./components/layout/Header";
import { DataStatusBar } from "./components/layout/DataStatusBar";
import { ActionCardsGrid } from "./components/actions/ActionCardsGrid";
import { DashboardGrid } from "./components/dashboard/DashboardGrid";
import { ApproveToolbar } from "./components/actions/ApproveToolbar";
import { TxStatus } from "./components/tx/TxStatus";
import { PreflightModal } from "./components/ui/PreflightModal";

export default function App() {
  const wallet = useWallet();
  const { theme, setTheme } = useTheme();
  const [approveMode, setApproveMode] = useState<"exact" | "infinite">("exact");
  const [connecting, setConnecting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSuccessHighlight, setShowSuccessHighlight] = useState(false);
  const currentDeployments = getDeployments(wallet.chainId);
  const dashboard = useDashboard(wallet.provider, wallet.account, wallet.chainId);
  const usd8Meta = useTokenMetadata(dashboard.contracts?.usd8);
  const usd8Decimals = usd8Meta.decimals ?? DEFAULT_DECIMALS;
  const symbol = usd8Meta.symbol ?? defaultSymbol;
  const allowance = useAllowance({
    token: dashboard.contracts?.usd8,
    owner: wallet.account,
    spender: currentDeployments?.simpleLendingAddress,
  });
  const actions = useActions({
    provider: wallet.provider,
    account: wallet.account,
    chainId: wallet.chainId,
    usd8: dashboard.contracts?.usd8,
    lending: dashboard.contracts?.lending,
    simpleLendingAddress: currentDeployments?.simpleLendingAddress,
    decimals: usd8Decimals,
    approveMode,
    onConfirmed: () => {
      allowance.refresh();
      void dashboard.refresh();
    },
  });
  const isCorrectNetwork = isSupportedChain(wallet.chainId);
  const dashboardReady = !!wallet.account && isCorrectNetwork && !!currentDeployments;
  const txBusy = actions.tx.stage === "pending" || actions.tx.stage === "signing" || actions.tx.stage === "stuck";
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
    wallet: { account: wallet.account, chainId: wallet.chainId },
    usd8Decimals,
    approveMode,
    isCorrectNetwork,
    currentDeployments: currentDeployments ?? null,
  });

  const onConnect = () => {
    if (!wallet.isMetaMaskAvailable) {
      window.open(metaMaskInstallUrl, "_blank", "noreferrer");
      return;
    }
    setConnecting(true);
    void wallet.connect();
  };

  useEffect(() => {
    if (wallet.account ?? wallet.error) queueMicrotask(() => setConnecting(false));
  }, [wallet.account, wallet.error]);

  useEffect(() => {
    if (wallet.account) void dashboard.refresh();
  }, [wallet.account, wallet.chainId, dashboard.refresh]);
  useEffect(() => {
    if (!wallet.provider || !wallet.account || !isCorrectNetwork || dashboard.loading || txBusy) return;
    let last = 0;
    const onBlock = () => {
      if (!autoRefresh) return;
      const now = Date.now();
      if (now - last < BLOCK_DEBOUNCE_MS) return;
      last = now;
      void dashboard.backfillEvents?.();
      void dashboard.refresh();
    };
    wallet.provider.on("block", onBlock);
    return () => { wallet.provider?.off("block", onBlock); };
  }, [autoRefresh, txBusy, dashboard.loading, dashboard.refresh, dashboard.backfillEvents, isCorrectNetwork, wallet.account, wallet.provider]);
  useEffect(() => {
    if (actions.tx.stage !== "confirmed") return;
    const t = window.setTimeout(() => actions.setTx(TX_IDLE), TX_IDLE_RESET_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [actions.tx.stage, actions.setTx]);

  useEffect(() => {
    if (actions.tx.stage !== "confirmed") return;
    queueMicrotask(() => setShowSuccessHighlight(true));
    const t = window.setTimeout(() => setShowSuccessHighlight(false), 2500);
    return () => window.clearTimeout(t);
  }, [actions.tx.stage]);

  // Clear the amount input for the action that just succeeded so the field doesn’t keep showing e.g. 11.111
  useEffect(() => {
    if (actions.tx.stage !== "confirmed" || !actions.tx.label) return;
    const label = actions.tx.label;
    form.setInputs((prev) => ({
      ...prev,
      supply: label === "Supply" ? "" : prev.supply,
      withdraw: label === "Withdraw" ? "" : prev.withdraw,
      borrow: label === "Borrow" ? "" : prev.borrow,
      repay: label === "Repay" ? "" : prev.repay,
    }));
  }, [actions.tx.stage, actions.tx.label, form.setInputs]);

  const lastUpdatedText = dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleTimeString() : emptyPlaceholder;
  const displayChainId = wallet.chainId ?? DEFAULT_CHAIN_ID;
  const chainName = getChainName(displayChainId);
  const expectedChainIdForHeader = wallet.chainId && isCorrectNetwork ? wallet.chainId : DEFAULT_CHAIN_ID;

  return (
    <div>
      <Header appName={appName} appLogo={appLogo} theme={theme} onThemeToggle={() =>
          setTheme(
            theme === "light" ? "dark" : theme === "dark" ? "dark-navy" : "light"
          )} connecting={connecting} wallet={wallet} expectedChainId={expectedChainIdForHeader} chainName={chainName} onConnect={onConnect} onDisconnect={wallet.disconnect} onSwitchNetwork={() => void wallet.ensureCorrectNetwork()} />
      <main className="mainContent">
        {wallet.account && !isCorrectNetwork && (
          <div className="banner bannerWarn" role="alert">
            {unsupportedNetworkBanner}
          </div>
        )}
        {wallet.account && isCorrectNetwork && wallet.chainId === 31337 && (
          <div className="banner bannerInfo" role="status" aria-live="polite">
            {localChainResetAccountHint}
          </div>
        )}
        <DataStatusBar onRefresh={() => void dashboard.refresh()} loading={dashboard.loading} hasAccount={!!wallet.account} isCorrectNetwork={isCorrectNetwork} lastUpdatedText={lastUpdatedText} blockNumber={dashboard.blockNumber} isMetaMaskAvailable={wallet.isMetaMaskAvailable} autoRefresh={autoRefresh} onAutoRefreshChange={setAutoRefresh} />
        {dashboard.error && (
          <p className="errorText dashboardErrorInline" role="alert">
            {dashboardErrorPrefix}{dashboard.error}
          </p>
        )}
        {actions.tx.stage !== "idle" && (
          <div className={`txStatusBlock${showSuccessHighlight ? " txStatusBlock--success" : ""}`}>
            <TxStatus tx={actions.tx} setTx={actions.setTx} {...txDisplay} disableRefreshClear={!wallet.account} />
          </div>
        )}
        <DashboardGrid hasAccount={!!wallet.account} loading={dashboard.loading} data={dashboard.data} usd8Decimals={usd8Decimals} formatToken={form.formatToken} formatPercent={form.formatPercent} />
        <section className="actionsSection">
          <h3 className="sectionTitle">{actionsSectionTitle}</h3>
          {!wallet.account && (
            <div className="banner bannerWarn actionsConnectBanner" role="status" aria-live="polite">
              {actionsConnectWalletBanner}
            </div>
          )}
          <ApproveToolbar approveMode={approveMode} setApproveMode={setApproveMode} disabled={!!preflight.preflight || txBusy} />
          <ActionCardsGrid form={form} preflight={preflight} actions={actions} dashboardReady={dashboardReady} txBusy={txBusy} wallet={wallet} dashboard={dashboard} allowance={allowance} symbol={symbol} usd8Decimals={usd8Decimals} />
          {wallet.account && !form.inputs.supply.trim() && !form.inputs.withdraw.trim() && !form.inputs.borrow.trim() && !form.inputs.repay.trim() && (
            <p className="muted actionEnterAmountHint" role="status">{actionEnterAmountHint}</p>
          )}
        </section>
        <hr className="divider" />
        <details className="metaGridDetails" open={false}>
          <summary className="metaGridSummary">{contractsSectionLabel}</summary>
          <div className="metaGrid">
            <AddressDisplay label={usd8Label} address={currentDeployments?.usd8Address} chainId={wallet.chainId} />
            <AddressDisplay label={wethLabel} address={currentDeployments?.wethAddress} chainId={wallet.chainId} />
            <AddressDisplay label={simpleLendingLabel} address={currentDeployments?.simpleLendingAddress} chainId={wallet.chainId} />
          </div>
        </details>
        {wallet.error && wallet.isMetaMaskAvailable && <p className="errorText">{walletErrorPrefix}{wallet.error}</p>}
      </main>
      {preflight.preflight && <PreflightModal preflight={preflight.preflight} preflightError={preflight.preflightError} preflightSubmitting={preflight.preflightSubmitting} symbol={symbol} txBusy={txBusy} supplyApyFormatted={dashboard.data?.pool != null ? form.formatPercent(dashboard.data.pool.supplyRate) : undefined} borrowApyFormatted={dashboard.data?.pool != null ? form.formatPercent(dashboard.data.pool.borrowRate) : undefined} onClose={preflight.closePreflight} onConfirm={preflight.confirmPreflight} />}
    </div>
  );
}
