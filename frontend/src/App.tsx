import "./App.css";
import { formatUnits, parseUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { deployments } from "./contracts/deployments";
import { getContracts } from "./contracts/contracts";
import { shortAddress, healthFactorColor } from "./utils/format";
import { useWallet } from "./hooks/useWallet";
import { useTokenMetadata } from "./hooks/useTokenMetadata";
import { useDashboard } from "./hooks/useDashboard";
import { useActions } from "./hooks/useActions";
import { useAllowance } from "./hooks/useAllowance";

export default function App() {
  const wallet = useWallet();
  const [inputs, setInputs] = useState({ supply: "", withdraw: "", borrow: "", repay: "" });

  const isCorrectNetwork = wallet.chainId === deployments.chainId;

  const contracts = useMemo(() => {
    if (!wallet.provider) return undefined;
    return getContracts(wallet.provider);
  }, [wallet.provider]);

  const usd8Meta = useTokenMetadata(contracts?.usd8);
  const usd8Decimals = usd8Meta.decimals ?? 18;

  const dashboard = useDashboard(wallet.provider, wallet.account);
  const actions = useActions({
    provider: wallet.provider,
    account: wallet.account,
    usd8: dashboard.contracts?.usd8,
    lending: dashboard.contracts?.lending,
    decimals: usd8Decimals,
    onConfirmed: () => void dashboard.refresh(),
  });

  const allowance = useAllowance({
    token: dashboard.contracts?.usd8,
    owner: wallet.account,
    spender: deployments.simpleLendingAddress,
  });

  const supplyInputAmount = useMemo(() => {
    try {
      if (!inputs.supply.trim()) return undefined;
      return parseUnits(inputs.supply.trim(), usd8Decimals);
    } catch {
      return undefined;
    }
  }, [inputs.supply, usd8Decimals]);

  const isAllowanceSufficient =
    supplyInputAmount !== undefined && allowance.allowance !== undefined
      ? allowance.allowance >= supplyInputAmount
      : undefined;

  useEffect(() => {
    if (wallet.account) {
      void dashboard.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.account, wallet.chainId]);

  // Fail-safe refresh: block listener as a lightweight fallback.
  // Only enabled when connected + correct chain + no signing/pending tx.
  useEffect(() => {
    const provider = wallet.provider;
    if (!provider || !wallet.account || !isCorrectNetwork) return;
    if (actions.tx.stage === "pending" || actions.tx.stage === "signing") return;
    if (dashboard.loading) return;

    let lastRefreshMs = 0;
    const onBlock = () => {
      const now = Date.now();
      if (now - lastRefreshMs < 3000) return;
      lastRefreshMs = now;
      void dashboard.refresh();
    };

    provider.on("block", onBlock);
    return () => {
      provider.off("block", onBlock);
    };
  }, [actions.tx.stage, dashboard, isCorrectNetwork, wallet.account, wallet.provider]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <h2>Dashboard (Part 2)</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => void wallet.connect()} disabled={!wallet.isMetaMaskAvailable}>
          {wallet.account ? "Connected" : "Connect MetaMask"}
        </button>
        <button onClick={() => void dashboard.refresh()} disabled={!wallet.account || dashboard.loading}>
          {dashboard.loading ? "Refreshing…" : "Refresh"}
        </button>
        <div>ChainId: {wallet.chainId ?? "-"}</div>
        <div>Account: {wallet.account ? shortAddress(wallet.account) : "-"}</div>
      </div>

      <hr />

      <div style={{ fontSize: 14, opacity: 0.85 }}>
        <div>USD8: {deployments.usd8Address}</div>
        <div>WETH: {deployments.wethAddress}</div>
        <div>SimpleLending: {deployments.simpleLendingAddress}</div>
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
        </p>
      )}

      <h3>Actions</h3>
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
            disabled={!actions.ready || !isCorrectNetwork || actions.tx.stage === "pending" || actions.tx.stage === "signing"}
            onClick={() => void actions.supply(inputs.supply)}
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
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={!actions.ready || !isCorrectNetwork || actions.tx.stage === "pending" || actions.tx.stage === "signing"}
            onClick={() => void actions.withdraw(inputs.withdraw)}
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
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={!actions.ready || !isCorrectNetwork || actions.tx.stage === "pending" || actions.tx.stage === "signing"}
            onClick={() => void actions.borrow(inputs.borrow)}
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
          <button
            style={{ marginTop: 8, width: "100%" }}
            disabled={!actions.ready || !isCorrectNetwork || actions.tx.stage === "pending" || actions.tx.stage === "signing"}
            onClick={() => void actions.repay(inputs.repay)}
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
        <li>totalSupply: {dashboard.data?.pool.totalSupply.toString() ?? "-"}</li>
        <li>totalBorrow: {dashboard.data?.pool.totalBorrow.toString() ?? "-"}</li>
        <li>utilizationRate: {dashboard.data?.pool.utilizationRate.toString() ?? "-"}</li>
        <li>supplyRate: {dashboard.data?.pool.supplyRate.toString() ?? "-"}</li>
        <li>borrowRate: {dashboard.data?.pool.borrowRate.toString() ?? "-"}</li>
      </ul>

      <h3>User Position</h3>
      <ul>
        <li>supplied: {dashboard.data?.position.supplied.toString() ?? "-"}</li>
        <li>borrowed: {dashboard.data?.position.borrowed.toString() ?? "-"}</li>
        <li>collateralValue: {dashboard.data?.position.collateralValue.toString() ?? "-"}</li>
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
        <li>maxWithdraw: {dashboard.data?.position.maxWithdraw.toString() ?? "-"}</li>
        <li>maxBorrow: {dashboard.data?.position.maxBorrow.toString() ?? "-"}</li>
      </ul>
    </div>
  );
}

