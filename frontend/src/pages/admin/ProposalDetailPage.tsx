import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Contract } from "ethers";
import { ABIS } from "../../contracts/abis";
import { getDeployments } from "../../contracts/deployments";
import { useWallet } from "../../hooks/useWallet";
import {
  governanceTimelockEta,
  governancePending,
  governanceActive,
  governanceExecuted,
  governanceSucceeded,
  governanceQueued,
  governanceDefeated,
  governanceCanceled,
  governanceExpired,
  governanceQueue,
  governanceExecute,
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

type ProposalDetail = {
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

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const proposalId = id != null ? parseInt(id, 10) : NaN;
  const wallet = useWallet();
  const deployments = wallet.chainId != null ? getDeployments(wallet.chainId) : undefined;
  const governorAddress = deployments?.governorAddress;
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.provider || !governorAddress || !Number.isFinite(proposalId) || proposalId < 1) {
      setProposal(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], wallet.provider);
    (async () => {
      try {
        const [s, votes, eta] = await Promise.all([
          governor.state(BigInt(proposalId)) as Promise<bigint>,
          governor.proposalVotes(BigInt(proposalId)) as Promise<[bigint, bigint, bigint]>,
          governor.proposalEta(BigInt(proposalId)) as Promise<bigint>,
        ]);
        const stateNum = Number(s);
        const [againstVotes, forVotes, abstainVotes] = votes;
        const etaNum = eta != null && eta > 0n ? Number(eta) : null;
        if (!cancelled) {
          setProposal({
            id: proposalId,
            state: stateNum,
            stateName: PROPOSAL_STATES[stateNum] ?? `Unknown(${stateNum})`,
            forVotes,
            againstVotes,
            abstainVotes,
            eta: etaNum,
          });
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [wallet.provider, governorAddress, proposalId]);

  const canQueue = proposal?.state === 4; // Succeeded
  const canExecute = proposal?.state === 5 && proposal.eta != null && proposal.eta <= Math.floor(Date.now() / 1000) + 60; // Queued and eta passed

  return (
    <section className="governanceSection">
      <p>
        <Link to="/admin/proposals" className="navLink">← Proposals</Link>
      </p>
      {loading && <p className="muted">Loading proposal…</p>}
      {error && <p className="errorText" role="alert">{error}</p>}
      {!loading && !error && proposal && (
        <div className="card proposalDetailCard" data-testid="proposal-detail">
          <h2 className="sectionTitle">Proposal {proposal.id}</h2>
          <p><span className={stateBadgeClass(proposal.state)}>{proposal.stateName}</span></p>
          <div className="proposalDetailVotes">
            <ProposalVotesBar forVotes={proposal.forVotes} againstVotes={proposal.againstVotes} abstainVotes={proposal.abstainVotes} />
          </div>
          <div className="proposalDetailEta">
            <span className="proposalDetailLabel">{governanceTimelockEta}</span>
            <TimelockCountdown eta={proposal.eta} />
          </div>
          <div className="proposalDetailActions">
            <button
              type="button"
              className="btn btnSecondary"
              disabled={!canQueue}
              title={!canQueue ? "Only Succeeded proposals can be queued. Proposal params (targets, values, calldatas) required from creation." : governanceQueue}
            >
              {governanceQueue}
            </button>
            <button
              type="button"
              className="btn btnPrimary"
              disabled={!canExecute}
              title={!canExecute ? "Only Queued proposals past ETA can be executed. Proposal params required from creation." : governanceExecute}
            >
              {governanceExecute}
            </button>
          </div>
          <p className="muted proposalDetailHint">
            Queue/Execute require proposal params (targets, values, calldatas, descriptionHash). Use governance scripts for full flow.
          </p>
        </div>
      )}
      {!loading && !error && !proposal && Number.isFinite(proposalId) && (
        <p className="muted">Proposal {proposalId} not found.</p>
      )}
    </section>
  );
}
