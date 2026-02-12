import { approvalModeLabel, exactSafer, infiniteConvenience, enterpriseNoteInfiniteApproval, enterpriseNoticeTitle, enterpriseNoticeWarningChar } from "../../config/ui";

export function ApproveToolbar(props: { approveMode: "exact" | "infinite"; setApproveMode: (m: "exact" | "infinite") => void; disabled: boolean }) {
  const { approveMode, setApproveMode, disabled } = props;
  return (
    <div className="toolbar approveToolbarWrap">
      <div className="approveToolbarLabelRow">
        {approvalModeLabel}:
        <label className="approveToolbarLabel">
          <input type="radio" name="approveMode" checked={approveMode === "exact"} disabled={disabled} onChange={() => setApproveMode("exact")} /> {exactSafer}
        </label>
        <label className="approveToolbarLabel">
          <input type="radio" name="approveMode" checked={approveMode === "infinite"} disabled={disabled} onChange={() => setApproveMode("infinite")} /> {infiniteConvenience}
        </label>
      </div>
      {approveMode === "infinite" && (
        <div className="banner bannerWarn enterpriseNote" role="note" aria-label={enterpriseNoticeTitle}>
          <span className="enterpriseNoticeIcon" aria-hidden="true">{enterpriseNoticeWarningChar}</span>
          {enterpriseNoteInfiniteApproval}
        </div>
      )}
    </div>
  );
}
