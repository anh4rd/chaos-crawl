var e=`import SessionMainChallengeCard from "../../components/session/SessionMainChallengeCard";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

export default function HostBreakPanel({
  busy,
  nextChallenge,
  nextRound,
  roundCount,
  artUrl,
  preparation,
  schedule,
  onEditChallenge,
}: {
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
  onEditChallenge: () => void;
}) {
  const nextDurationSeconds = Math.max(
    0,
    Math.round((nextChallenge?.duration_minutes ?? 0) * 60),
  );
  const nextDuration = \`\${Math.floor(nextDurationSeconds / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:\${(nextDurationSeconds % 60).toString().padStart(2, "0")}\`;
  return (
    <div className="host-break-panel">
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
              <p className="host-break-panel__item">
                <Icon
                  name="shopping-bag"
                  className="icon--size-16"
                  aria-hidden="true"
                />
                <span className="u-visually-hidden">Equipment: </span>
                {preparation?.equipment?.length
                  ? preparation.equipment.join(", ")
                  : "Not specified"}
              </p>
              {preparation?.setup && (
                <p className="host-break-panel__item">
                  <Icon
                    name="clipboard-list"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                  <span className="u-visually-hidden">Setup: </span>
                  {preparation.setup}
                </p>
              )}
              {preparation?.prep && (
                <p className="host-break-panel__item">
                  <Icon
                    name="list-checks"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                  <span className="u-visually-hidden">Preparation: </span>
                  {preparation.prep}
                </p>
              )}
              {schedule && <p>{schedule}</p>}
              <div className="host-break-panel__edit">
                <Button
                  type="button"
                  variant="session-edit"
                  fullWidth={false}
                  disabled={busy}
                  aria-label="Edit next challenge"
                  onClick={onEditChallenge}
                >
                  <Icon
                    name="pencil"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
`;export{e as default};