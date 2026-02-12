import { useEffect, useState } from "react";
import type { Contract } from "ethers";
import { normalizeError } from "../state/errors";

/**
 * Fetches symbol and decimals for a token so the UI can display amounts and labels correctly.
 */
type TokenMeta = {
  symbol?: string;
  decimals?: number;
  loading: boolean;
  error?: string;
};

export function useTokenMetadata(token?: Contract) {
  const [state, setState] = useState<TokenMeta>({ loading: false });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) return;
      setState({ loading: true });
      try {
        const [symbol, decimals] = await Promise.all([
          token.symbol() as Promise<string>,
          token.decimals() as Promise<number>,
        ]);
        if (cancelled) return;
        setState({ symbol, decimals, loading: false });
      } catch (e: unknown) {
        if (cancelled) return;
        setState({ loading: false, error: normalizeError(e).message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
