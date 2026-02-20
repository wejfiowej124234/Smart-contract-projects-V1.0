import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import { ABIS } from "../contracts/abis";

export type GovernanceOverview = {
  votingPower: bigint;
  /** GOV token balance of account (for hint when votes=0 but balance>0). */
  tokenBalance: bigint;
  delegatedTo: string | null;
  timelockAddress: string | null;
  poolPaused: boolean | null;
  tokenAddress: string | null;
  /** Quorum (vote weight required) at current block. */
  quorum: bigint | null;
  /** Voting period in blocks. */
  votingPeriod: bigint | null;
  /** Proposal threshold (min GOV to create proposal). */
  proposalThreshold: bigint | null;
};

export function useGovernanceOverview(
  provider: import("ethers").BrowserProvider | undefined,
  account: string | undefined,
  governorAddress: string | undefined,
  simpleLendingAddress: string | undefined
): {
  overview: GovernanceOverview;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [overview, setOverview] = useState<GovernanceOverview>({
    votingPower: 0n,
    tokenBalance: 0n,
    delegatedTo: null,
    timelockAddress: null,
    poolPaused: null,
    tokenAddress: null,
    quorum: null,
    votingPeriod: null,
    proposalThreshold: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!provider || !governorAddress) {
      setOverview({
        votingPower: 0n,
        tokenBalance: 0n,
        delegatedTo: null,
        timelockAddress: null,
        poolPaused: null,
        tokenAddress: null,
        quorum: null,
        votingPeriod: null,
        proposalThreshold: null,
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], provider);
      const [timelockAddr, tokenAddr] = await Promise.all([
        governor.timelock() as Promise<string>,
        governor.token() as Promise<string>,
      ]);
      const block = await provider.getBlockNumber();
      const timepoint = block > 0 ? block - 1 : block;
      const accountForVotes = account ?? "0x0000000000000000000000000000000000000000";

      const tokenContract = tokenAddr ? new Contract(tokenAddr, ABIS.GovToken, provider) : null;
      const [votes, delegatesResult, tokenBal, paused, quorum, votingPeriod, proposalThreshold] = await Promise.all([
        governor.getVotes(accountForVotes, timepoint) as Promise<bigint>,
        tokenAddr && account
          ? (tokenContract!.delegates(account) as Promise<string>)
          : Promise.resolve("0x0000000000000000000000000000000000000000"),
        tokenAddr && account ? (tokenContract!.balanceOf(account) as Promise<bigint>) : Promise.resolve(0n),
        simpleLendingAddress
          ? (new Contract(simpleLendingAddress, ABIS.SimpleLending, provider).paused() as Promise<boolean>)
          : Promise.resolve(false),
        governor.quorum(timepoint) as Promise<bigint>,
        governor.votingPeriod() as Promise<bigint>,
        governor.proposalThreshold() as Promise<bigint>,
      ]);

      const delegatedTo =
        delegatesResult !== "0x0000000000000000000000000000000000000000"
          ? delegatesResult
          : null;

      setOverview({
        votingPower: votes,
        tokenBalance: tokenBal ?? 0n,
        delegatedTo,
        timelockAddress: timelockAddr ?? null,
        poolPaused: paused,
        tokenAddress: tokenAddr ?? null,
        quorum,
        votingPeriod,
        proposalThreshold,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOverview({
        votingPower: 0n,
        tokenBalance: 0n,
        delegatedTo: null,
        timelockAddress: null,
        poolPaused: null,
        tokenAddress: null,
        quorum: null,
        votingPeriod: null,
        proposalThreshold: null,
      });
    } finally {
      setLoading(false);
    }
  }, [provider, account, governorAddress, simpleLendingAddress]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, loading, error, refetch: fetchOverview };
}
