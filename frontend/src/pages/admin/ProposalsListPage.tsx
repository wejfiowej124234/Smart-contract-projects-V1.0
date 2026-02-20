import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Contract } from "ethers";
import { ABIS } from "../../contracts/abis";
import { getDeployments } from "../../contracts/deployments";
import { useWallet } from "../../hooks/useWallet";
import {
  emptyPlaceholder,
  governanceProposalVotes,
  governanceTimelockEta,
  governancePending,
  governanceActive,
  governanceExecuted,
  governanceSucceeded,
  governanceQueued,
  governanceDefeated,
  governanceCanceled,
  governanceExpired,
} from "../../config/ui";
import { ProposalVotesBar } from "../../components/governance/ProposalVotesBar";
import { TimelockCountdown } from "../../components/governance/TimelockCountdown";

const PROPOSAL_STATES = [
  governancePending,
  governanceActive,
  governanceCanceled,
  governanceDefeated,
  governanceSucceeded,
  governanceQueued,
  governanceExpired,
  governanceExecuted,
] as const;
const MAX_PROPOSALS = 10;

type ProposalRow = {
  id: number;
  state: number;
  stateName: string;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  eta: number | null;
};

function stateBadgeClass(state: number): string {
  if (state === 1) return "pill pillActive";
  if (state === 4 || state === 5) return "pill pillOk";
  if (state === 7) return "pill pillOk";
  if (state === 2 || state === 3 || state === 6) return "pill pillErr";
  return "pill";
}

export function ProposalsListPage() {
  const wallet = useWallet();
  const deployments = wallet.chainId != null ? getDeployments(wallet.chainId) : undefined;
  const governorAddress = deployments?.governorAddress;
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.provider || !governorAddress) {
      setProposals([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], wallet.provider);
    const next: ProposalRow[] = [];
    (async () => {
      for (let id = 1; id <= MAX_PROPOSALS; id++) {
        if (cancelled) return;
        try {
          const [s, votes, eta] = await Promise.all([
            governor.state(BigInt(id)) as Promise<bigint>,
            governor.proposalVotes(BigInt(id)) as Promise<[bigint, bigint, bigint]>,
            governor.proposalEta(BigInt(id)) as Promise<bigint>,
          ]);
          const stateNum = Number(s);
          const [againstVotes, forVotes, abstainVotes] = votes;
          const etaNum = eta != null && eta > 0n ? Number(eta) : null;
          next.push({
            id,
            state: stateNum,
            stateName: PROPOSAL_STATES[stateNum] ?? `Unknown(${stateNum})`,
            forVotes,
            againstVotes,
            abstainVotes,
            eta: etaNum,
          });
        } catch {
          break;
        }
      }
      if (!cancelled) setProposals(next);
    })().catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [wallet.provider, governorAddress]);

  return (
    <section className="governanceSection">
      <h2 className="sectionTitle">Proposals (Admin)</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="errorText" role="alert">{error}</p>}
      {!loading && !error && (
        <div className="governanceTableWrap">
          <table className="proposalTable" aria-label="Proposals">
            <thead>
              <tr>
                <th>ID</th>
                <th>State</th>
                <th>{governanceProposalVotes}</th>
                <th>{governanceTimelockEta}</th>
                <th aria-hidden>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 ? (
                <tr><td colSpan={5}>{emptyPlaceholder}</td></tr>
              ) : (
                proposals.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td><span className={stateBadgeClass(p.state)}>{p.stateName}</span></td>
                    <td className="proposalVotesCell">
                      <ProposalVotesBar forVotes={p.forVotes} againstVotes={p.againstVotes} abstainVotes={p.abstainVotes} />
                    </td>
                    <td className="proposalEtaCell"><TimelockCountdown eta={p.eta} /></td>
                    <td>
                      <Link to={`/admin/proposals/${p.id}`} className="btn btnSecondary btnSmall">Detail</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
