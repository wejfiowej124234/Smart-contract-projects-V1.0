import { BrowserProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { errorMetaMaskNotFound, errorChainNotAddedTemplate, errorMissingLocalRpcUrl } from "../config/ui";
import { normalizeError } from "../state/errors";
import { assertDefined } from "../utils/assert";

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

export function useWallet() {
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
      await switchToExpectedChain(ethProvider);
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
    disconnect,
    refresh,
    ensureCorrectNetwork,
  };
}
