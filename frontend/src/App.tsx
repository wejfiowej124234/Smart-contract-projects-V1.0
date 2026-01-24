import "./App.css";
import { formatUnits, getAddress } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { deployments } from "./contracts/deployments";
import { getContracts } from "./contracts/contracts";
import { shortAddress, healthFactorColor } from "./utils/format";
import { useWallet } from "./hooks/useWallet";
import { useTokenMetadata } from "./hooks/useTokenMetadata";
import { useDashboard } from "./hooks/useDashboard";
import { useActions } from "./hooks/useActions";
import { useAllowance } from "./hooks/useAllowance";
import { TX_IDLE } from "./state/tx";
import { parseAmountStrict } from "./utils/amount";

type PreflightAction = "Supply" | "Withdraw" | "Borrow" | "Repay";

function toChecksum(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}

function AddressDisplay(props: { label: string; address?: string }) {
  const { label, address } = props;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const shown = address ? toChecksum(address) : "-";

  const onCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(toChecksum(address));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: 110, opacity: 0.85 }}>{label}:</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
        {address ? (expanded ? shown : shortAddress(shown)) : "-"}
      </div>
      {address && (
        <>
          <button style={{ padding: "2px 8px" }} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide" : "Show"}
          </button>
          <button style={{ padding: "2px 8px" }} onClick={() => void onCopy()}>
            {copied ? "Copied" : "Copy"}
          </button>
        </>
      )}
    </div>
  );
}

function safeMaxWei(maxWei: bigint | undefined): bigint | undefined {
  if (maxWei === undefined) return undefined;
  return maxWei > 0n ? maxWei - 1n : 0n;
}

