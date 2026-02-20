import { Outlet, Link } from "react-router-dom";
import { appName } from "../../config/ui";
import { useWallet } from "../../hooks/useWallet";
import { DEFAULT_CHAIN_ID, getChainName } from "../../config/network";

export function AdminLayout() {
  const wallet = useWallet();
  const chainName = getChainName(wallet.chainId ?? DEFAULT_CHAIN_ID);

  return (
    <div data-testid="admin-layout">
      <header className="headerBar adminHeader">
        <div className="headerBarInner">
          <div className="headerBrand">
            <span className="headerAppName">{appName} — Admin</span>
          </div>
          <div className="headerRight">
            <Link to="/" className="btn btnSecondary btnSmall" data-testid="admin-back-to-app">
              ← App
            </Link>
            <span className="headerPill" aria-label="Network">
              {chainName}
            </span>
            {wallet.account ? (
              <span className="headerAccount addressRow">
                <span className="addressValue">{wallet.account.slice(0, 6)}…{wallet.account.slice(-4)}</span>
              </span>
            ) : (
              <span className="muted">Not connected</span>
            )}
          </div>
        </div>
      </header>
      <main className="mainContent adminMain">
        <nav className="adminNav" aria-label="Admin">
          <Link to="/admin/proposals" className="adminNavLink" data-testid="admin-nav-proposals">
            Proposals
          </Link>
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
