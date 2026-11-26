var e=`import { memo, useState, type ReactNode } from "react";
import ChallengeArtwork from "../../components/challenge/ChallengeArtwork";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import StatSummary from "../../components/ui/StatSummary";
import type { PlannedTaskInfo } from "../../types/hostSession";
import type {
  GameScheduleItem,
  SecretMissionAssignment,
  SessionChallenge,
  SessionPlayer,
  SessionStatus,
} from "./types";

type ItemKind = "main" | "side" | "break" | "voting" | "final" | "other";
type ItemStatus = "completed" | "current" | "upcoming";

const kindMeta: Record<ItemKind, { label: string; art?: string }> = {
  main: { label: "Main challenge" },
  side: { label: "Side challenge" },
  break: { label: "Break", art: "openmoji:2615" },
  voting: {
    label: "Voting / review",
    art: "openmoji:1F5F3",
  },
  final: { label: "Final phase", art: "openmoji:1F3C6" },
  other: { label: "Activity" },
};

const ScheduleArtwork = memo(ChallengeArtwork);

function classify(
  item: { type: string; phase?: string },
  challenge?: SessionChallenge,
): ItemKind {
  if (challenge) return challenge.kind === "side" ? "side" : "main";
  const text = \`\${item.type} \${item.phase ?? ""}\`.toLowerCase();
  if (text.includes("break")) return "break";
  if (text.includes("vot") || text.includes("review")) return "voting";
  if (text.includes("final")) return "final";
  return "other";
}

function startMinutes(startTime: string | null) {
  const match = startTime?.match(/^(\\d{1,2}):(\\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function clock(minutes: number) {
  const wrapped = minutes % (24 * 60);
  return \`\${String(Math.floor(wrapped / 60)).padStart(2, "0")}:\${String(wrapped % 60).padStart(2, "0")}\`;
}

interface Props {
  startTime: string | null;
  teamsEnabled: boolean;
  onBreak: boolean;
  onEditBreak: () => void;
  defaultBreakMinutes: number;
  plannedTasks: PlannedTaskInfo[];
  sessionStatus: SessionStatus;
  currentRound: number;
  schedule: GameScheduleItem[];
  challenges: SessionChallenge[];
  secretAssignments: SecretMissionAssignment[];
  secretMissionForms: ReactNode;
  playerById: Map<string, SessionPlayer>;
  busy: boolean;
  editable: boolean;
  onEdit: (challenge: SessionChallenge) => void;
}

export default function HostGameSchedule({
  startTime,
  teamsEnabled,
  onBreak,
  onEditBreak,
  defaultBreakMinutes,
  plannedTasks,
  sessionStatus,
  currentRound,
  schedule,
  challenges,
  secretAssignments,
  secretMissionForms,
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
      id: item.id ?? \`\${item.type}-\${item.taskId ?? item.title}-\${index}\`,
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
  const listed = [
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
  // Breaks between challenges follow the host timer: planned break items,
  // otherwise the plan's default break length.
  const items = listed.flatMap((item, index) => {
    const next = listed[index + 1];
    if (!item.challenge || !next?.challenge || defaultBreakMinutes <= 0)
      return [item];
    return [
      item,
      {
        id: \`break-after-\${item.id}\`,
        title: "Break",
        duration: defaultBreakMinutes,
        type: "break",
        phase: undefined as string | undefined,
        challenge: undefined,
      },
    ];
  });
  const itemCount = items.length;
  const challengeIndex = items.findIndex(
    (item) => item.challenge?.round_number === currentRound,
  );
  // A running break belongs to the break right after the current round.
  const breakActive =
    onBreak &&
    challengeIndex >= 0 &&
    items[challengeIndex + 1]?.type === "break";
  const currentIndex = breakActive ? challengeIndex + 1 : challengeIndex;
  const totalMinutes = items.reduce((sum, item) => sum + item.duration, 0);
  const firstStart = startMinutes(startTime);
  let elapsed = firstStart;
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
    return {
      ...item,
      start,
      status,
      kind: classify(item, item.challenge),
      nextTitle: items[index + 1]?.title,
    };
  });
  const completedRows = rows.filter((row) => row.status === "completed");
  const activeRows = rows.filter((row) => row.status !== "completed");
  const plannedFor = (challenge: SessionChallenge) =>
    plannedTasks.find(
      (task) => task.id === challenge.id || task.title === challenge.title,
    );
  const renderRow = (item: (typeof rows)[number]) => {
    const meta = kindMeta[item.kind];
    const challenge = item.challenge;
    const planned = challenge ? plannedFor(challenge) : undefined;
    const isBreak = item.kind === "break";
    return (
      <li
        key={item.id}
        className={\`host-game-schedule__item host-game-schedule__item--\${item.status} host-game-schedule__item--\${item.kind}\`}
        aria-current={item.status === "current" ? "step" : undefined}
      >
        <span className="host-game-schedule__marker" aria-hidden="true" />
        <details className="host-game-schedule__card">
          <summary className="host-game-schedule__row-summary">
            {item.status === "current" && (
              <span className="u-visually-hidden">Current: </span>
            )}
            <span className="host-game-schedule__time">
              {item.start === null ? (
                <>
                  <span aria-hidden="true">--:--</span>
                  <span className="u-visually-hidden">Start time not set</span>
                </>
              ) : (
                clock(item.start)
              )}
            </span>
            <strong className="host-game-schedule__title">
              {challenge?.round_number ? (
                <>
                  <span className="host-game-schedule__round">
                    Round {challenge.round_number}
                  </span>{" "}
                </>
              ) : null}
              {isBreak ? (
                <span className="host-game-schedule__break-label">
                  <Icon
                    name="coffee"
                    className="icon--size-16"
                    aria-hidden="true"
                  />
                  {item.title}
                </span>
              ) : (
                item.title
              )}
            </strong>
            <Icon
              name="chevron-right"
              className="disclosure-chevron icon--size-20"
              aria-hidden="true"
            />
          </summary>
          <div className="host-game-schedule__details">
            <div className="host-game-schedule__identity">
              <div className="host-game-schedule__identity-copy">
                {item.status === "current" && (
                  <span className="host-game-schedule__now">NOW</span>
                )}
                {!isBreak && (
                  <span className="host-game-schedule__kind">{meta.label}</span>
                )}
                <span>{item.duration} min</span>
              </div>
              <span className="host-game-schedule__art" aria-hidden="true">
                <ScheduleArtwork
                  selection={planned?.artUrl ?? meta.art}
                  title={item.title}
                  description={challenge?.description}
                />
              </span>
            </div>
            {challenge && (
              <div className="host-game-schedule__tags">
                <span className="host-game-schedule__award">
                  +{challenge.points} POINTS
                </span>
                <span className="host-game-schedule__mode">
                  {teamsEnabled ? "Compete in teams" : "Compete individually"}
                </span>
              </div>
            )}
            {item.phase && <p>{item.phase}</p>}
            {isBreak && item.nextTitle && (
              <p>After the break: {item.nextTitle}</p>
            )}
            {challenge?.description && <p>{challenge.description}</p>}
            {planned?.prep && (
              <p className="host-game-schedule__detail">
                <Icon
                  name="clipboard-list"
                  className="icon--size-16"
                  aria-hidden="true"
                />
                <span className="u-visually-hidden">Preparation: </span>
                {planned.prep}
              </p>
            )}
            {planned?.setup && (
              <p className="host-game-schedule__detail">
                <Icon
                  name="settings"
                  className="icon--size-16"
                  aria-hidden="true"
                />
                <span className="u-visually-hidden">Setup: </span>
                {planned.setup}
              </p>
            )}
            {planned?.equipment && planned.equipment.length > 0 && (
              <p className="host-game-schedule__detail">
                <Icon
                  name="shopping-bag"
                  className="icon--size-16"
                  aria-hidden="true"
                />
                <span className="u-visually-hidden">Equipment: </span>
                {planned.equipment.join(", ")}
              </p>
            )}
            {isBreak && (
              <>
                <Button
                  type="button"
                  variant="session-action"
                  fullWidth={false}
                  disabled={busy || !editable || item.status !== "current"}
                  aria-label="Edit break timer"
                  onClick={onEditBreak}
                >
                  <Icon name="pencil" className="icon--size-16" /> Edit
                </Button>
                {item.status !== "current" && (
                  <p>Break length can be edited while the break is running.</p>
                )}
              </>
            )}
            {challenge && (
              <Button
                type="button"
                variant="session-action"
                fullWidth={false}
                disabled={busy || !editable}
                aria-label={\`Edit \${challenge.title}\`}
                onClick={() => onEdit(challenge)}
              >
                <Icon name="pencil" className="icon--size-16" /> Edit
              </Button>
            )}
          </div>
        </details>
      </li>
    );
  };
  const secretRows = [...secretAssignments]
    .filter((assignment) => assignment.status !== "cancelled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((assignment) => {
      const challenge = challenges.find(
        (item) => item.id === assignment.challenge_id,
      );
      return {
        id: assignment.id,
        title: challenge?.title ?? "Secret mission",
        description: challenge?.description,
        artUrl: challenge ? plannedFor(challenge)?.artUrl : undefined,
        player: playerById.get(assignment.player_id)?.name,
        time: new Date(assignment.scheduled_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        revealed:
          assignment.status !== "scheduled" || Boolean(assignment.sent_at),
      };
    });

  const [view, setView] = useState<"main" | "secret">("main");
  const showSecrets = view === "secret";

  return (
    <div className="host-game-schedule">
      <header className="host-game-schedule__header">
        <StatSummary
          items={[
            {
              label: "Starts",
              value: firstStart === null ? "Not set" : clock(firstStart),
            },
            {
              label: "Ends",
              value:
                firstStart === null
                  ? "Not set"
                  : clock(firstStart + totalMinutes),
            },
            {
              label: "Length",
              value: \`\${itemCount} items · \${totalMinutes} min\`,
            },
          ]}
        />
      </header>
      <div
        className="host-game-schedule__views"
        role="group"
        aria-label="Schedule view"
      >
        <button
          type="button"
          className="host-game-schedule__view"
          aria-pressed={!showSecrets}
          onClick={() => setView("main")}
        >
          Main schedule ({itemCount})
        </button>
        <button
          type="button"
          className="host-game-schedule__view"
          aria-pressed={showSecrets}
          onClick={() => setView("secret")}
        >
          Secret missions ({secretRows.length})
        </button>
      </div>
      {showSecrets ? null : itemCount === 0 ? (
        <p>No game schedule is available for this session.</p>
      ) : (
        <ol
          className="host-game-schedule__timeline host-game-schedule__timeline--main"
          aria-label="Running order"
        >
          {completedRows.length > 0 && (
            <li className="host-game-schedule__item host-game-schedule__item--group">
              <span className="host-game-schedule__marker" aria-hidden="true" />
              <details className="host-game-schedule__card host-game-schedule__card--collapsed">
                <summary className="host-game-schedule__summary">
                  <span className="host-game-schedule__title">Completed</span>
                  <span className="host-game-schedule__status">
                    {completedRows.length}{" "}
                    {completedRows.length === 1 ? "item" : "items"}
                  </span>
                  <Icon
                    name="chevron-right"
                    className="disclosure-chevron icon--size-20"
                    aria-hidden="true"
                  />
                </summary>
                <ol
                  className="host-game-schedule__timeline host-game-schedule__timeline--main host-game-schedule__timeline--nested"
                  aria-label="Completed items"
                >
                  {completedRows.map(renderRow)}
                </ol>
              </details>
            </li>
          )}
          {activeRows.map(renderRow)}
        </ol>
      )}
      {showSecrets && (
        <section
          className="host-game-schedule__secrets"
          aria-labelledby="host-schedule-secrets"
        >
          <h3 id="host-schedule-secrets" className="host-game-schedule__event">
            <Icon name="lock-keyhole" className="icon--size-20" /> Secret
            mission reveals
          </h3>
          {editable && (
            <div className="host-game-schedule__mission-controls">
              {secretMissionForms}
            </div>
          )}
          {secretRows.length === 0 && <p>No secret missions assigned yet.</p>}
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
                  <div className="host-game-schedule__identity">
                    <strong className="host-game-schedule__title">
                      {row.title}
                    </strong>
                    <span
                      className="host-game-schedule__art"
                      aria-hidden="true"
                    >
                      <ScheduleArtwork
                        selection={row.artUrl}
                        title={row.title}
                        description={row.description}
                      />
                    </span>
                  </div>
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
`;export{e as default};