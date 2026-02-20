/**
 * Security gate config: which chains allow EOA as owner (e.g. local/testnet).
 * Mainnet (1, 137, etc.) should require contract (multisig/timelock).
 */
export const ALLOW_EOA_CHAIN_IDS: number[] = [31337, 11155111, 5, 421614];

export function isL2ChainId(chainId: number): boolean {
  return [10, 42161, 421614, 8453, 534352].includes(chainId);
}

/** Local Hardhat / localhost (chainId 31337). B4 is skipped here; required for L2 mainnet. */
export function isLocalChainId(chainId: number): boolean {
  return chainId === 31337;
}

/** L2 mainnet only (Opt, Arbitrum, Base, Scroll). B4 must Pass or Gate fails. Testnets (e.g. 421614) are not included. */
export function isL2MainnetChainId(chainId: number): boolean {
  return [10, 42161, 8453, 534352].includes(chainId);
}

/** Mainnet or L2 mainnet: R1 mandatory, C1b requires non-admin signer. */
export function isMainnetOrL2MainnetChainId(chainId: number): boolean {
  return [1, 137].includes(chainId) || isL2MainnetChainId(chainId);
}

export type GateConfig = {
  allowEoaOnChains?: number[];
  allowedProxyAdminOwners?: string[];
  allowedPoolOwners?: string[];
  allowedConfiguratorAdmins?: string[];
  /** Allowed signers for B4 L2 evidence file (must sign canonical payload). */
  b4EvidenceSigners?: string[];
};
