import { useRef, type KeyboardEvent } from "react";
import SessionBreak from "../../components/session/SessionBreak";
import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

export default function HostBreakPanel({
  label,
  running,
  busy,
  nextChallenge,
  nextRound,
  roundCount,
  artUrl,
  preparation,
  schedule,
  onEditTimer,
  onToggleTimer,
  onStartNext,
  onEditChallenge,
}: {
  label: string;
  running: boolean;
  busy: boolean;
  nextChallenge?: {
    title: string;
    description: string;
    points: number;
    duration_minutes: number;
  };
  nextRound: number;
  roundCount: number;
  artUrl?: string | null;
  preparation?: { equipment?: string[]; setup?: string; prep?: string };
  schedule?: string;
  onEditTimer: () => void;
  onToggleTimer: () => void;
  onStartNext: () => void;
  onEditChallenge: () => void;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const nextDurationSeconds = Math.max(
    0,
    Math.round((nextChallenge?.duration_minutes ?? 0) * 60),
  );
  const nextDuration = `${Math.floor(nextDurationSeconds / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:${(nextDurationSeconds % 60).toString().padStart(2, "0")}`;
  function dismissMenu(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && menuRef.current?.open) {
      event.preventDefault();
      event.stopPropagation();
      menuRef.current.open = false;
      menuRef.current.querySelector("summary")?.focus();
    }
  }
  return (
    <div className="host-break-panel">
      <SessionBreak label={label} running={running}>
        {schedule && <p>{schedule}</p>}
        <details className="host-break-panel__menu" ref={menuRef}>
          <summary onKeyDown={dismissMenu}>
            <Icon name="pencil" aria-hidden="true" />
            Edit break
          </summary>
          <div className="host-break-panel__actions">
            <Button
              type="button"
              variant="control"
              fullWidth={false}
              disabled={busy}
              onClick={onEditTimer}
              onKeyDown={dismissMenu}
            >
              Edit break timer
            </Button>
            <Button
              type="button"
              variant="control"
              fullWidth={false}
              disabled={busy}
              onClick={onToggleTimer}
              onKeyDown={dismissMenu}
            >
              {running ? "Pause break" : "Resume break"}
            </Button>
            <Button
              type="button"
              variant="control-primary"
              fullWidth={false}
              disabled={busy || !nextChallenge}
              onClick={onStartNext}
              onKeyDown={dismissMenu}
            >
              Start next round
            </Button>
          </div>
        </details>
      </SessionBreak>
      {nextChallenge && (
        <SessionMainChallengeCard
          viewerRole="host"
          upcoming
          title={nextChallenge.title}
          description={nextChallenge.description}
          artUrl={artUrl}
          points={nextChallenge.points}
          round={nextRound}
          roundCount={roundCount}
          durationMinutes={nextChallenge.duration_minutes}
          timerCaption="ROUND LENGTH"
          timerLabel={nextDuration}
          details={
            <div className="host-break-panel__preparation">
              <p>
                <strong>Equipment: </strong>
                {preparation?.equipment?.length
                  ? preparation.equipment.join(", ")
                  : "Not specified"}
              </p>
              {preparation?.setup && (
                <p>
                  <strong>Setup: </strong>
                  {preparation.setup}
                </p>
              )}
              {preparation?.prep && (
                <p>
                  <strong>Preparation: </strong>
                  {preparation.prep}
                </p>
              )}
              <Button
                type="button"
                variant="control"
                fullWidth={false}
                disabled={busy}
                onClick={onEditChallenge}
              >
                <Icon
                  name="pencil"
                  className="icon--size-16"
                  aria-hidden="true"
                />
                Edit challenge
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}
