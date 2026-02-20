import { useEffect, useState } from "react";
import type { Contract } from "ethers";

/** Reserve LTV/LT from chain (basis points → display %). When unavailable, returns undefined so UI can show default with label. */
export type ReserveRiskParams = {
  ltvPct: number;
  ltPct: number;
};

export function useReserveRiskParams(
  lending: Contract | undefined,
  reserveAddress: string | undefined
): ReserveRiskParams | undefined {
  const [params, setParams] = useState<ReserveRiskParams | undefined>(undefined);

  useEffect(() => {
    if (!lending || !reserveAddress) {
      queueMicrotask(() => setParams(undefined));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ltv, lt] = (await lending.getReserveData(reserveAddress)) as [bigint, bigint, ...unknown[]];
        if (cancelled) return;
        // SimpleLending stores LTV/LT as percent (e.g. 75 = 75%), not basis points
        setParams({
          ltvPct: Number(ltv),
          ltPct: Number(lt),
        });
      } catch {
        if (!cancelled) setParams(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lending, reserveAddress]);

  return params;
}
