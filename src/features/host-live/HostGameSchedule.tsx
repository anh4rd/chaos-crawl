import Button from "../../components/ui/Button";
import Icon, { type IconName } from "../../components/ui/Icon";
import type {
  GameScheduleItem,
  SecretMissionAssignment,
  SessionChallenge,
  SessionPlayer,
  SessionStatus,
} from "./types";

type ItemKind = "main" | "side" | "break" | "voting" | "final" | "other";
type ItemStatus = "completed" | "current" | "upcoming";

const kindMeta: Record<ItemKind, { label: string; icon: IconName }> = {
  main: { label: "Main challenge", icon: "flag" },
  side: { label: "Side challenge", icon: "star" },
  break: { label: "Break", icon: "coffee" },
  voting: { label: "Voting / review", icon: "list-checks" },
  final: { label: "Final phase", icon: "trophy" },
  other: { label: "Activity", icon: "circle-dot" },
};
const statusLabel: Record<ItemStatus, string> = {
  completed: "Completed",
  current: "Current",
  upcoming: "Upcoming",
};

function classify(
  item: { type: string; phase?: string },
  challenge?: SessionChallenge,
): ItemKind {
  if (challenge) return challenge.kind === "side" ? "side" : "main";
  const text = `${item.type} ${item.phase ?? ""}`.toLowerCase();
  if (text.includes("break")) return "break";
  if (text.includes("vot") || text.includes("review")) return "voting";
  if (text.includes("final")) return "final";
  return "other";
}

function startMinutes(startTime: string | null) {
  const match = startTime?.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function clock(minutes: number) {
  const wrapped = minutes % (24 * 60);
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

interface Props {
  eventName: string;
  startTime: string | null;
  sessionStatus: SessionStatus;
  currentRound: number;
  schedule: GameScheduleItem[];
  challenges: SessionChallenge[];
  secretAssignments: SecretMissionAssignment[];
  playerById: Map<string, SessionPlayer>;
  busy: boolean;
  editable: boolean;
  onEdit: (challenge: SessionChallenge) => void;
}

export default function HostGameSchedule({
  eventName,
  startTime,
  sessionStatus,
  currentRound,
  schedule,
  challenges,
  secretAssignments,
  playerById,
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
  const items = [
    ...scheduledItems,
    ...unlistedChallenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      duration: challenge.duration_minutes,
      type: challenge.kind,
      phase: undefined as string | undefined,
      challenge,
    })),
  ];
  const currentIndex = items.findIndex(
    (item) => item.challenge?.round_number === currentRound,
  );
  const totalMinutes = items.reduce((sum, item) => sum + item.duration, 0);
  let elapsed = startMinutes(startTime);
  const rows = items.map((item, index) => {
    const start = elapsed;
    if (elapsed !== null) elapsed += item.duration;
    const status: ItemStatus =
      sessionStatus === "completed"
        ? "completed"
        : sessionStatus === "lobby" || currentIndex < 0
          ? "upcoming"
          : index < currentIndex
            ? "completed"
            : index === currentIndex
              ? "current"
              : "upcoming";
    return { ...item, start, status, kind: classify(item, item.challenge) };
  });
  const secretRows = [...secretAssignments]
    .filter((assignment) => assignment.status !== "cancelled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((assignment) => ({
      id: assignment.id,
      title:
        challenges.find((challenge) => challenge.id === assignment.challenge_id)
          ?.title ?? "Secret mission",
      player: playerById.get(assignment.player_id)?.name,
      time: new Date(assignment.scheduled_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      revealed:
        assignment.status !== "scheduled" || Boolean(assignment.sent_at),
    }));

  return (
    <div className="host-game-schedule">
      <header className="host-game-schedule__header">
        <h3 className="host-game-schedule__event">{eventName}</h3>
        <p>
          {itemCount} items · {totalMinutes} min total
        </p>
      </header>
      {itemCount === 0 ? (
        <p>No game schedule is available for this session.</p>
      ) : (
        <ol className="host-game-schedule__timeline" aria-label="Running order">
          {rows.map((item) => {
            const meta = kindMeta[item.kind];
            const challenge = item.challenge;
            return (
              <li
                key={item.id}
                className={`host-game-schedule__item host-game-schedule__item--${item.status} host-game-schedule__item--${item.kind}`}
                aria-current={item.status === "current" ? "step" : undefined}
              >
                <span className="host-game-schedule__marker" aria-hidden="true">
                  <Icon name={meta.icon} className="icon--size-14" />
                </span>
                <div className="host-game-schedule__card">
                  <div className="host-game-schedule__meta">
                    {item.start !== null && (
                      <strong className="host-game-schedule__time">
                        {clock(item.start)}
                      </strong>
                    )}
                    <span>{item.duration} min</span>
                    <span className="host-game-schedule__kind">
                      {meta.label}
                      {challenge?.round_number
                        ? ` · Round ${challenge.round_number}`
                        : ""}
                    </span>
                    <span className="host-game-schedule__status">
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <strong className="host-game-schedule__title">
                    {item.title}
                  </strong>
                  {(item.phase || challenge) && (
                    <small>
                      {item.phase}
                      {item.phase && challenge ? " · " : ""}
                      {challenge ? `${challenge.points} points` : ""}
                    </small>
                  )}
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
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {secretRows.length > 0 && (
        <section
          className="host-game-schedule__secrets"
          aria-labelledby="host-schedule-secrets"
        >
          <h3 id="host-schedule-secrets" className="host-game-schedule__event">
            <Icon name="lock-keyhole" className="icon--size-20" /> Secret
            mission reveals
          </h3>
          <ol className="host-game-schedule__timeline">
            {secretRows.map((row) => (
              <li
                key={row.id}
                className="host-game-schedule__item host-game-schedule__item--secret"
              >
                <span className="host-game-schedule__marker" aria-hidden="true">
                  <Icon name="lock-keyhole" className="icon--size-14" />
                </span>
                <div className="host-game-schedule__card">
                  <div className="host-game-schedule__meta">
                    <strong className="host-game-schedule__time">
                      {row.time}
                    </strong>
                    <span className="host-game-schedule__status">
                      {row.revealed ? "Revealed" : "Scheduled"}
                    </span>
                  </div>
                  <strong className="host-game-schedule__title">
                    {row.title}
                  </strong>
                  {row.player && <small>Assigned to {row.player}</small>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
