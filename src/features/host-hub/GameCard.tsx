import Note from "../../components/ui/Note";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

import ChallengeIcons from "../../components/challenge/ChallengeIcons";
import CoverArtwork from "../../components/ui/CoverArtwork";
import StatusPill from "../../components/ui/StatusPill";
import { dateLabel, timeLabel } from "../../utils/hostDate";
import { type HostGame } from "../../types/hostHub";

export function GameCard({
  game,
  onEdit,
  onPlay,
  playing,
  readOnly = false,
  shared = false,
  onManageCohosts,
}: {
  game: HostGame;
  onEdit: (id: string) => void;
  onPlay: (game: HostGame) => void;
  playing: boolean;
  readOnly?: boolean;
  shared?: boolean;
  onManageCohosts?: (game: HostGame) => void;
}) {
  const completed =
    game.status === "completed" ||
    (game.event_date
      ? new Date(`${game.event_date}T23:59:59`).getTime() < Date.now()
      : false);
  const canPlay = game.status === "planned" || game.status === "live";
  const challengeTasks = (game.plan_data?.selectedTasks ?? [])
    .filter((task) => !task.kind || task.kind === "main")
    .map((task) => {
      const artUrl = task.id
        ? game.plan_data?.challengeArtUrls?.[task.id]
        : undefined;
      return {
        ...task,
        artUrl: typeof artUrl === "string" ? artUrl : undefined,
      };
    });

  const statusLabels = {
    planned: "Planned",
    draft: "Draft",
    live: "Live",
    completed: "Completed",
  };
  const ownershipLabel = completed
    ? "Past game"
    : readOnly
      ? "Host game"
      : shared
        ? "Shared game"
        : "Your game";
  const editLabel = completed
    ? "View plan"
    : game.status === "draft"
      ? "Continue setup"
      : "Edit plan";
  const playLabel = playing
    ? "Starting…"
    : game.status === "live"
      ? "Resume live game"
      : "Play game";

  return (
    <article className="game-plan-card">
      <CoverArtwork name={game.name} imageSrc={game.plan_data?.gamePhotoUrl} />
      <div className="game-plan-card__content">
        <div className="game-plan-card__topline">
          <StatusPill tone={game.status}>
            {statusLabels[game.status]}
          </StatusPill>
          <Note variant="workspace-meta" as="span">
            {ownershipLabel}
          </Note>
        </div>
        <h3>{game.name}</h3>
        <ChallengeIcons tasks={challengeTasks} />
        <div className="game-plan-card__meta">
          <span>
            <Icon name="calendar-days" className="icon--size-15" />
            {dateLabel(game.event_date)}
          </span>
          <span>
            <Icon name="clock3" className="icon--size-15" />
            {timeLabel(game.start_time)}
            {game.end_time ? `–${timeLabel(game.end_time)}` : ""}
          </span>
        </div>
        <div className="game-plan-card__meta">
          <span>
            <Icon name="map-pin" className="icon--size-15" />
            {game.venue_name || "Venue not set"}
          </span>
          <span>
            <Icon name="users" className="icon--size-15" />
            About {game.player_count} players
          </span>
        </div>
        <div className="game-plan-card__actions">
          <Button
            type="button"
            variant="comic-secondary"
            fullWidth={false}
            onClick={() => onEdit(game.id)}
            disabled={readOnly}
          >
            <Icon name="edit3" className="icon--size-15" /> {editLabel}
          </Button>
          {canPlay && (
            <Button
              type="button"
              variant="comic-lime"
              fullWidth={false}
              onClick={() => onPlay(game)}
              disabled={playing || readOnly}
            >
              {playing ? (
                <Icon
                  name="loader-circle"
                  className="icon--size-15 icon--spinning"
                />
              ) : (
                <Icon name="play" className="icon--size-15" />
              )}
              {playLabel}
            </Button>
          )}
          {onManageCohosts && !readOnly && (
            <Button
              type="button"
              variant="comic-secondary"
              fullWidth={false}
              onClick={() => onManageCohosts(game)}
            >
              <Icon name="users" className="icon--size-15" /> Co-hosts
            </Button>
          )}
          {readOnly && (
            <span className="game-plan-card__readonly">Read-only</span>
          )}
        </div>
      </div>
    </article>
  );
}
