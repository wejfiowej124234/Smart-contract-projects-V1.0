import { useEffect, useState } from "react";
import type { AbstractProvider } from "ethers";
import { LOCAL_CHAIN_ID } from "../config/network";
import { getLocalReadProvider } from "../config/localReadProvider";

function hasCode(code: string | null | undefined): boolean {
  return !!code && code !== "0x" && code.length > 10;
}

/**
 * For local chain (31337), checks whether the pool and token contracts actually have code at the given addresses.
 * If the node was restarted, deployments.json still has old addresses that no longer exist on chain → no code.
 * Returns match: false so the UI can show "redeploy and refresh" banner.
 * Checks both pool and usd8 so that "no popup" due to missing token contract is also detected.
 * When walletProvider is passed for 31337, uses it for getCode so we check the same RPC that will be used for writes (avoids "read says OK, MetaMask send fails").
 */
export function useChainAddressMatch(
  chainId: number | undefined,
  poolAddress: string | undefined,
  usd8Address?: string | undefined,
  walletProvider?: AbstractProvider | null
): { match: boolean; loading: boolean } {
  const [match, setMatch] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chainId !== LOCAL_CHAIN_ID || !poolAddress || poolAddress.length < 40) {
      setMatch(true);
      setLoading(false);
      return;
    }

    // Prefer wallet provider on 31337 so getCode uses the same RPC as the upcoming write (MetaMask).
    const provider = chainId === LOCAL_CHAIN_ID && walletProvider
      ? walletProvider
      : getLocalReadProvider(LOCAL_CHAIN_ID);
    if (!provider) {
      setMatch(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const addressesToCheck = [poolAddress];
    if (usd8Address && usd8Address.length >= 40) addressesToCheck.push(usd8Address);

    Promise.all(addressesToCheck.map((addr) => provider.getCode(addr)))
      .then((codes) => {
        if (cancelled) return;
        const allHaveCode = codes.every((c) => hasCode(c));
        setMatch(allHaveCode);
      })
      .catch(() => {
        if (!cancelled) setMatch(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chainId, poolAddress, usd8Address, walletProvider]);

  return { match, loading };
}
