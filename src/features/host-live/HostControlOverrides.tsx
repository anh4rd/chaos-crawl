import { useId, useState, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import ControlRow from "../../components/ui/ControlRow";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogPanel from "../../components/ui/DialogPanel";
import FormLabel from "../../components/ui/FormLabel";
import TimerReadout from "../../components/ui/TimerReadout";
import type { SessionChallenge } from "./types";

interface Props {
  rounds: Pick<SessionChallenge, "id" | "title" | "round_number">[];
  currentRound: number;
  status: string;
  busy: boolean;
  rewardActive: boolean;
  timerReady: boolean;
  onBreak: boolean;
  timerRunning: boolean;
  timerSeconds: number;
  timerText: string;
  onMoveRound: (round: number) => void;
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
  onMoveRound,
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
}: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState<string | null>(null);
  const timerTitle = useId();
  const selected =
    rounds.find((round) => round.id === selectedId) ??
    rounds.find((round) => round.round_number === currentRound) ??
    rounds[0];
  const live = status === "live";
  const timerDisabled = busy || !live || !timerReady || rewardActive;

  function saveTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(timerMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) return;
    onSetTimer(minutes * 60);
    setTimerMinutes(null);
  }

  return (
    <ContentPanel variant="session" stacked data-tour="host-start-controls">
      <h2>Control overrides</h2>
      <p>
        Choose an action directly. Changing rounds resets the selected round’s
        timer and skips any scheduled break.
      </p>
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
            if (
              selected?.round_number &&
              window.confirm(
                `Move directly to round ${selected.round_number}? Its timer will reset, and any scheduled break will be skipped.`,
              )
            )
              onMoveRound(selected.round_number);
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
      <h3>Current timer</h3>
      <p>
        {onBreak ? "Break timer" : `Round ${currentRound} timer`}
        {rewardActive && " · Complete or cancel the reward flow first."}
      </p>
      {timerReady && <TimerReadout label="Time remaining" value={timerText} />}
      <ControlRow>
        <Button
          type="button"
          variant="session-action"
          fullWidth={false}
          disabled={timerDisabled || (onBreak && timerSeconds === 0)}
          onClick={onToggleTimer}
        >
          {timerRunning ? "Pause timer" : "Start timer"}
        </Button>
        <Button
          type="button"
          variant="session-secondary"
          fullWidth={false}
          disabled={timerDisabled}
          onClick={() => {
            if (onBreak) onEditBreak();
            else
              setTimerMinutes(
                String(Math.max(1, Math.ceil(timerSeconds / 60))),
              );
          }}
        >
          Edit timer
        </Button>
        {!onBreak && (
          <>
            <Button
              type="button"
              variant="session-secondary"
              fullWidth={false}
              disabled={timerDisabled}
              onClick={() => onAddMinutes(1)}
            >
              +1 minute
            </Button>
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
          </>
        )}
        <Button
          type="button"
          variant="session-secondary"
          fullWidth={false}
          disabled={
            timerDisabled ||
            onBreak ||
            !rounds.some((round) => (round.round_number ?? 0) > currentRound)
          }
          onClick={onStartBreak}
        >
          Start break
        </Button>
      </ControlRow>
      <h3>Reviews and voting</h3>
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
        <Button
          type="button"
          variant="session-secondary"
          fullWidth={false}
          onClick={onSecretReview}
        >
          Manage secret missions
        </Button>
      </ControlRow>
      <h3>End phase</h3>
      <p>Finish the game to access the uploads and social clip creator.</p>
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
          variant="session-secondary"
          fullWidth={false}
          disabled={busy || !live || rewardActive}
          onClick={onFinish}
        >
          Finish game and open end phase
        </Button>
      )}
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
    </ContentPanel>
  );
}
