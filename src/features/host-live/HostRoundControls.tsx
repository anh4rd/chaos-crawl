import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { RewardMethod } from "../../types/hostSession";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogPanel from "../../components/ui/DialogPanel";
import FormLabel from "../../components/ui/FormLabel";
import Icon from "../../components/ui/Icon";
import TimerReadout from "../../components/ui/TimerReadout";
import type { GameSession } from "./types";

interface Props {
  session: Pick<GameSession, "id" | "status" | "current_round_number">;
  rewardActive: boolean;
  openPointReview: () => void;
  hostBreakActive: boolean;
  currentRoundPointsAwarded: boolean;
  roundClockText: string;
  busy: boolean;
  moveToRound: (
    nextRound: number,
    confirmedOverride?: boolean,
    forceBreakMinutes?: number,
  ) => void;
  breakResumeRound: number | null;
  openBreakTimerEditor: () => void;
  requestMoveToRound: (nextRound: number) => void;
  totalRounds: number;
  requestStartBreak: () => void;
  roundTimerHydrated: boolean;
  roundClockSeconds: number;
  roundClockRunning: boolean;
  restartRoundTimer: () => void;
  enabledRewardMethods: RewardMethod[];
  startGameOrToggleTimer: () => void;
  resetRoundTimer: () => void;
  setRoundTimerSeconds: (seconds: number) => void;
  addRoundTimerMinutes: (minutes: number) => void;
  skipTimerAndReview: () => void;
}

