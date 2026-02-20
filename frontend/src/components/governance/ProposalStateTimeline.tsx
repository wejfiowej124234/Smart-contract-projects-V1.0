import {
  governancePending,
  governanceActive,
  governanceSucceeded,
  governanceQueued,
  governanceExecuted,
  governanceDefeated,
  governanceCanceled,
  governanceExpired,
} from "../../config/ui";

/** OpenZeppelin Governor state enum. */
const STATE_PENDING = 0;
const STATE_ACTIVE = 1;
const STATE_CANCELED = 2;
const STATE_DEFEATED = 3;
const STATE_SUCCEEDED = 4;
const STATE_QUEUED = 5;
const STATE_EXPIRED = 6;
const STATE_EXECUTED = 7;

const SUCCESS_PATH: { state: number; label: string }[] = [
  { state: STATE_PENDING, label: governancePending },
  { state: STATE_ACTIVE, label: governanceActive },
  { state: STATE_SUCCEEDED, label: governanceSucceeded },
  { state: STATE_QUEUED, label: governanceQueued },
  { state: STATE_EXECUTED, label: governanceExecuted },
];

function stateLabel(state: number): string {
  if (state === STATE_CANCELED) return governanceCanceled;
  if (state === STATE_DEFEATED) return governanceDefeated;
  if (state === STATE_EXPIRED) return governanceExpired;
  const found = SUCCESS_PATH.find((s) => s.state === state);
  return found?.label ?? `State ${state}`;
}

export function ProposalStateTimeline({ state }: { state: number }) {
  const isFailed = state === STATE_CANCELED || state === STATE_DEFEATED || state === STATE_EXPIRED;
  const currentIndex = SUCCESS_PATH.findIndex((s) => s.state === state);

  return (
    <div className="proposalStateTimeline" role="status" aria-label={`Proposal status: ${stateLabel(state)}`}>
      <div className="proposalStateTimelineTrack">
        {SUCCESS_PATH.map((step, i) => {
          const isPast = currentIndex > i;
          const isCurrent = currentIndex === i && !isFailed;
          const isFuture = currentIndex < i && !isFailed;
          return (
            <div
              key={step.state}
              className={`proposalStateTimelineStep ${isPast ? "proposalStateTimelineStep--past" : ""} ${isCurrent ? "proposalStateTimelineStep--current" : ""} ${isFuture ? "proposalStateTimelineStep--future" : ""}`}
            >
              <span className="proposalStateTimelineDot" aria-hidden />
              {i < SUCCESS_PATH.length - 1 && <span className="proposalStateTimelineLine" aria-hidden />}
              <span className="proposalStateTimelineLabel">{step.label}</span>
            </div>
          );
        })}
      </div>
      {isFailed && (
        <p className="proposalStateTimelineFailed" role="status">
          {stateLabel(state)}
        </p>
      )}
    </div>
  );
}
