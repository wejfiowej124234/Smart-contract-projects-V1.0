import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { WalletProvider } from "./useWallet";

// Mock network config to keep the test deterministic (DEFAULT_CHAIN_ID required for switchToExpectedChain)
vi.mock("../config/network", () => ({
  AUTO_ADD_CHAIN: false,
  DEFAULT_CHAIN_ID: 31337,
  EXPECTED_CHAIN_ID: 31337,
  EXPECTED_CHAIN_NAME: "Local (31337)",
  LOCAL_RPC_URL: undefined,
  getRpcUrls: () => [],
}));

type RequestArgs = { method: string; params?: unknown[] };

describe("useWallet", () => {
  it("reports MetaMask missing when window.ethereum is absent", async () => {
    // ensure clean global
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, "ethereum");

    const { useWallet } = await import("./useWallet");
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(WalletProvider, null, children);
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isMetaMaskAvailable).toBe(false);
    expect(result.current.error).toBe("MetaMask not found");
  });

  it("connect() switches chain then requests accounts", async () => {
    const calls: string[] = [];

    const ethereum = {
      on: () => {},
      removeListener: () => {},
      request: vi.fn(async ({ method }: RequestArgs) => {
        calls.push(method);
        if (method === "eth_chainId") return "0x1";
        if (method === "wallet_switchEthereumChain") return null;
        if (method === "eth_requestAccounts") return ["0x0000000000000000000000000000000000000001"];
        if (method === "eth_accounts") return ["0x0000000000000000000000000000000000000001"];
        return null;
      }),
    };

    (window as unknown as Record<string, unknown>).ethereum = ethereum;

    const { useWallet } = await import("./useWallet");
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(WalletProvider, null, children);
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(ethereum.request).toHaveBeenCalled();
    expect(calls).toContain("wallet_switchEthereumChain");
    expect(calls).toContain("eth_requestAccounts");
    expect(result.current.account).toBe("0x0000000000000000000000000000000000000001");
  });
});
