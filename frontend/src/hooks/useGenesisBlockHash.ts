import { useEffect, useState } from "react";
import type { BrowserProvider } from "ethers";
import { getLocalReadProvider } from "../config/localReadProvider";
import { LOCAL_CHAIN_ID } from "../config/network";

/**
 * Fetches genesis block hash when on local chain (31337) for "MetaMask = node instance" proof.
 * On 31337 we use a direct read-only RPC (127.0.0.1:8545) so this works even when MetaMask's RPC fails.
 */
export function useGenesisBlockHash(provider: BrowserProvider | undefined, chainId: number | undefined): string | undefined {
  const [genesisHash, setGenesisHash] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (chainId !== LOCAL_CHAIN_ID) {
      queueMicrotask(() => setGenesisHash(undefined));
      return;
    }
    const readProvider = getLocalReadProvider(chainId) ?? provider;
    if (!readProvider) {
      queueMicrotask(() => setGenesisHash(undefined));
      return;
    }
    let cancelled = false;
    readProvider.getBlock(0).then((block) => {
      if (!cancelled && block?.hash) setGenesisHash(block.hash);
    }).catch(() => {
      if (!cancelled) setGenesisHash(undefined);
    });
    return () => { cancelled = true; };
  }, [provider, chainId]);

  return genesisHash;
}
