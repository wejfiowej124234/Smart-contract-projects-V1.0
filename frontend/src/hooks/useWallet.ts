import { BrowserProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Eip1193Provider } from "../types/ethereum";
import { normalizeError } from "../state/errors";
import { assertDefined } from "../utils/assert";

/**
 * CN：钱包层（EIP-1193 / MetaMask）：连接、自动切链到 31337、持久化连接状态、监听账号/网络变化。
 * EN: Wallet layer (EIP-1193 / MetaMask): connect, auto-switch to chain 31337, persist connection, handle account/network changes.
 */

const LOCAL_CHAIN_ID = 31337;

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

async function switchToLocalhost(eth: Eip1193Provider): Promise<void> {
  const chainIdHex = "0x7a69"; // 31337

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch (err: unknown) {
    // 4902 = chain not added
    const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined;
    if (code !== 4902) throw err;
  }

  await eth.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chainIdHex,
        chainName: "Hardhat Local",
        rpcUrls: ["http://127.0.0.1:8545"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      },
    ],
  });

  await eth.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chainIdHex }],
  });
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => ({
    isMetaMaskAvailable: typeof window !== "undefined" && !!window.ethereum,
  }));

  const eth = useMemo(() => (typeof window !== "undefined" ? window.ethereum : undefined), []);

  const refresh = useCallback(async () => {
    if (!eth) {
      setState({ isMetaMaskAvailable: false, error: "MetaMask not found" });
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
    const ethProvider = assertDefined(eth, "MetaMask not found");
    try {
      await switchToLocalhost(ethProvider);
      const accounts = (await ethProvider.request({ method: "eth_requestAccounts" })) as string[];
      const account = accounts?.[0];
      const chainId = await getChainId(ethProvider);
      const provider = new BrowserProvider(ethProvider);
      setState({ isMetaMaskAvailable: true, provider, account, chainId });
      localStorage.setItem("connected", "true");
      if (account) localStorage.setItem("lastAccount", account);
    } catch (e: unknown) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(e).message,
      }));
    }
  }, [eth]);

  const ensureCorrectNetwork = useCallback(async () => {
    const ethProvider = assertDefined(eth, "MetaMask not found");
    const chainId = await getChainId(ethProvider);
    if (chainId !== LOCAL_CHAIN_ID) {
      await switchToLocalhost(ethProvider);
    }
  }, [eth]);

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

  return {
    ...state,
    connect,
    refresh,
    ensureCorrectNetwork,
  };
}