export default function HostRoundControls({
  session,
  rewardActive,
  openPointReview,
  hostBreakActive,
  currentRoundPointsAwarded,
  roundClockText,
  busy,
  moveToRound,
  breakResumeRound,
  openBreakTimerEditor,
  requestMoveToRound,
  totalRounds,
  requestStartBreak,
  roundTimerHydrated,
  roundClockSeconds,
  roundClockRunning,
  restartRoundTimer,
  enabledRewardMethods,
  startGameOrToggleTimer,
  resetRoundTimer,
  setRoundTimerSeconds,
  addRoundTimerMinutes,
  skipTimerAndReview,
}: Props) {
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("");
  const dialogTitle = useId();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const complete = session.status === "completed";
  const expired =
    roundTimerHydrated && roundClockSeconds === 0 && !roundClockRunning;
  const showTimer =
    !complete &&
    !rewardActive &&
    (hostBreakActive || !currentRoundPointsAwarded) &&
    roundTimerHydrated;
  const canNavigate = session.status === "live" && !rewardActive;
  const canReview =
    session.status === "live" &&
    roundTimerHydrated &&
    !hostBreakActive &&
    !currentRoundPointsAwarded &&
    enabledRewardMethods.length > 0;
  const stage = complete
    ? "GAME COMPLETE"
    : rewardActive
      ? "REVIEW IN PROGRESS"
      : hostBreakActive
        ? "BREAK IN PROGRESS"
        : currentRoundPointsAwarded
          ? "ROUND COMPLETE"
          : !roundTimerHydrated
            ? "PREPARING TIMER"
            : expired
              ? "TIME'S UP – REVIEW"
              : roundClockRunning
                ? "ROUND IN PROGRESS"
                : "START TIMER";
  const icon =
    complete || currentRoundPointsAwarded
      ? "check-circle2"
      : rewardActive || expired
        ? "trophy"
        : hostBreakActive
          ? "coffee"
          : roundClockRunning
            ? "pause"
            : "play";

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
      menuRef.current.querySelector("summary")?.focus();
    }
  }
  function dismissMenu(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && menuRef.current?.open) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    }
  }
  function editTime() {
    setMinutes(String(Math.max(1, Math.ceil(roundClockSeconds / 60))));
    setEditingTime(`${session.id}:${session.current_round_number}`);
  }
  function saveTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 240) return;
    setRoundTimerSeconds(value * 60);
    setEditingTime(null);
  }

  return (
    <ContentPanel
      variant="controls"
      className="host-round-controls"
      aria-label="Host controls"
      data-tour="host-controls-tab"
    >
      <div className="host-round-controls__top">
        <h2>HOST CONTROLS</h2>
        <span
          className="host-round-controls__round"
          aria-label={`Round ${session.current_round_number} of ${totalRounds}`}
        >
          {session.current_round_number}/{totalRounds}
        </span>
        <details className="host-round-controls__menu" ref={menuRef}>
          <summary
            aria-label="Host control recovery actions"
            onKeyDown={dismissMenu}
          >
            <Icon
              name="more-vertical"
              className="icon--size-20"
              aria-hidden="true"
            />
          </summary>
          <div className="host-round-controls__menu-content">
            {hostBreakActive && !rewardActive && !complete ? (
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy}
                onClick={openBreakTimerEditor}
                onKeyDown={dismissMenu}
              >
                Edit break timer
              </Button>
            ) : showTimer && !hostBreakActive ? (
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy}
                onKeyDown={dismissMenu}
                onClick={() => {
                  closeMenu();
                  if (
                    window.confirm(
                      expired
                        ? "Restart the round timer?"
                        : "Reset the round timer and pause it?",
                    )
                  ) {
                    if (expired) restartRoundTimer();
                    else resetRoundTimer();
                  }
                }}
              >
                {expired ? "Play timer again" : "Redo timer"}
              </Button>
            ) : (
              <span>No recovery actions available.</span>
            )}
          </div>
        </details>
      </div>
      <div className="host-round-controls__main">
        <div className="host-round-controls__title">
          <Icon
            name={icon}
            className="host-round-controls__stage-icon"
            aria-hidden="true"
          />
          <div>
            <h3>{stage}</h3>
            <p>
              {complete
                ? "Game complete. Your players can review the final scores."
                : rewardActive
                  ? "Continue the review to return everyone to the game."
                  : hostBreakActive
                    ? "The next round starts when the break ends."
                    : currentRoundPointsAwarded
                      ? "Points saved. What's next?"
                      : !roundTimerHydrated
                        ? "Preparing the round timer…"
                        : expired
                          ? "Review submissions and award points."
                          : roundClockRunning
                            ? "The timer is running."
                            : "Set the duration and start the round."}
            </p>
          </div>
        </div>
        <div className="host-round-controls__primary">
          {showTimer && (
            <TimerReadout label="TIME REMAINING" value={roundClockText} />
          )}
          {!complete &&
            (rewardActive ? (
              <Button
                type="button"
                variant="control-primary"
                fullWidth={false}
                disabled={busy}
                onClick={openPointReview}
              >
                Continue reward flow
              </Button>
            ) : hostBreakActive ? (
              <Button
                type="button"
                variant="control-primary"
                fullWidth={false}
                disabled={busy}
                onClick={() =>
                  void moveToRound(
                    breakResumeRound ?? session.current_round_number + 1,
                  )
                }
              >
                Start Now
              </Button>
            ) : currentRoundPointsAwarded && !complete ? (
              <Button
                type="button"
                variant="control-primary"
                fullWidth={false}
                disabled={busy || session.current_round_number >= totalRounds}
                onClick={() =>
                  requestMoveToRound(session.current_round_number + 1)
                }
              >
                Next Round{" "}
                <Icon
                  name="arrow-right"
                  className="icon--size-16"
                  aria-hidden="true"
                />
              </Button>
            ) : showTimer && expired ? (
              <Button
                type="button"
                variant="control-primary"
                fullWidth={false}
                disabled={busy || !canReview}
                onClick={openPointReview}
              >
                Review Points
              </Button>
            ) : showTimer ? (
              <Button
                type="button"
                variant={roundClockRunning ? "control" : "control-primary"}
                fullWidth={false}
                disabled={busy}
                onClick={startGameOrToggleTimer}
              >
                {roundClockRunning ? "Pause" : "Start Timer"}{" "}
                <Icon
                  name={roundClockRunning ? "pause" : "play"}
                  className="icon--size-17"
                  aria-hidden="true"
                />
              </Button>
            ) : null)}
        </div>
      </div>
      {canNavigate && (
        <div
          className="host-round-controls__secondary"
          aria-label="Round actions"
        >
          {showTimer && !hostBreakActive && roundClockRunning && (
            <>
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy}
                onClick={() => addRoundTimerMinutes(1)}
              >
                +1 Min
              </Button>
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy}
                onClick={() => addRoundTimerMinutes(5)}
              >
                +5 Min
              </Button>
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy || !canReview}
                onClick={skipTimerAndReview}
              >
                End Early
              </Button>
            </>
          )}
          {showTimer && !hostBreakActive && !roundClockRunning && (
            <Button
              type="button"
              variant="flow"
              fullWidth={false}
              disabled={busy}
              onClick={editTime}
            >
              {expired ? "Add Time" : "Edit Time"}
            </Button>
          )}
          {currentRoundPointsAwarded && !hostBreakActive && (
            <Button
              type="button"
              variant="flow"
              fullWidth={false}
              disabled={busy || session.current_round_number >= totalRounds}
              onClick={requestStartBreak}
            >
              <Icon
                name="coffee"
                className="icon--size-16"
                aria-hidden="true"
              />{" "}
              Take a Break
            </Button>
          )}
          <Button
            type="button"
            variant="flow"
            fullWidth={false}
            disabled={busy || session.current_round_number <= 1}
            onClick={() => {
              if (
                !roundClockRunning ||
                window.confirm("Leave this round while the timer is running?")
              )
                requestMoveToRound(session.current_round_number - 1);
            }}
          >
            <Icon
              name="arrow-left"
              className="icon--size-16"
              aria-hidden="true"
            />{" "}
            {currentRoundPointsAwarded ? "Previous Round" : "Previous"}
          </Button>
          {!currentRoundPointsAwarded && (
            <>
              {!roundClockRunning && !expired && (
                <Button
                  type="button"
                  variant="flow"
                  fullWidth={false}
                  disabled={busy || !canReview}
                  onClick={skipTimerAndReview}
                >
                  Review
                </Button>
              )}
              <Button
                type="button"
                variant="flow"
                fullWidth={false}
                disabled={busy || session.current_round_number >= totalRounds}
                onClick={() => {
                  if (
                    window.confirm(
                      "Move to the next round? This may skip the current round or break.",
                    )
                  )
                    requestMoveToRound(session.current_round_number + 1);
                }}
              >
                Next{" "}
                <Icon
                  name="arrow-right"
                  className="icon--size-16"
                  aria-hidden="true"
                />
              </Button>
            </>
          )}
        </div>
      )}
      {editingTime === `${session.id}:${session.current_round_number}` &&
        showTimer &&
        !hostBreakActive &&
        !roundClockRunning && (
          <Dialog
            label="Edit round timer"
            variant="host"
            labelledBy={dialogTitle}
            onClose={() => setEditingTime(null)}
          >
            <DialogPanel as="form" onSubmit={saveTime}>
              <h2 id={dialogTitle}>Edit round timer</h2>
              <p>
                Set the remaining time before starting or resuming the timer.
              </p>
              <FormLabel spaced>
                Minutes
                <input
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  required
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
              </FormLabel>
              <DialogActions>
                <Button
                  type="button"
                  variant="dialog"
                  fullWidth={false}
                  onClick={() => setEditingTime(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="dialog-primary"
                  fullWidth={false}
                >
                  Save timer
                </Button>
              </DialogActions>
            </DialogPanel>
          </Dialog>
        )}
    </ContentPanel>
  );
}
