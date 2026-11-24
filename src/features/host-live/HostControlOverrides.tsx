import { useId, useState, type FormEvent, type ReactNode } from "react";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogPanel from "../../components/ui/DialogPanel";
import Disclosure from "../../components/ui/Disclosure";
import FormLabel from "../../components/ui/FormLabel";
import Icon from "../../components/ui/Icon";
import TimerReadout from "../../components/ui/TimerReadout";
import type { SessionChallenge } from "./types";

function PanelSummary({
  icon,
  title,
  status,
  live = false,
}: {
  icon: "coffee" | "star" | "lock-keyhole" | "flag";
  title: string;
  status: string;
  live?: boolean;
}) {
  return (
    <span className="control-console__summary">
      <span className="control-console__summary-icon">
        <Icon name={icon} className="icon--size-16" aria-hidden="true" />
      </span>
      <span className="control-console__summary-title">{title}</span>
      <span
        className={`control-console__summary-status${live ? " control-console__summary-status--live" : ""}`}
      >
        {status}
      </span>
      <Icon
        name="chevron-down"
        className="control-console__chevron icon--size-16"
        aria-hidden="true"
      />
    </span>
  );
}

interface Props {
  rounds: Pick<
    SessionChallenge,
    "id" | "title" | "round_number" | "description"
  >[];
  currentRound: number;
  status: string;
  busy: boolean;
  rewardActive: boolean;
  timerReady: boolean;
  onBreak: boolean;
  timerRunning: boolean;
  timerSeconds: number;
  timerText: string;
  currentRoundPointsAwarded: boolean;
  resumeRound: number | null;
  onMoveRound: (round: number) => void;
  onNextRound: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onRestartTimer: () => void;
  onSetTimer: (seconds: number) => void;
  onAddMinutes: (minutes: number) => void;
  onEditBreak: () => void;
  onStartBreak: () => void;
  onEditChallenge: (challengeId: string) => void;
  onReviewPoints: () => void;
  onReviewSubmissions: () => void;
  onSecretReview: () => void;
  onSchedule: () => void;
  onFinish: () => void;
  onMemories: () => void;
  onEndGameReview?: () => void;
  sideChallengeControls: ReactNode;
  secretMissionControls: ReactNode;
  endGameControls?: ReactNode;
}

