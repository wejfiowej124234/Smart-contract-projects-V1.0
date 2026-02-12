import { getDefaultChainId, getSupportedChainIds } from "../contracts/deployments";

/** Chain list, RPC URLs, and display names so the app knows which networks are supported and how to switch. */
function envString(key: string): string | undefined {
  const v = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[key];
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}

function envBool(key: string): boolean | undefined {
  const v = envString(key);
  if (!v) return undefined;
  if (v === "1" || v.toLowerCase() === "true") return true;
  if (v === "0" || v.toLowerCase() === "false") return false;
  return undefined;
}

/** Supported chain IDs (from deployments map). */
export const SUPPORTED_CHAIN_IDS: number[] = getSupportedChainIds();

/** Default chain for "switch network" and display when not connected. */
export const DEFAULT_CHAIN_ID: number = getDefaultChainId();

/** @deprecated Use DEFAULT_CHAIN_ID. Kept for compatibility. */
export const EXPECTED_CHAIN_ID: number = DEFAULT_CHAIN_ID;

export function isSupportedChain(chainId: number | undefined): boolean {
  if (chainId === undefined) return false;
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

/** Chain display name; env override or built-in names. */
export function getChainName(chainId: number): string {
  const envKey = `VITE_CHAIN_NAME_${chainId}`;
  const fromEnv = envString(envKey);
  if (fromEnv) return fromEnv;
  const names: Record<number, string> = {
    1: "Ethereum",
    5: "Goerli",
    11155111: "Sepolia",
    31337: "Hardhat Local",
  };
  return names[chainId] ?? `Chain ${chainId}`;
}

// Used only when we need to auto-add a local dev chain in MetaMask.
export const LOCAL_RPC_URL: string | undefined = envString("VITE_LOCAL_RPC_URL");

// Display name used when adding the chain to MetaMask (for default/local chain).
export const EXPECTED_CHAIN_NAME: string =
  envString("VITE_EXPECTED_CHAIN_NAME") ?? getChainName(DEFAULT_CHAIN_ID);

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\b/i.test(url);
}

export const AUTO_ADD_CHAIN: boolean =
  envBool("VITE_AUTO_ADD_CHAIN") ?? (LOCAL_RPC_URL ? isLocalhostUrl(LOCAL_RPC_URL) : false);

export const IS_LOCAL_CHAIN: boolean =
  envBool("VITE_IS_LOCAL_CHAIN") ?? (LOCAL_RPC_URL ? isLocalhostUrl(LOCAL_RPC_URL) : false);

export const WETH_DECIMALS = 18;
export const NATIVE_CURRENCY_NAME = "ETH";
export const NATIVE_CURRENCY_SYMBOL = "ETH";
export const NATIVE_CURRENCY_DECIMALS = 18;

/** RPC URL for wallet_addEthereumChain (per chain). */
export function getRpcUrl(chainId: number): string | undefined {
  if (chainId === 31337) return LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
  const v = envString(`VITE_RPC_URL_${chainId}`);
  return v ?? undefined;
}

export function getBlockExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const base: Record<number, string> = {
    1: "https://etherscan.io/address/",
    5: "https://goerli.etherscan.io/address/",
    11155111: "https://sepolia.etherscan.io/address/",
  };
  const b = base[chainId];
  return b ? `${b}${address}` : undefined;
}
