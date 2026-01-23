import { useEffect, useState } from "react";
import type { Contract } from "ethers";
import { normalizeError } from "../state/errors";

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