export default function HostControlOverrides({
  rounds,
  currentRound,
  status,
  busy,
  rewardActive,
  timerReady,
  onBreak,
  timerRunning,
  timerSeconds,
  timerText,
  currentRoundPointsAwarded,
  resumeRound,
  onMoveRound,
  onNextRound,
  onToggleTimer,
  onResetTimer,
  onRestartTimer,
  onSetTimer,
  onAddMinutes,
  onEditBreak,
  onStartBreak,
  onEditChallenge,
  onReviewPoints,
  onReviewSubmissions,
  onSecretReview,
  onSchedule,
  onFinish,
  onMemories,
  onEndGameReview,
  sideChallengeControls,
  secretMissionControls,
  endGameControls,
}: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState<string | null>(null);
  const timerTitle = useId();
  const roundHeading = useId();
  const selected =
    rounds.find((round) => round.id === selectedId) ??
    rounds.find((round) => round.round_number === currentRound) ??
    rounds[0];
  const live = status === "live";
  const timerDisabled = busy || !live || !timerReady || rewardActive;
  const roundNumbers = rounds
    .map((round) => round.round_number ?? 0)
    .filter(Boolean);
  const firstRound = Math.min(...roundNumbers, currentRound);
  const lastRound = Math.max(...roundNumbers, currentRound);
  const currentChallenge = rounds.find(
    (round) => round.round_number === currentRound,
  );
  const expired = timerReady && timerSeconds === 0 && !timerRunning;
  const moveDisabled = busy || !live || rewardActive;

  function saveTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(timerMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) return;
    onSetTimer(minutes * 60);
    setTimerMinutes(null);
  }

  function confirmMove(round: number) {
    if (
      window.confirm(
        `Move directly to round ${round}? Its timer will reset, and any scheduled break will be skipped.`,
      )
    )
      onMoveRound(round);
  }

  const primary = rewardActive
    ? {
        label: "Continue reward flow",
        hint: "Finish the review to return everyone to the game.",
        onClick: onReviewPoints,
        disabled: busy,
      }
    : onBreak
      ? {
          label: "Start next round",
          hint: "A break is running. Start now to skip the rest of it.",
          onClick: () => onMoveRound(resumeRound ?? currentRound + 1),
          disabled: busy || !live,
        }
      : currentRoundPointsAwarded
        ? {
            label: "Next round",
            hint: "Points are saved. Move everyone on.",
            onClick: onNextRound,
            disabled: busy || !live || currentRound >= lastRound,
          }
        : expired
          ? {
              label: "Review points",
              hint: "Time's up. Review submissions and award points.",
              onClick: onReviewPoints,
              disabled: busy || !live,
            }
          : {
              label: timerRunning ? "Pause timer" : "Start timer",
              hint: timerRunning
                ? "The round is running."
                : "Players see the timer start when you do.",
              onClick: onToggleTimer,
              disabled: timerDisabled,
            };
  const stateLabel = rewardActive
    ? "REVIEW"
    : onBreak
      ? "BREAK"
      : currentRoundPointsAwarded
        ? "DONE"
        : timerRunning
          ? "LIVE"
          : "READY";

  return (
    <div className="control-console" data-tour="host-start-controls">
      <section
        className="control-console__round"
        aria-labelledby={roundHeading}
      >
        <div className="control-console__round-top">
          <span className="control-console__kicker">
            ROUND {currentRound} OF {rounds.length}
          </span>
          <span
            className={`control-console__state control-console__state--${stateLabel.toLowerCase()}`}
          >
            {stateLabel}
          </span>
        </div>
        <div className="control-console__card">
          <h2 id={roundHeading} className="control-console__title">
            {currentChallenge?.title ?? "Challenge not found"}
          </h2>
          {currentChallenge?.description && (
            <p className="control-console__description">
              {currentChallenge.description}
            </p>
          )}
          <div className="control-console__clock">
            {timerReady && (
              <TimerReadout
                label={onBreak ? "BREAK LEFT" : "TIME LEFT"}
                value={timerText}
              />
            )}
            <Button
              type="button"
              variant="session-edit"
              fullWidth={false}
              disabled={timerDisabled}
              aria-label={onBreak ? "Edit break timer" : "Edit round timer"}
              onClick={() => {
                if (onBreak) onEditBreak();
                else
                  setTimerMinutes(
                    String(Math.max(1, Math.ceil(timerSeconds / 60))),
                  );
              }}
            >
              <Icon
                name="pencil"
                className="icon--size-14"
                aria-hidden="true"
              />
            </Button>
          </div>
          <progress
            className="control-console__progress"
            aria-label="Round progress"
            max={Math.max(rounds.length, 1)}
            value={Math.min(
              rounds.length,
              currentRound - 1 + (currentRoundPointsAwarded ? 1 : 0),
            )}
          />
        </div>
        <div className="control-console__primary">
          <Button
            type="button"
            variant="session-action"
            className="control-console__next"
            disabled={primary.disabled}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
          <p>{primary.hint}</p>
        </div>
        <div className="control-console__actions">
          <Button
            type="button"
            variant="session-secondary"
            fullWidth={false}
            disabled={moveDisabled || currentRound <= firstRound}
            onClick={() => confirmMove(currentRound - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="session-secondary"
            fullWidth={false}
            disabled={moveDisabled || currentRound >= lastRound}
            onClick={() => confirmMove(currentRound + 1)}
          >
            Skip
          </Button>
          <Button
            type="button"
            variant="session-secondary"
            fullWidth={false}
            disabled={timerDisabled || onBreak}
            onClick={() => onAddMinutes(1)}
          >
            +1 min
          </Button>
        </div>
        <Disclosure
          variant="session"
          className="control-console__more"
          summary="More round tools"
        >
          <div className="control-console__tools">
            <FormLabel variant="review">
              Choose round
              <select
                value={selected?.id ?? ""}
                disabled={busy || rounds.length === 0}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    Round {round.round_number} · {round.title}
                  </option>
                ))}
              </select>
            </FormLabel>
            <ControlRow>
              <Button
                type="button"
                variant="session-action"
                fullWidth={false}
                disabled={
                  busy ||
                  !live ||
                  rewardActive ||
                  !selected?.round_number ||
                  (selected.round_number === currentRound && !onBreak)
                }
                onClick={() => {
                  if (selected?.round_number)
                    confirmMove(selected.round_number);
                }}
              >
                Change round
              </Button>
              <Button
                type="button"
                variant="session-secondary"
                fullWidth={false}
                disabled={busy || !live || !selected}
                onClick={() => selected && onEditChallenge(selected.id)}
              >
                Edit selected challenge
              </Button>
              <Button
                type="button"
                variant="session-secondary"
                fullWidth={false}
                onClick={onSchedule}
              >
                View all challenges and times
              </Button>
            </ControlRow>
            {!onBreak && (
              <ControlRow>
                <Button
                  type="button"
                  variant="session-secondary"
                  fullWidth={false}
                  disabled={timerDisabled}
                  onClick={() => onAddMinutes(5)}
                >
                  +5 minutes
                </Button>
                <Button
                  type="button"
                  variant="session-secondary"
                  fullWidth={false}
                  disabled={timerDisabled}
                  onClick={onResetTimer}
                >
                  Reset timer
                </Button>
                <Button
                  type="button"
                  variant="session-secondary"
                  fullWidth={false}
                  disabled={timerDisabled}
                  onClick={onRestartTimer}
                >
                  Restart timer
                </Button>
              </ControlRow>
            )}
            <ControlRow>
              <Button
                type="button"
                variant="session-secondary"
                fullWidth={false}
                disabled={busy || !live}
                onClick={onReviewPoints}
              >
                Review or open challenge voting
              </Button>
              <Button
                type="button"
                variant="session-secondary"
                fullWidth={false}
                onClick={onReviewSubmissions}
              >
                Review submissions and secret mission voting
              </Button>
            </ControlRow>
          </div>
        </Disclosure>
      </section>

      <Disclosure
        variant="session"
        className="control-console__panel"
        summary={
          <PanelSummary
            icon="coffee"
            title="Breaks"
            status={onBreak ? `On break · ${timerText}` : "None running"}
            live={onBreak}
          />
        }
      >
        <div className="control-console__breaks">
          {onBreak ? (
            <Button
              type="button"
              variant="session-secondary"
              fullWidth={false}
              disabled={busy || !live}
              onClick={() => onMoveRound(resumeRound ?? currentRound + 1)}
            >
              End break
            </Button>
          ) : (
            <Button
              type="button"
              variant="session-secondary"
              fullWidth={false}
              disabled={
                timerDisabled ||
                !rounds.some(
                  (round) => (round.round_number ?? 0) > currentRound,
                )
              }
              onClick={onStartBreak}
            >
              Start break
            </Button>
          )}
          <Button
            type="button"
            variant="session-secondary"
            fullWidth={false}
            disabled={!onBreak || busy}
            onClick={onEditBreak}
          >
            Edit duration
          </Button>
        </div>
      </Disclosure>

      <Disclosure
        variant="session"
        className="control-console__panel"
        summary={
          <PanelSummary
            icon="star"
            title="Side challenges"
            status="Voting, slideshow, TV"
          />
        }
      >
        {sideChallengeControls}
      </Disclosure>

      <Disclosure
        variant="session"
        className="control-console__panel control-console__panel--secret"
        summary={
          <PanelSummary
            icon="lock-keyhole"
            title="Secret missions"
            status="Reveal and manage"
          />
        }
      >
        <ControlRow>
          <Button
            type="button"
            variant="session-secondary"
            fullWidth={false}
            onClick={onSecretReview}
          >
            Manage secret missions
          </Button>
        </ControlRow>
        {secretMissionControls}
      </Disclosure>

      <Disclosure
        variant="session"
        className="control-console__panel control-console__panel--end"
        summary={
          <PanelSummary
            icon="flag"
            title="End game"
            status={status === "completed" ? "Completed" : "Finish the game"}
          />
        }
      >
        <p className="control-console__description">
          Finish the game to access the uploads and social clip creator.
        </p>
        <ControlRow>
          {status === "completed" ? (
            <Button
              type="button"
              variant="session-secondary"
              fullWidth={false}
              onClick={onMemories}
            >
              Open memories and social assets
            </Button>
          ) : (
            <Button
              type="button"
              variant="session-action"
              fullWidth={false}
              disabled={busy || !live || rewardActive}
              onClick={() => {
                if (
                  window.confirm(
                    "End the game and open the end phase? This cannot be undone.",
                  )
                )
                  onFinish();
              }}
            >
              End game and open end phase
            </Button>
          )}
          {onEndGameReview && (
            <Button
              type="button"
              variant="session-secondary"
              fullWidth={false}
              onClick={onEndGameReview}
            >
              Review end game
            </Button>
          )}
        </ControlRow>
        {endGameControls}
      </Disclosure>

      {timerMinutes !== null && !timerDisabled && !onBreak && (
        <Dialog
          label="Edit round timer"
          variant="host"
          labelledBy={timerTitle}
          onClose={() => setTimerMinutes(null)}
        >
          <DialogPanel as="form" onSubmit={saveTimer}>
            <h2 id={timerTitle}>Edit round timer</h2>
            <FormLabel spaced>
              Minutes remaining
              <input
                type="number"
                min={1}
                max={240}
                step={1}
                required
                value={timerMinutes}
                onChange={(event) => setTimerMinutes(event.target.value)}
              />
            </FormLabel>
            <DialogActions>
              <Button
                type="button"
                variant="dialog"
                fullWidth={false}
                onClick={() => setTimerMinutes(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="dialog-primary" fullWidth={false}>
                Save timer
              </Button>
            </DialogActions>
          </DialogPanel>
        </Dialog>
      )}
    </div>
  );
}
