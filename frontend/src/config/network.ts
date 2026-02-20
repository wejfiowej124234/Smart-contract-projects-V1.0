import { getDefaultChainId, getSupportedChainIds } from "../contracts/deployments";

/**
 * Single source of truth for RPC and network config (frontend).
 * We define the default local (Hardhat) RPC and chainId here so we don’t hardcode them elsewhere.
 * Env: VITE_LOCAL_RPC_URL (31337 primary), VITE_RPC_URL_31337_FALLBACK (optional), VITE_RPC_URL_<chainId> / _FALLBACK for other chains. If unset, 31337 uses the defaults below.
 */
/** Default RPC URL for local chain (Hardhat). Same as hardhat.config.ts networks.localhost.url. */
export const DEFAULT_LOCAL_RPC = "http://127.0.0.1:8545";
/** Hardhat local chain id. Must match hardhat.config.ts networks.localhost.chainId. */
export const LOCAL_CHAIN_ID = 31337;

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

/**
 * Default/expected chain for switch network and display when not connected.
 * When the only supported chain is local (31337), always use LOCAL_CHAIN_ID so expected chain
 * never drifts (avoids ensureCorrectNetwork/switchToExpectedChain firing due to deployments key order or residue).
 */
export const DEFAULT_CHAIN_ID: number =
  SUPPORTED_CHAIN_IDS.length === 1 && SUPPORTED_CHAIN_IDS[0] === LOCAL_CHAIN_ID
    ? LOCAL_CHAIN_ID
    : getDefaultChainId();

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
    31337: "Local (31337)",
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
  const urls = getRpcUrls(chainId);
  return urls[0];
}

/** Ordered list of RPC URLs for health check and fallback (primary + VITE_RPC_URL_<id>_FALLBACK). */
export function getRpcUrls(chainId: number): string[] {
  if (chainId === LOCAL_CHAIN_ID) {
    const u = LOCAL_RPC_URL ?? DEFAULT_LOCAL_RPC;
    const fallback = envString("VITE_RPC_URL_31337_FALLBACK");
    if (fallback) return [u, ...fallback.split(",").map((s) => s.trim()).filter(Boolean)];
    return [u];
  }
  const primary = envString(`VITE_RPC_URL_${chainId}`);
  const fallback = envString(`VITE_RPC_URL_${chainId}_FALLBACK`);
  const list: string[] = [];
  if (primary) list.push(primary);
  if (fallback) list.push(...fallback.split(",").map((s) => s.trim()).filter(Boolean));
  return list;
}

export const MAINNET_CHAIN_IDS: readonly number[] = [1];
export function isMainnet(chainId: number | undefined): boolean {
  return chainId !== undefined && (MAINNET_CHAIN_IDS as number[]).includes(chainId);
}

const BLOCK_EXPLORER_BASE: Record<number, string> = {
  1: "https://etherscan.io",
  5: "https://goerli.etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  31337: "", // local: no public explorer
};

export function getBlockExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const base = BLOCK_EXPLORER_BASE[chainId];
  if (!base) return undefined;
  return `${base}/address/${address}`;
}

/** F8: Activity — tx hash link to block explorer (or # when local). */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base = BLOCK_EXPLORER_BASE[chainId];
  if (!base) return "#";
  return `${base}/tx/${txHash}`;
}
