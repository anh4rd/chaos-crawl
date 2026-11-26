var e=`import type { ReactNode } from "react";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

export default function RoundFlowControls({
  heading,
  label,
  busy,
  rewardActive,
  currentRound,
  totalRounds,
  timerReady,
  onBreak,
  roundAwarded,
  canReward,
  timerRunning,
  onPrevious,
  onReview,
  onNext,
  children,
}: {
  heading: string;
  label: string;
  busy: boolean;
  rewardActive: boolean;
  currentRound: number;
  totalRounds: number;
  timerReady: boolean;
  onBreak: boolean;
  roundAwarded: boolean;
  canReward: boolean;
  timerRunning: boolean;
  onPrevious: () => void;
  onReview: () => void;
  onNext: () => void;
  children?: ReactNode;
}) {
  const reviewDisabled =
    busy ||
    (!rewardActive && (!timerReady || onBreak || roundAwarded || !canReward));
  const reviewLabel = rewardActive
    ? "Continue review"
    : timerRunning
      ? "Skip & review"
      : "Review";
  return (
    <div className="round-flow-controls" aria-label={label}>
      <span className="round-flow-controls__heading">{heading}</span>
      <div className="round-flow-controls__row">
        <Button
          type="button"
          variant="flow"
          fullWidth={false}
          disabled={busy || rewardActive || currentRound <= 1}
          onClick={onPrevious}
        >
          <Icon name="arrow-left" className="icon--size-13" /> Back
        </Button>
        <Button
          type="button"
          variant="flow-action"
          fullWidth={false}
          disabled={reviewDisabled}
          onClick={onReview}
        >
          <Icon name="trophy" className="icon--size-13" />
          {reviewLabel}
        </Button>
        <Button
          type="button"
          variant="flow"
          fullWidth={false}
          disabled={busy || rewardActive || currentRound >= totalRounds}
          onClick={onNext}
        >
          Next <Icon name="arrow-right" className="icon--size-13" />
        </Button>
      </div>
      {children}
    </div>
  );
}
`;export{e as default};