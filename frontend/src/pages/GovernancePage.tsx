import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Contract, Interface, keccak256, toUtf8Bytes, formatUnits } from "ethers";
import { ABIS } from "../contracts/abis";
import { getDeployments } from "../contracts/deployments";
import { useWallet } from "../hooks/useWallet";
import { useGovernanceOverview } from "../hooks/useGovernanceOverview";
import { useSplitProviderState } from "../state/splitProviderContext";
import {
  governanceProposalVotes,
  governancePending,
  governanceActive,
  governanceExecuted,
  governanceSucceeded,
  governanceQueued,
  governanceDefeated,
  governanceCanceled,
  governanceExpired,
  governanceVote,
  governanceVoteFor,
  governanceVoteAgainst,
  governanceVoteAbstain,
  governanceQueue,
  governanceExecute,
  governanceCancel,
  governanceCreateProposal,
  governanceCalldataHint,
  governanceCalldataInvalid,
  governanceAdminNotTimelock,
  governanceAdminLink,
  closeLabel,
  dismiss,
  governanceOverviewTitle,
  governanceKpiActiveProposals,
  governanceKpiTotalProposals,
  governanceKpiTimelock,
  governanceKpiVotingPower,
  governanceKpiDelegatedTo,
  governanceKpiPoolPause,
  governanceKpiPoolPaused,
  governanceKpiPoolActive,
  governanceKpiQuorum,
  governanceDaoParamsTitle,
  governanceDaoParamsSourceLabel,
  governanceVotingPeriodLabel,
  governanceVotingPeriodBlocks,
  governanceProposalThresholdLabel,
  governanceTimelockDelayLabel,
  governanceProposalListTitle,
  governanceProposalId,
  governanceProposalTitle,
  governanceProposalStatus,
  governanceProposalEta,
  governanceProposalDetails,
  governanceProposalTitlePlaceholder,
  governanceMyInfoTitle,
  governanceMyVotingPower,
  governanceMyDelegatedTo,
  governanceMyCanExecute,
  governanceMyCanExecuteYes,
  governanceMyCanExecuteNo,
  governanceDelegateBtn,
  governanceViewHistoryBtn,
  governanceNotConnected,
  governanceVotesSnapshotHint,
  governanceSelfDelegateHint,
  governanceNotDeployed,
  governanceProposalCreatedEcho,
  governanceProposalQuorumVotesEcho,
  governanceFlowHint,
  governanceSectionAria,
  governanceEmptyStateTitle,
  governanceTimelinePlaceholderHint,
  skeletonLoadingAriaLabel,
} from "../config/ui";
import { ProposalVotesBar } from "../components/governance/ProposalVotesBar";
import { ProposalStateTimeline } from "../components/governance/ProposalStateTimeline";
import { TimelockCountdown } from "../components/governance/TimelockCountdown";
import { useSetNavBadges } from "../state/navBadges";
import { setLastProposalCreatedEvidence } from "../state/governanceEvidence";
import { appendRevertDiagnostic } from "../state/revertDiagnostics";
import { append as appendSessionEvidence } from "../state/sessionEvidence";
import { ADMIN_ADDRESSES } from "../config/runtime";

const GOV_STORAGE_PREFIX = "gov_proposal_";

type StoredProposal = {
  targets: string[];
  values: (number | string)[];
  calldatas: string[];
  description: string;
};

function getStoredProposal(chainId: number, proposalId: number): StoredProposal | null {
  try {
    const raw = localStorage.getItem(`${GOV_STORAGE_PREFIX}${chainId}_${proposalId}`);
    return raw ? (JSON.parse(raw) as StoredProposal) : null;
  } catch {
    return null;
  }
}

function setStoredProposal(chainId: number, proposalId: number, data: StoredProposal): void {
  localStorage.setItem(`${GOV_STORAGE_PREFIX}${chainId}_${proposalId}`, JSON.stringify(data));
}

function descriptionToHash(description: string): string {
  return keccak256(toUtf8Bytes(description));
}

/** OpenZeppelin Governor: 0 = Against, 1 = For, 2 = Abstain */
const VOTE_AGAINST = 0;
const VOTE_FOR = 1;
const VOTE_ABSTAIN = 2;

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
  if (state === 1) return "pill pillActive"; // Active
  if (state === 4 || state === 5) return "pill pillOk"; // Succeeded, Queued
  if (state === 7) return "pill pillOk"; // Executed
  if (state === 2 || state === 3 || state === 6) return "pill pillErr"; // Canceled, Defeated, Expired
  return "pill"; // Pending
}

const GOV_TOKEN_DECIMALS = 18;

