import { BrowserProvider } from "ethers";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Eip1193Provider } from "../types/ethereum";
import {
  AUTO_ADD_CHAIN,
  DEFAULT_CHAIN_ID,
  EXPECTED_CHAIN_ID,
  getChainName,
  getRpcUrl,
  NATIVE_CURRENCY_DECIMALS,
  NATIVE_CURRENCY_NAME,
  NATIVE_CURRENCY_SYMBOL,
} from "../config/network";
import { getRpcStatus as getRpcStatusFromHealth, getHealthyRpcUrl } from "../config/rpcHealth";
import { append as appendSessionEvidence } from "../state/sessionEvidence";
import { errorMetaMaskNotFound, errorChainNotAddedTemplate, errorMissingLocalRpcUrl } from "../config/ui";
import { normalizeError } from "../state/errors";
import { assertDefined } from "../utils/assert";
import { accountLast4 as sessionAccountLast4 } from "../state/sessionEvidence";

/**
 * Handles the wallet: connect, switch to the right chain, remember connection,
 * and react to account/network changes so the rest of the app stays in sync.
 */

type WalletState = {
  isMetaMaskAvailable: boolean;
  account?: string;
  chainId?: number;
  provider?: BrowserProvider;
  error?: string;
};

async function getChainId(eth: Eip1193Provider): Promise<number> {
  const hex = (await eth.request({ method: "eth_chainId" })) as string;
  return Number.parseInt(hex, 16);
}

async function switchToExpectedChain(eth: Eip1193Provider, targetChainId: number = DEFAULT_CHAIN_ID): Promise<void> {
  const chainIdHex = `0x${targetChainId.toString(16)}`;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch (err: unknown) {
    const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined;
    if (code !== 4902) throw err;
    if (!AUTO_ADD_CHAIN) {
      throw new Error(errorChainNotAddedTemplate.replace("{chainId}", String(targetChainId)));
    }
  }

  const rpcUrl = getRpcUrl(targetChainId);
  const chainName = getChainName(targetChainId);
  if (!rpcUrl) {
    throw new Error(errorMissingLocalRpcUrl);
  }
  await eth.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chainIdHex,
        chainName,
        rpcUrls: [rpcUrl],
        nativeCurrency: {
          name: NATIVE_CURRENCY_NAME,
          symbol: NATIVE_CURRENCY_SYMBOL,
          decimals: NATIVE_CURRENCY_DECIMALS,
        },
      },
    ],
  });

  await eth.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chainIdHex }],
  });
}

export type WalletContextValue = ReturnType<typeof useWalletState>;
const WalletContext = createContext<WalletContextValue | null>(null);

/** Single source of truth for wallet; wrap app with WalletProvider so Header and pages share state (e.g. disconnect clears balances). */
export function WalletProvider({ children }: { children: ReactNode }) {
  const value = useWalletState();
  return createElement(WalletContext.Provider, { value }, children);
}

