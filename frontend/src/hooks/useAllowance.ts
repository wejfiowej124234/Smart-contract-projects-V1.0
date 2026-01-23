import { useEffect, useState } from "react";
import type { Contract } from "ethers";
import { normalizeError } from "../state/errors";

type AllowanceState = {
  allowance?: bigint;
  loading: boolean;
  error?: string;
};

export function useAllowance(params: { token?: Contract; owner?: string; spender?: string }) {
  const { token, owner, spender } = params;

  const [state, setState] = useState<AllowanceState>({ loading: false });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token || !owner || !spender) return;
      setState({ loading: true });
      try {
        const allowance = (await token.allowance(owner, spender)) as bigint;
        if (cancelled) return;
        setState({ loading: false, allowance });
      } catch (e: unknown) {
        if (cancelled) return;
        setState({ loading: false, error: normalizeError(e).message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [owner, spender, token]);

  return state;
}
