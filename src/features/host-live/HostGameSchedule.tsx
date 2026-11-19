import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import CountBadge from "../../components/ui/CountBadge";
import Icon from "../../components/ui/Icon";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import type { GameScheduleItem, SessionChallenge } from "./types";

interface Props {
  schedule: GameScheduleItem[];
  challenges: SessionChallenge[];
  busy: boolean;
  editable: boolean;
  onEdit: (challenge: SessionChallenge) => void;
}

export default function HostGameSchedule({
  schedule,
  challenges,
  busy,
  editable,
  onEdit,
}: Props) {
  const scheduledItems = schedule.map((item, index) => {
    const challenge =
      item.type === "challenge"
        ? challenges.find(
            (candidate) =>
              candidate.kind !== "secret" &&
              (candidate.id === item.taskId || candidate.title === item.title),
          )
        : undefined;
    return {
      id: item.id ?? `${item.type}-${item.taskId ?? item.title}-${index}`,
      title: item.title,
      duration: item.duration,
      type: item.type,
      phase: item.phase,
      challenge,
    };
  });
  const scheduledChallengeIds = new Set(
    scheduledItems.flatMap((item) =>
      item.challenge ? [item.challenge.id] : [],
    ),
  );
  const unlistedChallenges = challenges.filter(
    (challenge) =>
      challenge.kind !== "secret" && !scheduledChallengeIds.has(challenge.id),
  );
  const itemCount = scheduledItems.length + unlistedChallenges.length;

  return (
    <ContentPanel variant="session" stacked>
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session">
            FULL GAME SCHEDULE
          </Overline>
          <h2>Game schedule</h2>
          <p>
            Review the planned running order and edit any challenge in this
            session.
          </p>
        </div>
        <CountBadge variant="session">{itemCount} items</CountBadge>
      </PanelHeading>
      {itemCount === 0 ? (
        <p>No game schedule is available for this session.</p>
      ) : (
        <div className="host-game-schedule">
          {[
            ...scheduledItems,
            ...unlistedChallenges.map((challenge) => ({
              id: challenge.id,
              title: challenge.title,
              duration: challenge.duration_minutes,
              type: challenge.kind,
              phase: undefined,
              challenge,
            })),
          ].map((item) => {
            const challenge = item.challenge;
            return (
              <article className="host-game-schedule__item" key={item.id}>
                <div className="host-game-schedule__copy">
                  <Badge variant="round">
                    {challenge?.round_number
                      ? `ROUND ${challenge.round_number}`
                      : item.type.replaceAll("-", " ")}
                  </Badge>
                  <strong>{item.title}</strong>
                  <span>
                    {item.duration} min
                    {item.phase ? ` · ${item.phase}` : ""}
                    {challenge ? ` · ${challenge.points} points` : ""}
                  </span>
                </div>
                {challenge && (
                  <Button
                    type="button"
                    variant="session-secondary"
                    fullWidth={false}
                    disabled={busy || !editable}
                    aria-label={`Edit ${challenge.title}`}
                    onClick={() => onEdit(challenge)}
                  >
                    <Icon name="pencil" className="icon--size-14" /> Edit
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </ContentPanel>
  );
}
