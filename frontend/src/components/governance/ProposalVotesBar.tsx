import { formatUnits } from "ethers";
import { governanceVoteFor, governanceVoteAgainst, governanceVoteAbstain, governanceQuorumProgressLabel, governanceQuorumMet, governanceQuorumNotMet } from "../../config/ui";

const GOV_DECIMALS = 18;

type ProposalVotesBarProps = {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  quorum?: bigint | null;
};

export function ProposalVotesBar({ forVotes, againstVotes, abstainVotes, quorum }: ProposalVotesBarProps) {
  const total = Number(forVotes) + Number(againstVotes) + Number(abstainVotes);
  const totalBig = forVotes + againstVotes + abstainVotes;
  const forPct = total > 0 ? (Number(forVotes) / total) * 100 : 0;
  const againstPct = total > 0 ? (Number(againstVotes) / total) * 100 : 0;
  const abstainPct = total > 0 ? (Number(abstainVotes) / total) * 100 : 0;
  const quorumMet = quorum != null && totalBig >= quorum;

  return (
    <div className="proposalVotesBar" role="img" aria-label={`For ${forVotes.toString()}, Against ${againstVotes.toString()}, Abstain ${abstainVotes.toString()}`}>
      <div className="proposalVotesBarTrack">
        {forPct > 0 && (
          <div
            className="proposalVotesBarSegment proposalVotesBarSegment--for"
            style={{ width: `${forPct}%` }}
            title={governanceVoteFor}
          />
        )}
        {againstPct > 0 && (
          <div
            className="proposalVotesBarSegment proposalVotesBarSegment--against"
            style={{ width: `${againstPct}%` }}
            title={governanceVoteAgainst}
          />
        )}
        {abstainPct > 0 && (
          <div
            className="proposalVotesBarSegment proposalVotesBarSegment--abstain"
            style={{ width: `${abstainPct}%` }}
            title={governanceVoteAbstain}
          />
        )}
      </div>
      <div className="proposalVotesBarLegend">
        <span className="voteFor" title={governanceVoteFor}>{forVotes.toString()}</span>
        <span className="voteAgainst" title={governanceVoteAgainst}>{againstVotes.toString()}</span>
        <span className="voteAbstain" title={governanceVoteAbstain}>{abstainVotes.toString()}</span>
      </div>
      {quorum != null && (
        <div className="proposalQuorumProgress" role="status" title={governanceQuorumProgressLabel}>
          <span className="proposalQuorumProgressLabel">{governanceQuorumProgressLabel}:</span>{" "}
          <span className="proposalQuorumProgressValue">{formatUnits(totalBig, GOV_DECIMALS)} / {formatUnits(quorum, GOV_DECIMALS)} GOV</span>
          {" · "}
          <span className={quorumMet ? "proposalQuorumMet" : "proposalQuorumNotMet"}>{quorumMet ? governanceQuorumMet : governanceQuorumNotMet}</span>
        </div>
      )}
    </div>
  );
}
