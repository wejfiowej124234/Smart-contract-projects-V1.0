import { AddressDisplay } from "../ui/AddressDisplay";
import {
  connectWallet,
  connectWalletHint,
  connected,
  disconnectWallet,
  installMetaMask,
  metaMaskMissing,
  wrongNetwork,
  switchNetwork,
  networkOkLabel,
  networkOkTitle,
  emptyPlaceholder,
  chainIdLabel,
  themeLightLabel,
  themeDarkLabel,
  themeNavyLabel,
  connectingLabel,
  themeToggleTitle,
} from "../../config/ui";
import type { HeaderProps } from "../../types/dashboard";

export function Header({
  appName,
  appLogo,
  theme,
  onThemeToggle,
  connecting = false,
  wallet,
  expectedChainId,
  chainName,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: HeaderProps) {
  const isCorrectNetwork = wallet.chainId === expectedChainId;

  const connectLabel = connecting
    ? connectingLabel
    : wallet.account
      ? connected
      : wallet.isMetaMaskAvailable
        ? connectWallet
        : installMetaMask;

  const nextThemeLabel =
    theme === "light" ? themeDarkLabel : theme === "dark" ? themeNavyLabel : themeLightLabel;
  const currentThemeLabel =
    theme === "light" ? themeLightLabel : theme === "dark" ? themeDarkLabel : themeNavyLabel;
  const themeButtonTitle = themeToggleTitle(currentThemeLabel, nextThemeLabel);

  return (
    <header className="headerBar">
      <div className="headerBarInner">
        <div className="headerBrand">
          {appLogo != null && appLogo !== "" && <span className="headerAppLogo" aria-hidden="true">{appLogo}</span>}
          <span className="headerAppName">{appName}</span>
        </div>
        <div className="headerRight headerRightCompact">
          <button
            type="button"
            className="btn btnSecondary btnSmall"
            onClick={onThemeToggle}
            aria-label={nextThemeLabel}
            title={themeButtonTitle}
          >
            {nextThemeLabel}
          </button>
          {wallet.account ? (
            <button
              type="button"
              className="btn btnSecondary btnSmall"
              onClick={onDisconnect}
              aria-label={disconnectWallet}
            >
              {disconnectWallet}
            </button>
          ) : (
            <button
              type="button"
              className="btn btnPrimary btnSmall"
              onClick={onConnect}
              disabled={connecting}
              aria-label={connectLabel}
              title={connectWalletHint}
            >
              {connectLabel}
            </button>
          )}
          {!wallet.isMetaMaskAvailable && <span className="pill pillErr">{metaMaskMissing}</span>}
          <span className="headerPill" title={`${chainIdLabel}: ${wallet.chainId ?? emptyPlaceholder}`}>
            {wallet.account && wallet.chainId !== undefined ? (
              isCorrectNetwork ? (
                <span className="pill pillOk" title={networkOkTitle}>{networkOkLabel} · {chainName}</span>
              ) : (
                <>
                  <span className="pill pillWarn">{wrongNetwork}</span>
                  <button type="button" className="btn btnWarn btnSmall" onClick={() => void onSwitchNetwork()} aria-label={switchNetwork}>{switchNetwork}</button>
                </>
              )
            ) : (
              <span className="pill muted">{chainIdLabel} {wallet.chainId ?? emptyPlaceholder}</span>
            )}
          </span>
          <div className="headerAccount">
            {wallet.account ? (
              <AddressDisplay label="" address={wallet.account} chainId={wallet.chainId} />
            ) : (
              <span className="pill mono">{emptyPlaceholder}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