function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function GovernancePage() {
  const wallet = useWallet();
  const split = useSplitProviderState();
  const deployments = wallet.chainId != null ? getDeployments(wallet.chainId) : undefined;
  const governorAddress = deployments?.governorAddress;
  const { overview, refetch: refetchOverview } = useGovernanceOverview(
    wallet.provider,
    wallet.account ?? undefined,
    governorAddress,
    deployments?.simpleLendingAddress
  );
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteProposalId, setVoteProposalId] = useState<number | null>(null);
  const [voteSupport, setVoteSupport] = useState<typeof VOTE_FOR | typeof VOTE_AGAINST | typeof VOTE_ABSTAIN | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTargets, setCreateTargets] = useState("");
  const [createValues, setCreateValues] = useState("0");
  const [createCalldatas, setCreateCalldatas] = useState("0x");
  const [createDescription, setCreateDescription] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<{
    proposalId: number;
    snapshot: bigint;
    deadline: bigint;
    quorumAtSnapshot: bigint;
    votesAtSnapshot: bigint;
    txHash: string;
  } | null>(null);
  const [actionProposalId, setActionProposalId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"queue" | "execute" | "cancel" | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailProposalId, setDetailProposalId] = useState<number | null>(null);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegateAddress, setDelegateAddress] = useState("");
  const [delegateSubmitting, setDelegateSubmitting] = useState(false);
  const [delegateError, setDelegateError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!wallet.provider || !governorAddress) {
      setProposals([]);
      return;
    }
    const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], wallet.provider);
    const next: ProposalRow[] = [];
    for (let id = 1; id <= MAX_PROPOSALS; id++) {
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
    setProposals(next);
  }, [wallet.provider, governorAddress]);

  useEffect(() => {
    if (!wallet.provider || !governorAddress) {
      setProposals([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProposals()
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [wallet.provider, governorAddress, fetchProposals]);

  const openVoteModal = (proposalId: number) => {
    setVoteProposalId(proposalId);
    setVoteSupport(null);
    setVoteError(null);
  };
  const closeVoteModal = () => {
    if (!voteSubmitting) {
      setVoteProposalId(null);
      setVoteSupport(null);
      setVoteError(null);
    }
  };
  const submitVote = async () => {
    if (voteProposalId == null || voteSupport == null || !wallet.provider || !wallet.account || !governorAddress) return;
    if (split.mismatch) { setVoteError("Network mismatch. Writes disabled."); return; }
    setVoteSubmitting(true);
    setVoteError(null);
    try {
      const signer = await wallet.provider.getSigner();
      const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], signer);
      const tx = await governor.castVote(BigInt(voteProposalId), voteSupport);
      await tx.wait();
      closeVoteModal();
      await fetchProposals();
      await refetchOverview();
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setVoteSubmitting(false);
    }
  };

  const submitDelegate = async () => {
    if (!wallet.provider || !wallet.account || !overview.tokenAddress || !delegateAddress.trim()) return;
    if (split.mismatch) { setDelegateError("Network mismatch. Writes disabled."); return; }
    setDelegateSubmitting(true);
    setDelegateError(null);
    try {
      const signer = await wallet.provider.getSigner();
      const token = new Contract(overview.tokenAddress, ABIS.GovToken, signer);
      const tx = await token.delegate(delegateAddress.trim());
      await tx.wait();
      setShowDelegateModal(false);
      setDelegateAddress("");
      await refetchOverview();
    } catch (e) {
      setDelegateError(e instanceof Error ? e.message : String(e));
    } finally {
      setDelegateSubmitting(false);
    }
  };

  const submitCreateProposal = async () => {
    if (!wallet.provider || !wallet.account || !governorAddress || wallet.chainId == null) return;
    if (split.mismatch) { setCreateError("Network mismatch. Writes disabled."); return; }
    const targets = createTargets.trim().split(",").map((s) => s.trim()).filter(Boolean);
    const valuesRaw = createValues.trim().split(",").map((s) => (s.trim() ? s.trim() : "0"));
    const calldatasRaw = createCalldatas.trim().split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    const description = createDescription.trim();
    if (targets.length === 0 || valuesRaw.length !== targets.length || calldatasRaw.length !== targets.length || !description) {
      setCreateError("Targets, values, calldatas (comma-sep) and description are required.");
      return;
    }
    const MIN_CALLDATA_LEN = 138;
    const calldatas: string[] = [];
    for (let i = 0; i < calldatasRaw.length; i++) {
      let hex = calldatasRaw[i]!;
      if (!hex.startsWith("0x")) hex = "0x" + hex;
      hex = hex.replace(/\s/g, "");
      if (hex.length % 2 !== 0) hex = "0x0" + hex.slice(2);
      if (!/^0x[0-9a-fA-F]*$/.test(hex) || hex.length < MIN_CALLDATA_LEN) {
        setCreateError(governanceCalldataInvalid);
        return;
      }
      calldatas.push(hex);
    }
    const values = valuesRaw.map((v) => BigInt(v));
    if (deployments?.configuratorAddress && deployments?.timelockAddress && targets[0]?.toLowerCase() === deployments.configuratorAddress.toLowerCase()) {
      try {
        const configurator = new Contract(targets[0], ["function admin() view returns (address)"], wallet.provider);
        const admin = (await configurator.admin()) as string;
        if (admin?.toLowerCase() !== deployments.timelockAddress.toLowerCase()) {
          setCreateError(governanceAdminNotTimelock);
          return;
        }
      } catch {
        // ignore; proceed with propose
      }
    }
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const signer = await wallet.provider.getSigner();
      const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], signer);
      const tx = await governor.propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      let createdId: number | null = null;
      if (receipt?.logs) {
        const iface = new Interface(ABIS.GovernorP9 as unknown as object[]);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({ data: log.data, topics: log.topics as string[] });
            if (parsed?.name === "ProposalCreated" && "proposalId" in parsed.args) {
              createdId = Number(parsed.args.proposalId);
              setStoredProposal(wallet.chainId, createdId, { targets, values: values.map((v) => v.toString()), calldatas, description });
              break;
            }
          } catch {
            // skip non-ProposalCreated logs
          }
        }
      }
      if (createdId != null && wallet.provider && governorAddress) {
        const govRead = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], wallet.provider);
        const snapshot = await govRead.proposalSnapshot(BigInt(createdId)) as bigint;
        const deadline = await govRead.proposalDeadline(BigInt(createdId)) as bigint;
        const [quorumAtSnapshot, votesAtSnapshot] = await Promise.all([
          govRead.quorum(snapshot) as Promise<bigint>,
          wallet.account ? (govRead.getVotes(wallet.account, snapshot) as Promise<bigint>) : Promise.resolve(0n),
        ]);
        const txHash = receipt?.hash ?? "";
        setCreateSuccess({
          proposalId: createdId,
          snapshot,
          deadline,
          quorumAtSnapshot,
          votesAtSnapshot,
          txHash,
        });
        setLastProposalCreatedEvidence({
          schemaVersion: 1,
          chainId: wallet.chainId!,
          governorAddress: governorAddress,
          govTokenAddress: deployments?.governanceTokenAddress ?? "",
          proposalId: createdId,
          snapshot: snapshot.toString(),
          deadline: deadline.toString(),
          quorumAtSnapshot: quorumAtSnapshot.toString(),
          votesAtSnapshot: votesAtSnapshot.toString(),
          txHash,
          createdAt: new Date().toISOString(),
        });
      }
      setShowCreateModal(false);
      setCreateTargets("");
      setCreateValues("0");
      setCreateCalldatas("0x");
      setCreateDescription("");
      await fetchProposals();
      await refetchOverview();
    } catch (e) {
      const err = e as { shortMessage?: string; reason?: string; data?: string; transaction?: { hash?: string }; receipt?: { transactionHash?: string } };
      const txHash = err?.transaction?.hash ?? err?.receipt?.transactionHash;
      const entry = {
        ts: Date.now(),
        label: "Governance propose",
        txHash,
        shortMessage: typeof err?.shortMessage === "string" ? err.shortMessage : undefined,
        reason: typeof err?.reason === "string" ? err.reason : undefined,
        data: typeof err?.data === "string" ? err.data : undefined,
        chainId: wallet.chainId ?? undefined,
        contractAddress: governorAddress ?? undefined,
        method: "propose",
        args: [targets?.length, values?.length, calldatas?.length],
      };
      appendRevertDiagnostic(entry);
      appendSessionEvidence("TxRevert", { ...entry, args: entry.args });
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const runQueueExecuteCancel = async (proposalId: number, type: "queue" | "execute" | "cancel") => {
    if (!wallet.provider || !wallet.account || !governorAddress || wallet.chainId == null) return;
    if (split.mismatch) { setActionError("Network mismatch. Writes disabled."); return; }
    const stored = getStoredProposal(wallet.chainId, proposalId);
    if (!stored) {
      setActionError("Proposal params not found. Create proposals from this UI to Queue/Execute/Cancel later.");
      return;
    }
    const descriptionHash = descriptionToHash(stored.description);
    const targets = stored.targets;
    const values = stored.values.map((v) => (typeof v === "number" ? BigInt(v) : BigInt(v)));
    const calldatas = stored.calldatas;
    setActionProposalId(proposalId);
    setActionType(type);
    setActionSubmitting(true);
    setActionError(null);
    try {
      const signer = await wallet.provider.getSigner();
      const governor = new Contract(governorAddress, ABIS.GovernorP9 as unknown as object[], signer);
      if (type === "queue") {
        const tx = await governor.queue(targets, values, calldatas, descriptionHash);
        await tx.wait();
      } else if (type === "execute") {
        const tx = await governor.execute(targets, values, calldatas, descriptionHash, { value: 0n });
        await tx.wait();
      } else {
        const tx = await governor.cancel(targets, values, calldatas, descriptionHash);
        await tx.wait();
      }
      setActionProposalId(null);
      setActionType(null);
      setActionError(null);
      await fetchProposals();
      await refetchOverview();
    } catch (e) {
      const err = e as { shortMessage?: string; reason?: string; data?: string; transaction?: { hash?: string }; receipt?: { transactionHash?: string } };
      const txHash = err?.transaction?.hash ?? err?.receipt?.transactionHash;
      const entry = {
        ts: Date.now(),
        label: `Governance ${type}`,
        txHash,
        shortMessage: typeof err?.shortMessage === "string" ? err.shortMessage : undefined,
        reason: typeof err?.reason === "string" ? err.reason : undefined,
        data: typeof err?.data === "string" ? err.data : undefined,
        chainId: wallet.chainId ?? undefined,
        contractAddress: governorAddress ?? undefined,
        method: type,
        args: [proposalId, stored.targets?.length, stored.calldatas?.length],
      };
      appendRevertDiagnostic(entry);
      appendSessionEvidence("TxRevert", { ...entry, args: entry.args });
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionSubmitting(false);
    }
  };

  const activeCount = proposals.filter((p) => p.state === 1).length;
  const queuedCount = proposals.filter((p) => p.state === 5).length;
  const setNavBadges = useSetNavBadges();
  useEffect(() => {
    const badge = queuedCount > 0 ? `${queuedCount} queued` : activeCount > 0 ? String(activeCount) : undefined;
    setNavBadges({ governance: badge });
  }, [activeCount, queuedCount, setNavBadges]);
  const canExecuteAny =
    proposals.some((p) => p.state === 5 && p.eta != null && p.eta * 1000 <= Date.now()) ?? false;

  if (!governorAddress) {
    return (
      <section className="governanceSection" data-testid="governance-page">
        <h2 className="sectionTitle">Governance</h2>
        <p className="muted">{governanceNotDeployed}</p>
      </section>
    );
  }

  return (
    <section className="governanceSection" aria-label={governanceSectionAria} data-testid="governance-page">
      <h2 className="sectionTitle">Governance</h2>
      <p className="muted governanceSubtitle pageIntro">Proposal status and votes. Connect wallet and ensure correct network.</p>
      {wallet.account && (
        <>
          <p className="governanceFlowHint muted" role="status">{governanceFlowHint}</p>
          <div className="actionsCtaGroup">
            <button type="button" className="btn btnPrimary" onClick={() => { setShowCreateModal(true); setCreateError(null); setCreateSuccess(null); }} disabled={split.mismatch}>
              {governanceCreateProposal}
            </button>
            {(ADMIN_ADDRESSES.length === 0 || (wallet.account && ADMIN_ADDRESSES.includes(wallet.account.toLowerCase()))) && (
              <Link to="/admin" className="btn btnSecondary">{governanceAdminLink}</Link>
            )}
          </div>

          {/* Governance overview KPI */}
          <h3 className="sectionSubtitle">{governanceOverviewTitle}</h3>
          <div className="governanceKpiGrid" aria-label={governanceOverviewTitle}>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiActiveProposals}</div>
              <div className="governanceKpiValue">{activeCount}</div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiTotalProposals}</div>
              <div className="governanceKpiValue">{proposals.length}</div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiTimelock}</div>
              <div className="governanceKpiValue" title={overview.timelockAddress ?? undefined}>
                {overview.timelockAddress ? shortAddress(overview.timelockAddress) : "—"}
              </div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiVotingPower}</div>
              <div className="governanceKpiValue">
                {overview.votingPower !== undefined ? `${formatUnits(overview.votingPower, GOV_TOKEN_DECIMALS)} GOV` : "—"}
              </div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiDelegatedTo}</div>
              <div className="governanceKpiValue" title={overview.delegatedTo ?? undefined}>
                {overview.delegatedTo ? shortAddress(overview.delegatedTo) : "—"}
              </div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiPoolPause}</div>
              <div className="governanceKpiValue">
                {overview.poolPaused === true ? governanceKpiPoolPaused : overview.poolPaused === false ? governanceKpiPoolActive : "—"}
              </div>
            </div>
            <div className="governanceKpiItem">
              <div className="governanceKpiLabel">{governanceKpiQuorum}</div>
              <div className="governanceKpiValue">
                {overview.quorum != null ? `${formatUnits(overview.quorum, GOV_TOKEN_DECIMALS)} GOV` : "—"}
              </div>
            </div>
          </div>

          {/* DAO parameters: quorum, voting period, timelock delay, proposal threshold (visible even when no proposals) */}
          <h3 className="sectionSubtitle">{governanceDaoParamsTitle}</h3>
          <div className="governanceDaoParamsCard card">
            <div className="governanceDaoParamsRow">
              <span className="governanceDaoParamsLabel">{governanceKpiQuorum}</span>
              <span className="governanceDaoParamsValue">
                {overview.quorum != null ? `${formatUnits(overview.quorum, GOV_TOKEN_DECIMALS)} GOV` : "—"}
              </span>
            </div>
            <div className="governanceDaoParamsRow">
              <span className="governanceDaoParamsLabel">{governanceVotingPeriodLabel}</span>
              <span className="governanceDaoParamsValue">
                {overview.votingPeriod != null ? governanceVotingPeriodBlocks.replace("{n}", overview.votingPeriod.toString()) : "—"}
              </span>
            </div>
            <div className="governanceDaoParamsRow">
              <span className="governanceDaoParamsLabel">{governanceProposalThresholdLabel}</span>
              <span className="governanceDaoParamsValue">
                {overview.proposalThreshold != null ? `${formatUnits(overview.proposalThreshold, GOV_TOKEN_DECIMALS)} GOV` : "—"}
              </span>
            </div>
            <div className="governanceDaoParamsRow">
              <span className="governanceDaoParamsLabel">{governanceTimelockDelayLabel}</span>
              <span className="governanceDaoParamsValue">—</span>
            </div>
            <p className="governanceDaoParamsSource muted">
              {governanceDaoParamsSourceLabel}{" "}
              <code className="governanceDaoParamsAddress" title={governorAddress}>
                {shortAddress(governorAddress)}
              </code>
              <button type="button" className="btn btnText btnSmall governanceDaoParamsCopy" onClick={() => { void navigator.clipboard.writeText(governorAddress); }} title="Copy address">
                Copy
              </button>
            </p>
          </div>

          {/* My governance info */}
          <h3 className="sectionSubtitle">{governanceMyInfoTitle}</h3>
          <div className="governanceMyInfoCard">
            <div className="governanceMyInfoRow">
              <span>{governanceMyVotingPower}</span>
              <span className="governanceKpiValue">
                {overview.votingPower !== undefined ? `${formatUnits(overview.votingPower, GOV_TOKEN_DECIMALS)} GOV` : "—"}
              </span>
            </div>
            <div className="governanceMyInfoRow">
              <span>{governanceMyDelegatedTo}</span>
              <span className="governanceKpiValue" title={overview.delegatedTo ?? undefined}>
                {overview.delegatedTo ? shortAddress(overview.delegatedTo) : "—"}
              </span>
            </div>
            <div className="governanceMyInfoRow">
              <span>{governanceMyCanExecute}</span>
              <span className="governanceKpiValue">{canExecuteAny ? governanceMyCanExecuteYes : governanceMyCanExecuteNo}</span>
            </div>
            {overview.votingPower === 0n && overview.tokenBalance > 0n && (
              <p className="muted governanceVotesSnapshotHint" role="status">
                {overview.delegatedTo != null && wallet.account != null && overview.delegatedTo.toLowerCase() === wallet.account.toLowerCase()
                  ? governanceVotesSnapshotHint
                  : governanceSelfDelegateHint}
              </p>
            )}
            <div className="governanceMyInfoActions">
              <button type="button" className="btn btnSecondary btnSmall" onClick={() => { setShowDelegateModal(true); setDelegateError(null); setDelegateAddress(""); }}>
                {governanceDelegateBtn}
              </button>
              <Link to="/admin" className="btn btnSecondary btnSmall">{governanceViewHistoryBtn}</Link>
            </div>
          </div>

          <h3 className="sectionSubtitle">{governanceProposalListTitle}</h3>
          {createSuccess && (
            <div className="card governanceCreateSuccessEcho" role="status">
              <p className="muted" style={{ marginBottom: "0.25rem" }}>
                {governanceProposalCreatedEcho
                  .replace("{id}", String(createSuccess.proposalId))
                  .replace("{snapshot}", createSuccess.snapshot.toString())
                  .replace("{deadline}", createSuccess.deadline.toString())}
              </p>
              <p className="muted" style={{ marginBottom: "0.25rem", fontSize: "var(--fontSize-xs)" }} title="Quorum at snapshot block; your votes at snapshot; any parameter drift visible here.">
                {governanceProposalQuorumVotesEcho
                  .replace("{quorum}", createSuccess.quorumAtSnapshot.toString())
                  .replace("{votes}", createSuccess.votesAtSnapshot.toString())
                  .replace("{txHash}", createSuccess.txHash)}
              </p>
              <button type="button" className="btn btnText btnSmall" onClick={() => setCreateSuccess(null)} aria-label={dismiss}>
                {dismiss}
              </button>
            </div>
          )}
          {loading && (
            <div className="governanceTableWrap" aria-busy="true" aria-label={skeletonLoadingAriaLabel}>
              <table className="proposalTable">
                <thead>
                  <tr>
                    <th>{governanceProposalId}</th>
                    <th>{governanceProposalTitle}</th>
                    <th>{governanceProposalStatus}</th>
                    <th>{governanceProposalVotes}</th>
                    <th>{governanceProposalEta}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td><span className="skeleton" style={{ width: "2rem" }} /></td>
                      <td><span className="skeleton" style={{ width: "8rem" }} /></td>
                      <td><span className="skeleton" style={{ width: "4rem" }} /></td>
                      <td><span className="skeleton" style={{ width: "6rem" }} /></td>
                      <td><span className="skeleton" style={{ width: "4rem" }} /></td>
                      <td><span className="skeleton" style={{ width: "3rem" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && (
            <div className="pageStateError" role="alert">
              <p className="errorText" style={{ margin: 0 }}>{error}</p>
            </div>
          )}
          {actionError && (
            <div className="pageStateError" role="alert">
              <p className="errorText" style={{ margin: 0 }}>{actionError}</p>
              <button type="button" className="btn btnSecondary btnSmall" style={{ marginTop: "0.5rem" }} onClick={() => setActionError(null)}>
                {dismiss}
              </button>
            </div>
          )}
          {!loading && !error ? (
            <div className="governanceTableWrap">
              <table className="proposalTable" aria-label="Proposals">
                <thead>
                  <tr>
                    <th>{governanceProposalId}</th>
                    <th>{governanceProposalTitle}</th>
                    <th>{governanceProposalStatus}</th>
                    <th>{governanceProposalVotes}</th>
                    <th>{governanceProposalEta}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.length === 0 ? (
                    <tr className="governanceEmptyRow">
                      <td>—</td>
                      <td className="proposalTitleCell">{governanceEmptyStateTitle}</td>
                      <td>
                        <span className="pill muted">—</span>
                        <ProposalStateTimeline state={0} />
                        <span className="governanceTimelinePlaceholderHint muted">{governanceTimelinePlaceholderHint}</span>
                      </td>
                      <td className="proposalVotesCell">
                        <ProposalVotesBar forVotes={0n} againstVotes={0n} abstainVotes={0n} quorum={overview.quorum} />
                      </td>
                      <td className="proposalEtaCell">—</td>
                      <td>
                        <button type="button" className="btn btnPrimary btnSmall" onClick={() => { setShowCreateModal(true); setCreateError(null); setCreateSuccess(null); }}>
                          {governanceCreateProposal}
                        </button>
                        <Link to="/admin/proposals" className="btn btnSecondary btnSmall">{governanceAdminLink}</Link>
                      </td>
                    </tr>
                  ) : (
                    proposals.map((p) => {
                      const stored = wallet.chainId != null ? getStoredProposal(wallet.chainId, p.id) : null;
                      const title = stored?.description?.trim()
                        ? (stored.description.length > 48 ? `${stored.description.slice(0, 45)}…` : stored.description)
                        : `${governanceProposalTitlePlaceholder} #${p.id}`;
                      return (
                        <tr key={p.id}>
                          <td><strong>{p.id}</strong></td>
                          <td className="proposalTitleCell">
                            <span className="proposalTitleText" title={stored?.description ?? undefined}>{title}</span>
                          </td>
                          <td>
                            <span className={stateBadgeClass(p.state)}>{p.stateName}</span>
                            <ProposalStateTimeline state={p.state} />
                          </td>
                          <td className="proposalVotesCell">
                            <ProposalVotesBar forVotes={p.forVotes} againstVotes={p.againstVotes} abstainVotes={p.abstainVotes} quorum={overview.quorum} />
                          </td>
                          <td className="proposalEtaCell">
                            <TimelockCountdown eta={p.eta} />
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              {p.state === 1 && (
                                <>
                                  <button type="button" className="btn btnSecondary btnSmall" onClick={() => openVoteModal(p.id)}>
                                    {governanceVote}
                                  </button>
                                  <button type="button" className="btn btnSecondary btnSmall" onClick={() => setDetailProposalId(p.id)}>
                                    {governanceProposalDetails}
                                  </button>
                                  {wallet.chainId != null && getStoredProposal(wallet.chainId, p.id) && (
                                    <button
                                      type="button"
                                      className="btn btnSecondary btnSmall"
                                      onClick={() => runQueueExecuteCancel(p.id, "cancel")}
                                      disabled={(actionSubmitting && actionProposalId === p.id) || split.mismatch}
                                    >
                                      {actionSubmitting && actionProposalId === p.id && actionType === "cancel" ? "…" : governanceCancel}
                                    </button>
                                  )}
                                </>
                              )}
                              {(p.state === 4 || p.state === 5) && (
                                <button type="button" className="btn btnSecondary btnSmall" onClick={() => setDetailProposalId(p.id)}>
                                  {governanceProposalDetails}
                                </button>
                              )}
                              {p.state === 4 && (
                                <button
                                  type="button"
                                  className="btn btnSecondary btnSmall"
                                  onClick={() => runQueueExecuteCancel(p.id, "queue")}
                                  disabled={(actionSubmitting && actionProposalId === p.id) || split.mismatch}
                                >
                                  {actionSubmitting && actionProposalId === p.id && actionType === "queue" ? "…" : governanceQueue}
                                </button>
                              )}
                              {p.state === 5 && (
                                <button
                                  type="button"
                                  className="btn btnSecondary btnSmall"
                                  onClick={() => runQueueExecuteCancel(p.id, "execute")}
                                  disabled={(actionSubmitting && actionProposalId === p.id) || split.mismatch}
                                >
                                  {actionSubmitting && actionProposalId === p.id && actionType === "execute" ? "…" : governanceExecute}
                                </button>
                              )}
                              {p.state !== 1 && p.state !== 4 && p.state !== 5 && (
                                <button type="button" className="btn btnSecondary btnSmall" onClick={() => setDetailProposalId(p.id)}>
                                  {governanceProposalDetails}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* Proposal details modal */}
              {detailProposalId != null && (() => {
                const stored = wallet.chainId != null ? getStoredProposal(wallet.chainId, detailProposalId) : null;
                const prop = proposals.find((p) => p.id === detailProposalId);
                return (
                  <div
                    className="modalOverlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="detail-modal-title"
                    onClick={() => setDetailProposalId(null)}
                  >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                      <h3 id="detail-modal-title" className="modalTitle">{governanceProposalDetails} — #{detailProposalId}</h3>
                      {stored ? (
                        <>
                          <p className="governanceKpiLabel">Description</p>
                          <p style={{ whiteSpace: "pre-wrap", marginBottom: "0.75rem" }}>{stored.description}</p>
                          <p className="governanceKpiLabel">Targets</p>
                          <p style={{ fontFamily: "monospace", fontSize: "var(--fontSize-xs)", marginBottom: "0.5rem" }}>{stored.targets.join(", ")}</p>
                          <p className="governanceKpiLabel">Values / Calldatas</p>
                          <p style={{ fontFamily: "monospace", fontSize: "var(--fontSize-xs)", wordBreak: "break-all" }}>
                            Values: {stored.values.join(", ")} — Calldatas: {stored.calldatas.join(", ")}
                          </p>
                          {prop && (
                            <p style={{ marginTop: "0.75rem" }}>
                              <span className={stateBadgeClass(prop.state)}>{prop.stateName}</span>
                              {" "}
                              <ProposalVotesBar forVotes={prop.forVotes} againstVotes={prop.againstVotes} abstainVotes={prop.abstainVotes} />
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="muted">No stored description for this proposal. It may have been created elsewhere.</p>
                      )}
                      <div className="modalFooter">
                        <button type="button" className="btn btnSecondary" onClick={() => setDetailProposalId(null)}>{closeLabel}</button>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {voteProposalId != null && (
                <div
                  className="modalOverlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="vote-modal-title"
                  onClick={closeVoteModal}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="vote-modal-title" className="modalTitle">{governanceVote} — Proposal {voteProposalId}</h3>
                    <p className="muted">Choose your vote (Active proposals only).</p>
                    <div className="voteOptions" style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <button
                        type="button"
                        className={`btn ${voteSupport === VOTE_FOR ? "btnPrimary" : "btnSecondary"}`}
                        onClick={() => setVoteSupport(VOTE_FOR)}
                        disabled={voteSubmitting}
                      >
                        {governanceVoteFor}
                      </button>
                      <button
                        type="button"
                        className={`btn ${voteSupport === VOTE_AGAINST ? "btnPrimary" : "btnSecondary"}`}
                        onClick={() => setVoteSupport(VOTE_AGAINST)}
                        disabled={voteSubmitting}
                      >
                        {governanceVoteAgainst}
                      </button>
                      <button
                        type="button"
                        className={`btn ${voteSupport === VOTE_ABSTAIN ? "btnPrimary" : "btnSecondary"}`}
                        onClick={() => setVoteSupport(VOTE_ABSTAIN)}
                        disabled={voteSubmitting}
                      >
                        {governanceVoteAbstain}
                      </button>
                    </div>
                    {voteError && <p className="errorText" role="alert">{voteError}</p>}
                    <div className="modalFooter">
                      <button
                        type="button"
                        className="btn btnPrimary"
                        onClick={submitVote}
                        disabled={voteSupport == null || voteSubmitting || split.mismatch}
                      >
                        {voteSubmitting ? "Submitting…" : "Confirm"}
                      </button>
                      <button type="button" className="btn btnSecondary" onClick={closeVoteModal} disabled={voteSubmitting}>
                        {closeLabel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showCreateModal && (
                <div
                  className="modalOverlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="create-modal-title"
                  onClick={() => { if (!createSubmitting) setShowCreateModal(false); }}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="create-modal-title" className="modalTitle">{governanceCreateProposal}</h3>
                    <p className="muted">Target contract and function call data (comma-sep for multiple). Values in wei.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <label>Target contract (addresses, comma-sep)</label>
                      <input
                        type="text"
                        value={createTargets}
                        onChange={(e) => setCreateTargets(e.target.value)}
                        placeholder="0x..."
                        disabled={createSubmitting || split.mismatch}
                        className="input"
                      />
                      <label>Values (wei, comma-sep)</label>
                      <input
                        type="text"
                        value={createValues}
                        onChange={(e) => setCreateValues(e.target.value)}
                        placeholder="0"
                        disabled={createSubmitting || split.mismatch}
                        className="input"
                      />
                      <label>Function call data (hex, comma-sep)</label>
                      <input
                        type="text"
                        value={createCalldatas}
                        onChange={(e) => setCreateCalldatas(e.target.value)}
                        placeholder="0x"
                        disabled={createSubmitting || split.mismatch}
                        className="input"
                      />
                      <p className="muted" style={{ fontSize: "var(--fontSize-xs)", marginTop: "0.25rem" }}>{governanceCalldataHint}</p>
                      <label>Description</label>
                      <textarea
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        placeholder="Proposal description"
                        disabled={createSubmitting || split.mismatch}
                        className="input"
                        rows={3}
                      />
                    </div>
                    {createError && <p className="errorText" role="alert">{createError}</p>}
                    <div className="modalFooter">
                      <button
                        type="button"
                        className="btn btnPrimary"
                        onClick={submitCreateProposal}
                        disabled={createSubmitting || split.mismatch}
                      >
                        {createSubmitting ? "Submitting…" : "Create proposal"}
                      </button>
                      <button type="button" className="btn btnSecondary" onClick={() => setShowCreateModal(false)} disabled={createSubmitting}>
                        {closeLabel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Delegate modal */}
              {showDelegateModal && (
                <div
                  className="modalOverlay"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delegate-modal-title"
                  onClick={() => { if (!delegateSubmitting) setShowDelegateModal(false); }}
                >
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3 id="delegate-modal-title" className="modalTitle">{governanceDelegateBtn}</h3>
                    <p className="muted">Delegate your voting power to another address.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <label>Delegatee address</label>
                      <input
                        type="text"
                        value={delegateAddress}
                        onChange={(e) => setDelegateAddress(e.target.value)}
                        placeholder="0x..."
                        disabled={delegateSubmitting}
                        className="input"
                      />
                    </div>
                    {delegateError && <p className="errorText" role="alert">{delegateError}</p>}
                    <div className="modalFooter">
                      <button type="button" className="btn btnPrimary" onClick={submitDelegate} disabled={delegateSubmitting || !delegateAddress.trim() || split.mismatch}>
                        {delegateSubmitting ? "Submitting…" : governanceDelegateBtn}
                      </button>
                      <button type="button" className="btn btnSecondary" onClick={() => setShowDelegateModal(false)} disabled={delegateSubmitting}>
                        {closeLabel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
      {!wallet.account && <p className="muted">{governanceNotConnected}</p>}
    </section>
  );
}