export default function App() {
  const wallet = useWallet();
  const [inputs, setInputs] = useState({ supply: "", withdraw: "", borrow: "", repay: "" });
  const [approveMode, setApproveMode] = useState<"exact" | "infinite">("exact");

  const [preflight, setPreflight] = useState<
    | undefined
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
  >(undefined);

  const [preflightError, setPreflightError] = useState<string | undefined>(undefined);

  const isCorrectNetwork = wallet.chainId === deployments.chainId;

  const contracts = useMemo(() => {
    if (!wallet.provider) return undefined;
    return getContracts(wallet.provider);
  }, [wallet.provider]);

  const usd8Meta = useTokenMetadata(contracts?.usd8);
  const usd8Decimals = usd8Meta.decimals ?? 18;

  const dashboard = useDashboard(wallet.provider, wallet.account);

  const allowance = useAllowance({
    token: dashboard.contracts?.usd8,
    owner: wallet.account,
    spender: deployments.simpleLendingAddress,
  });

  const actions = useActions({
    provider: wallet.provider,
    account: wallet.account,
    chainId: wallet.chainId,
    usd8: dashboard.contracts?.usd8,
    lending: dashboard.contracts?.lending,
    decimals: usd8Decimals,
    approveMode,
    onConfirmed: () => {
      allowance.refresh();
      void dashboard.refresh();
    },
  });

  const supplyParsed = useMemo(
    () => (inputs.supply.trim() ? parseAmountStrict(inputs.supply, usd8Decimals) : undefined),
    [inputs.supply, usd8Decimals],
  );
  const withdrawParsed = useMemo(
    () => (inputs.withdraw.trim() ? parseAmountStrict(inputs.withdraw, usd8Decimals) : undefined),
    [inputs.withdraw, usd8Decimals],
  );
  const borrowParsed = useMemo(
    () => (inputs.borrow.trim() ? parseAmountStrict(inputs.borrow, usd8Decimals) : undefined),
    [inputs.borrow, usd8Decimals],
  );
  const repayParsed = useMemo(
    () => (inputs.repay.trim() ? parseAmountStrict(inputs.repay, usd8Decimals) : undefined),
    [inputs.repay, usd8Decimals],
  );

  const isAllowanceSufficient =
    supplyParsed?.ok && allowance.allowance !== undefined
      ? allowance.allowance >= supplyParsed.value
      : undefined;

  const canSupply = !!supplyParsed?.ok;
  const canWithdraw = !!withdrawParsed?.ok;
  const canBorrow = !!borrowParsed?.ok;
  const canRepay = !!repayParsed?.ok;

  const fmtToken = (v: bigint | undefined, decimals: number) => (v !== undefined ? formatUnits(v, decimals) : "-");
  const fmtPercent = (v: bigint | undefined) => (v !== undefined ? `${v.toString()}%` : "-");

  const txStage = actions.tx.stage;
  const setTx = actions.setTx;

  const dashboardRefresh = dashboard.refresh;
  const dashboardLoading = dashboard.loading;
  const dashboardBackfill = dashboard.backfillEvents;

  useEffect(() => {
    if (wallet.account) {
      void dashboardRefresh();
    }
  }, [dashboardRefresh, wallet.account, wallet.chainId]);

  // Fail-safe refresh: block listener as a lightweight fallback.
  // Only enabled when connected + correct chain + no signing/pending tx.
  useEffect(() => {
    const provider = wallet.provider;
    if (!provider || !wallet.account || !isCorrectNetwork) return;
    if (txStage === "pending" || txStage === "signing" || txStage === "stuck") return;
    if (dashboardLoading) return;

    let lastRefreshMs = 0;
    const onBlock = () => {
      const now = Date.now();
      if (now - lastRefreshMs < 3000) return;
      lastRefreshMs = now;

      // Backfill missed events (best-effort) before refreshing reads.
      void dashboardBackfill?.();
      void dashboardRefresh();
    };

    provider.on("block", onBlock);
    return () => {
      provider.off("block", onBlock);
    };
  }, [txStage, dashboardBackfill, dashboardLoading, dashboardRefresh, isCorrectNetwork, wallet.account, wallet.provider]);

  // Auto-clear confirmed tx state for a cleaner UX.
  useEffect(() => {
    if (txStage !== "confirmed") return;
    const t = window.setTimeout(() => setTx(TX_IDLE), 2500);
    return () => window.clearTimeout(t);
  }, [setTx, txStage]);

  const openPreflight = (action: PreflightAction, amountText: string) => {
    setPreflightError(undefined);
    setPreflight({
      action,
      amountText,
      snapshot: {
        account: wallet.account,
        chainId: wallet.chainId,
        approveMode,
        token: deployments.usd8Address,
        spender: deployments.simpleLendingAddress,
      },
    });
  };

  const closePreflight = () => {
    setPreflight(undefined);
    setPreflightError(undefined);
  };

  const confirmPreflight = async () => {
    if (!preflight) return;
    const { action, amountText, snapshot } = preflight;

    // Validate amount at confirm time using the frozen input text.
    const parsed = parseAmountStrict(amountText, usd8Decimals);
    if (!parsed.ok) {
      setPreflightError(parsed.error);
      return;
    }

    // Re-validate identity: account/chain/allowance mode must match what the user reviewed.
    if (wallet.account !== snapshot.account || wallet.chainId !== snapshot.chainId) {
      setPreflightError("Wallet account or network changed. Please review and confirm again.");
      return;
    }
    if (approveMode !== snapshot.approveMode) {
      setPreflightError("Approval mode changed. Please review and confirm again.");
      return;
    }
    if (!isCorrectNetwork) {
      setPreflightError("Wrong network. Please switch to the expected chain and try again.");
      return;
    }

    closePreflight();
    if (action === "Supply") return void actions.supply(amountText);
    if (action === "Withdraw") return void actions.withdraw(amountText);
    if (action === "Borrow") return void actions.borrow(amountText);
    return void actions.repay(amountText);
  };

  const onUseMaxWithdrawSafe = () => {
    const maxWei = dashboard.data?.position.maxWithdraw;
    const safeWei = safeMaxWei(maxWei);
    if (!safeWei || safeWei === 0n) return;
    setInputs((p) => ({ ...p, withdraw: formatUnits(safeWei, usd8Decimals) }));
  };

  const onUseMaxBorrowSafe = () => {
    const maxWei = dashboard.data?.position.maxBorrow;
    const safeWei = safeMaxWei(maxWei);
    if (!safeWei || safeWei === 0n) return;
    setInputs((p) => ({ ...p, borrow: formatUnits(safeWei, usd8Decimals) }));
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h2>Dashboard (Part 2)</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => void wallet.connect()} disabled={!wallet.isMetaMaskAvailable || !!wallet.account}>
          {wallet.account ? "Connected" : "Connect MetaMask"}
        </button>
        <button onClick={() => void dashboard.refresh()} disabled={!wallet.account || dashboard.loading}>
          {dashboard.loading ? "Refreshing…" : "Refresh"}
        </button>
        <div>ChainId: {wallet.chainId ?? "-"}</div>
        <div>Account: {wallet.account ? shortAddress(toChecksum(wallet.account)) : "-"}</div>
      </div>

      <hr />

      <div style={{ fontSize: 14, opacity: 0.9, display: "grid", gap: 6, marginTop: 4 }}>
        <AddressDisplay label="USD8" address={deployments.usd8Address} />
        <AddressDisplay label="WETH" address={deployments.wethAddress} />
        <AddressDisplay label="SimpleLending" address={deployments.simpleLendingAddress} />
      </div>

      {wallet.error && <p style={{ color: "#ef4444" }}>Wallet error: {wallet.error}</p>}
      {dashboard.error && <p style={{ color: "#ef4444" }}>Dashboard error: {dashboard.error}</p>}

      {wallet.account && wallet.chainId !== undefined && !isCorrectNetwork && (
        <div style={{ border: "1px solid #f59e0b", borderRadius: 8, padding: 12, marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Wrong network</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Expected chainId {deployments.chainId} (Hardhat Local), got {wallet.chainId}. Actions are disabled.
          </div>
          <button style={{ marginTop: 8 }} onClick={() => void wallet.ensureCorrectNetwork()}>
            Switch to 31337
          </button>
        </div>
      )}

      {actions.tx.stage !== "idle" && (
        <p style={{ fontSize: 14 }}>
          Tx: <b>{actions.tx.label}</b> — {actions.tx.stage}
          {actions.tx.hash ? ` (${actions.tx.hash.slice(0, 10)}…)` : ""}
          {actions.tx.error ? ` — ${actions.tx.error.message}` : ""}
          {actions.tx.postState ? ` · post-state: ${actions.tx.postState.status}` : ""}
          {actions.tx.postState?.status === "unverified" && actions.tx.postState.note
            ? ` (${actions.tx.postState.note})`
            : ""}
        </p>
      )}

      {actions.tx.stage === "stuck" && (
        <div style={{ border: "1px solid #f59e0b", borderRadius: 8, padding: 12, marginTop: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Still pending on network</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            This tx may be dropped, replaced (sped up), or delayed by the RPC. You can re-check status or clear the local pending entry.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={() => void actions.refreshPendingTx()} disabled={!wallet.account}>
              Refresh status
            </button>
            <button onClick={() => actions.clearPendingTx()} disabled={!wallet.account}>
              Clear pending
            </button>
          </div>
        </div>
      )}

      {preflight && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => closePreflight()}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>Confirm transaction (pre-wallet)</div>
              <button onClick={() => closePreflight()}>Close</button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 14 }}>
              <div>
                Action: <b>{preflight.action}</b>
              </div>
              <div>
                Amount: <b>{preflight.amountText.trim() || "-"}</b> {usd8Meta.symbol ?? "USD8"}
              </div>
              <div>
                ChainId: <b>{preflight.snapshot.chainId ?? "-"}</b>
              </div>
              <AddressDisplay label="Account" address={preflight.snapshot.account} />
              <AddressDisplay label="Token" address={deployments.usd8Address} />
              <AddressDisplay label="Spender" address={deployments.simpleLendingAddress} />
              {(preflight.action === "Supply" || preflight.action === "Repay") && (
                <div style={{ opacity: 0.9 }}>
                  Approval: <b>{preflight.snapshot.approveMode === "infinite" ? "Infinite" : "Exact"}</b> (may prompt Approve → {preflight.action})
                </div>
              )}
              {preflightError && <div style={{ color: "#ef4444" }}>{preflightError}</div>}
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Enterprise note: this summary makes the target addresses and allowance mode explicit before any wallet prompt.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => closePreflight()}>Cancel</button>
              <button
                onClick={() => void confirmPreflight()}
                disabled={txStage === "pending" || txStage === "signing" || txStage === "stuck"}
              >
                Confirm & open wallet
              </button>
            </div>
          </div>
        </div>
      )}

      <h3>Actions</h3>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.9 }}>
          Approval mode:
          <label style={{ marginLeft: 10 }}>
            <input
              type="radio"
              name="approveMode"
              checked={approveMode === "exact"}
              disabled={!!preflight || txStage === "pending" || txStage === "signing" || txStage === "stuck"}
              onChange={() => setApproveMode("exact")}
            />{" "}
            Exact (safer)
          </label>
          <label style={{ marginLeft: 10 }}>
            <input
              type="radio"
              name="approveMode"
              checked={approveMode === "infinite"}
              disabled={!!preflight || txStage === "pending" || txStage === "signing" || txStage === "stuck"}
              onChange={() => setApproveMode("infinite")}
            />{" "}
            Infinite (convenience)
          </label>
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Enterprise note: infinite approval increases exposure if the lending contract is compromised.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Supply ({usd8Meta.symbol ?? "USD8"})</div>
          <input
            value={inputs.supply}
            onChange={(e) => setInputs((p) => ({ ...p, supply: e.target.value }))}
            placeholder={`Amount (${usd8Meta.decimals ?? 18} decimals)`}
            style={{ width: "100%", padding: 8 }}
          />
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            {supplyParsed && !supplyParsed.ok && <span style={{ color: "#ef4444" }}>{supplyParsed.error}</span>}
            {supplyParsed && !supplyParsed.ok ? <span style={{ marginLeft: 8 }}>·</span> : null}
            Allowance to lending:{" "}
            {allowance.loading
              ? "Loading…"
              : allowance.error
                ? `Error: ${allowance.error}`
                : allowance.allowance !== undefined
                  ? formatUnits(allowance.allowance, usd8Decimals)
                  : "-"}
            {isAllowanceSufficient !== undefined && (
              <span style={{ marginLeft: 8, color: isAllowanceSufficient ? "#22c55e" : "#f59e0b" }}>
                {isAllowanceSufficient ? "Sufficient" : "Needs approve"}
              </span>
            )}
          </div>
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={
              !actions.ready ||
              !isCorrectNetwork ||
              !canSupply ||
              actions.tx.stage === "pending" ||
              actions.tx.stage === "signing" ||
              actions.tx.stage === "stuck"
            }
            onClick={() => openPreflight("Supply", inputs.supply)}
          >
            Supply
          </button>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Withdraw ({usd8Meta.symbol ?? "USD8"})</div>
          <input
            value={inputs.withdraw}
            onChange={(e) => setInputs((p) => ({ ...p, withdraw: e.target.value }))}
            placeholder="Amount"
            style={{ width: "100%", padding: 8 }}
          />
          {withdrawParsed && !withdrawParsed.ok && (
            <div style={{ fontSize: 12, marginTop: 6, color: "#ef4444" }}>{withdrawParsed.error}</div>
          )}
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={
              !actions.ready ||
              !isCorrectNetwork ||
              !canWithdraw ||
              actions.tx.stage === "pending" ||
              actions.tx.stage === "signing" ||
              actions.tx.stage === "stuck"
            }
            onClick={() => openPreflight("Withdraw", inputs.withdraw)}
          >
            Withdraw
          </button>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Borrow ({usd8Meta.symbol ?? "USD8"})</div>
          <input
            value={inputs.borrow}
            onChange={(e) => setInputs((p) => ({ ...p, borrow: e.target.value }))}
            placeholder="Amount"
            style={{ width: "100%", padding: 8 }}
          />
          {borrowParsed && !borrowParsed.ok && (
            <div style={{ fontSize: 12, marginTop: 6, color: "#ef4444" }}>{borrowParsed.error}</div>
          )}
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={
              !actions.ready ||
              !isCorrectNetwork ||
              !canBorrow ||
              actions.tx.stage === "pending" ||
              actions.tx.stage === "signing" ||
              actions.tx.stage === "stuck"
            }
            onClick={() => openPreflight("Borrow", inputs.borrow)}
          >
            Borrow
          </button>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Repay ({usd8Meta.symbol ?? "USD8"})</div>
          <input
            value={inputs.repay}
            onChange={(e) => setInputs((p) => ({ ...p, repay: e.target.value }))}
            placeholder="Amount"
            style={{ width: "100%", padding: 8 }}
          />
          {repayParsed && !repayParsed.ok && (
            <div style={{ fontSize: 12, marginTop: 6, color: "#ef4444" }}>{repayParsed.error}</div>
          )}
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={
              !actions.ready ||
              !isCorrectNetwork ||
              !canRepay ||
              actions.tx.stage === "pending" ||
              actions.tx.stage === "signing" ||
              actions.tx.stage === "stuck"
            }
            onClick={() => openPreflight("Repay", inputs.repay)}
          >
            Repay
          </button>
        </div>
      </div>

      <h3>Balances</h3>
      <ul>
        <li>
          USD8 balanceOf: {dashboard.data ? formatUnits(dashboard.data.usd8Balance, usd8Decimals) : "-"}
        </li>
        <li>WETH balanceOf: {dashboard.data ? formatUnits(dashboard.data.wethBalance, 18) : "-"}</li>
      </ul>

      <h3>Pool</h3>
      <ul>
        <li>
          totalSupply: {fmtToken(dashboard.data?.pool.totalSupply, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}
        </li>
        <li>
          totalBorrow: {fmtToken(dashboard.data?.pool.totalBorrow, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}
        </li>
        <li>utilizationRate: {fmtPercent(dashboard.data?.pool.utilizationRate)}</li>
        <li>supplyRate: {fmtPercent(dashboard.data?.pool.supplyRate)}</li>
        <li>borrowRate: {fmtPercent(dashboard.data?.pool.borrowRate)}</li>
      </ul>

      <h3>User Position</h3>
      <ul>
        <li>
          supplied: {fmtToken(dashboard.data?.position.supplied, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}
        </li>
        <li>
          borrowed: {fmtToken(dashboard.data?.position.borrowed, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}
        </li>
        <li>
          collateralValue: {fmtToken(dashboard.data?.position.collateralValue, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}
        </li>
        <li>
          healthFactor:{" "}
          <span
            style={{
              color: dashboard.data ? healthFactorColor(dashboard.data.position.healthFactor) : undefined,
            }}
          >
            {dashboard.data?.position.healthFactor.toString() ?? "-"}
          </span>
        </li>
        <li>
          maxWithdraw: {fmtToken(dashboard.data?.position.maxWithdraw, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}{" "}
          <button
            style={{ marginLeft: 8, padding: "2px 8px" }}
            disabled={!dashboard.data?.position.maxWithdraw || safeMaxWei(dashboard.data?.position.maxWithdraw) === 0n}
            onClick={onUseMaxWithdrawSafe}
            title={
              dashboard.data?.position.maxWithdraw
                ? "Conservative max (1 wei headroom)"
                : "No available amount"
            }
          >
            Max (safe)
          </button>
        </li>
        <li>
          maxBorrow: {fmtToken(dashboard.data?.position.maxBorrow, usd8Decimals)} {usd8Meta.symbol ?? "USD8"}{" "}
          <button
            style={{ marginLeft: 8, padding: "2px 8px" }}
            disabled={!dashboard.data?.position.maxBorrow || safeMaxWei(dashboard.data?.position.maxBorrow) === 0n}
            onClick={onUseMaxBorrowSafe}
            title={
              dashboard.data?.position.maxBorrow ? "Conservative max (1 wei headroom)" : "No available amount"
            }
          >
            Max (safe)
          </button>
        </li>
      </ul>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
        Max values are best-effort snapshots; on-chain validation applies at execution time.
      </div>
    </div>
  );
}

