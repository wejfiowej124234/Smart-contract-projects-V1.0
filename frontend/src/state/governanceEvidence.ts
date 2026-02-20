/**
 * P2: Last proposal-created evidence for debug bundle / session persistence.
 * Survives refresh so screenshot + Copy debug bundle can reproduce without relying on UI toast.
 * schemaVersion + governorAddress + govTokenAddress allow matching evidence to a deployment after chain reset.
 */
const STORAGE_KEY = "gov_proposal_created_evidence";
export const EVIDENCE_SCHEMA_VERSION = 1;

export type ProposalCreatedEvidence = {
  schemaVersion: number;
  chainId: number;
  governorAddress: string;
  govTokenAddress: string;
  proposalId: number;
  snapshot: string;
  deadline: string;
  quorumAtSnapshot: string;
  votesAtSnapshot: string;
  txHash: string;
  createdAt: string;
};

export function setLastProposalCreatedEvidence(ev: ProposalCreatedEvidence): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ev));
  } catch {
    /* ignore */
  }
}

export function getLastProposalCreatedEvidence(): ProposalCreatedEvidence | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProposalCreatedEvidence) : null;
  } catch {
    return null;
  }
}