function useWalletState() {
  const [state, setState] = useState<WalletState>(() => ({
    isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
  }));

  const eth = useMemo(() => (typeof window !== "undefined" ? window.ethereum : undefined), []);

  const refresh = useCallback(async () => {
    if (!eth) {
      setState({ isMetaMaskAvailable: false, error: errorMetaMaskNotFound });
      return;
    }

    try {
      const provider = new BrowserProvider(eth);
      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      const account = accounts?.[0];
      const chainId = await getChainId(eth);

      if (!account) {
        localStorage.removeItem("connected");
        localStorage.removeItem("lastAccount");
      }

      setState({
        isMetaMaskAvailable: true,
        provider,
        account,
        chainId,
      });
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        isMetaMaskAvailable: true,
        error: normalizeError(e).message,
      }));
    }
  }, [eth]);

  const connect = useCallback(async () => {
    const ethProvider = assertDefined(eth, errorMetaMaskNotFound);
    setState((prev) => ({ ...prev, error: undefined }));
    try {
      const prevChainId = await getChainId(ethProvider);
      await switchToExpectedChain(ethProvider);
      const chainIdAfter = await getChainId(ethProvider);
      if (prevChainId !== chainIdAfter) {
        appendSessionEvidence("SwitchChain", { fromChainId: prevChainId, toChainId: chainIdAfter });
      }
      // Request permissions first so MetaMask shows connect/account picker (otherwise already-authorized site may return current account without prompt)
      try {
        await ethProvider.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Some wallets do not support or user rejected; continue with eth_requestAccounts
      }
      const accounts = (await ethProvider.request({ method: "eth_requestAccounts" })) as string[];
      const account = accounts?.[0];
      const chainId = await getChainId(ethProvider);
      const provider = new BrowserProvider(ethProvider);
      setState({ isMetaMaskAvailable: true, provider, account, chainId });
      localStorage.setItem("connected", "true");
      if (account) localStorage.setItem("lastAccount", account);
      if (account) {
        appendSessionEvidence("Connect", { chainId, accountLast4: sessionAccountLast4(account) });
      }
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(e).message,
      }));
    }
  }, [eth]);

  const ensureCorrectNetwork = useCallback(async () => {
    const ethProvider = assertDefined(eth, errorMetaMaskNotFound);
    const chainId = await getChainId(ethProvider);
    if (chainId !== EXPECTED_CHAIN_ID) {
      await switchToExpectedChain(ethProvider);
    }
  }, [eth]);

  const disconnect = useCallback(() => {
    appendSessionEvidence("Disconnect");
    setState((prev) => ({
      ...prev,
      account: undefined,
      provider: undefined,
      chainId: undefined,
      error: undefined,
    }));
    localStorage.removeItem("connected");
    localStorage.removeItem("lastAccount");
  }, []);

  const [rpcStatusState, setRpcStatusState] = useState<ReturnType<typeof getRpcStatusFromHealth>>(() =>
    getRpcStatusFromHealth()
  );
  const prevRpcStatusRef = useRef<ReturnType<typeof getRpcStatusFromHealth>["status"] | undefined>(undefined);

  useEffect(() => {
    if (state.chainId == null) return;
    let cancelled = false;
    const run = () => {
      getHealthyRpcUrl(state.chainId!).then(() => {
        if (cancelled) return;
        const next = getRpcStatusFromHealth();
        const prev = prevRpcStatusRef.current;
        prevRpcStatusRef.current = next.status;
        setRpcStatusState(next);
        if (prev !== undefined && prev !== next.status) {
          if (next.status === "fallback" && prev === "ok") {
            appendSessionEvidence("RpcFallback", { chainId: state.chainId, reason: "primary failed" });
          } else if (next.status === "ok" && (prev === "fallback" || prev === "unavailable")) {
            appendSessionEvidence("RpcRecovered", { chainId: state.chainId });
          }
        }
      });
    };
    run();
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state.chainId]);

  useEffect(() => {
    void refresh();

    if (!eth?.on || !eth.removeListener) return;

    const onAccountsChanged = () => void refresh();
    const onChainChanged = () => void refresh();
    const onConnect = () => void refresh();
    const onDisconnect = () => void refresh();

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);
    eth.on("connect", onConnect);
    eth.on("disconnect", onDisconnect);

    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
      eth.removeListener?.("connect", onConnect);
      eth.removeListener?.("disconnect", onDisconnect);
    };
  }, [eth, refresh]);

  // Re-sync account when tab becomes visible or window gains focus (e.g. user disconnected in MetaMask then returns).
  useEffect(() => {
    const sync = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", sync);
    };
  }, [refresh]);

  const rpcStatus = useMemo(() => {
    const tier = rpcStatusState.status === "fallback" ? ("fallback" as const) : ("primary" as const);
    let rpcUrlInUse: string | undefined;
    if (rpcStatusState.url) {
      try {
        rpcUrlInUse = new URL(rpcStatusState.url).host;
      } catch {
        // ignore
      }
    }
    return {
      tier,
      rpcUrlInUse,
      rpcFailCount: rpcStatusState.rpcFailCount,
      rpcLastOkAt: rpcStatusState.rpcLastOkAt,
      blockNumber: rpcStatusState.blockNumber,
      blockDrift: rpcStatusState.blockDrift,
    };
  }, [rpcStatusState]);

  return {
    ...state,
    connect,
    disconnect,
    refresh,
    ensureCorrectNetwork,
    rpcStatus,
  };
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
