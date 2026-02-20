import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { appName, appLogo, metaMaskInstallUrl, navActivity, networkMismatchBannerTitle, networkMismatchBannerBody } from "../../config/ui";
import { append as appendSessionEvidence } from "../../state/sessionEvidence";
import { useNavBadges } from "../../state/navBadges";
import { SplitProviderContextProvider } from "../../state/splitProviderContext";
import { DEFAULT_CHAIN_ID, getChainName, isSupportedChain, LOCAL_CHAIN_ID } from "../../config/network";
import { getDeployments } from "../../contracts/deployments";
import { useWallet } from "../../hooks/useWallet";
import { useSplitProvider } from "../../hooks/useSplitProvider";
import { useTheme } from "../../hooks/useTheme";
import { Header } from "./Header";
import { ChainDeploymentFixBanner } from "./ChainDeploymentFixBanner";
import { ChainAddressMismatchBanner } from "./ChainAddressMismatchBanner";
import { RiskDisclaimerBanner } from "../ui/RiskDisclaimerBanner";
import { useChainAddressMatch } from "../../hooks/useChainAddressMatch";
import { ToastContainer } from "../ui/ToastContainer";

const navDashboard = "Dashboard";
const navMarkets = "Markets";
const navGovernance = "Governance";

/** App layout (Dashboard | Markets | Governance). Blueprint: AppLayout. */
export function Layout() {
  const wallet = useWallet();
  const split = useSplitProvider(wallet.chainId);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const badges = useNavBadges();
  const [connecting, setConnecting] = useState(false);
  const isCorrectNetwork = isSupportedChain(wallet.chainId);
  const currentDeployments = getDeployments(wallet.chainId);
  const { match: chainAddressMatch, loading: chainAddressMatchLoading } = useChainAddressMatch(
    wallet.chainId,
    currentDeployments?.simpleLendingAddress,
    currentDeployments?.usd8Address,
    wallet.chainId === LOCAL_CHAIN_ID ? wallet.provider ?? undefined : undefined
  );
  const showChainAddressMismatchBanner =
    !!wallet.account && wallet.chainId === LOCAL_CHAIN_ID && !!currentDeployments && !chainAddressMatchLoading && !chainAddressMatch;
  const showFixBanner = !!wallet.account && (!isCorrectNetwork || !currentDeployments) && !showChainAddressMismatchBanner;
  const showNetworkMismatchBanner = !!wallet.account && split.mismatch;
  const expectedChainIdForHeader = wallet.chainId && isCorrectNetwork ? wallet.chainId : DEFAULT_CHAIN_ID;
  const chainName = getChainName(wallet.chainId ?? DEFAULT_CHAIN_ID);

  useEffect(() => {
    if (wallet.account ?? wallet.error) queueMicrotask(() => setConnecting(false));
  }, [wallet.account, wallet.error]);

  useEffect(() => {
    appendSessionEvidence("ViewPage", { pathname: location.pathname });
  }, [location.pathname]);

  const onConnect = () => {
    if (!wallet.isMetaMaskAvailable) {
      window.open(metaMaskInstallUrl, "_blank", "noreferrer");
      return;
    }
    setConnecting(true);
    void wallet.connect();
  };

  return (
    <SplitProviderContextProvider value={split}>
      <div data-testid="app-layout">
        <a href="#main-content" className="skipLink">Skip to main content</a>
        <Header
          appName={appName}
          appLogo={appLogo}
          theme={theme}
          onThemeToggle={() =>
            setTheme(theme === "light" ? "dark" : theme === "dark" ? "dark-navy" : "light")
          }
          connecting={connecting}
          wallet={wallet}
          expectedChainId={expectedChainIdForHeader}
          chainName={chainName}
          onConnect={onConnect}
          onDisconnect={wallet.disconnect}
          onSwitchNetwork={() => void wallet.ensureCorrectNetwork()}
        />
        <main id="main-content" className="mainContent" tabIndex={-1}>
          {showChainAddressMismatchBanner && <ChainAddressMismatchBanner />}
          {showFixBanner && <ChainDeploymentFixBanner />}
          {showNetworkMismatchBanner && (
            <div className="banner bannerErr" role="alert" data-testid="network-mismatch-banner">
              <strong>{networkMismatchBannerTitle}</strong> — {networkMismatchBannerBody}
            </div>
          )}
          <RiskDisclaimerBanner />
        <nav className="mainNav" aria-label="Main" data-testid="main-nav">
          <Link to="/" className={location.pathname === "/" ? "navLink active" : "navLink"} data-testid="nav-dashboard">
            {navDashboard}
            {badges.dashboard && <span className="navBadge" aria-hidden>{badges.dashboard}</span>}
          </Link>
          <Link to="/markets" className={location.pathname === "/markets" ? "navLink active" : "navLink"} data-testid="nav-markets">
            {navMarkets}
          </Link>
          <Link to="/governance" className={location.pathname === "/governance" ? "navLink active" : "navLink"} data-testid="nav-governance">
            {navGovernance}
            {badges.governance && <span className="navBadge" aria-hidden>{badges.governance}</span>}
          </Link>
          <Link to="/activity" className={location.pathname === "/activity" ? "navLink active" : "navLink"} data-testid="nav-activity">
            {navActivity}
            {badges.activity && <span className="navBadge navBadge--activity" aria-hidden>{badges.activity}</span>}
          </Link>
        </nav>
        <div key={location.pathname} className="pageTransitionWrap">
          <Outlet />
        </div>
        </main>
        <ToastContainer />
      </div>
    </SplitProviderContextProvider>
  );
}

/** Alias for refactor blueprint §10.1 (AppLayout). */
export { Layout as AppLayout };
