import Icon from "../../components/ui/Icon";

import { challengeIcon } from "../../lib/challengeVisuals";
import { dateLabel, timeLabel } from "../../utils/hostDate";
import { type HostGame } from "./types";

export function GameCard({
  game,
  onEdit,
  onPlay,
  playing,
  readOnly = false,
}: {
  game: HostGame;
  onEdit: (id: string) => void;
  onPlay: (game: HostGame) => void;
  playing: boolean;
  readOnly?: boolean;
}) {
  const completed =
    game.status === "completed" ||
    (game.event_date
      ? new Date(`${game.event_date}T23:59:59`).getTime() < Date.now()
      : false);
  const canPlay = game.status === "planned" || game.status === "live";
  const challengeTasks = (game.plan_data?.selectedTasks ?? []).filter(
    (task) => !task.kind || task.kind === "main",
  );

  return (
    <article className="host-game-card">
      <div className="host-game-card-art">
        {game.plan_data?.gamePhotoUrl ? (
          <img src={game.plan_data.gamePhotoUrl} alt={`${game.name} cover`} />
        ) : (
          <>
            <Icon name="sparkles" className="icon--size-27" />
            <span>{game.name.slice(0, 1).toUpperCase() || "C"}</span>
          </>
        )}
      </div>
      <div className="host-game-card-content">
        <div className="host-card-topline">
          <span className={`host-status host-status--${game.status}`}>
            {game.status === "planned"
              ? "Planned"
              : game.status === "draft"
                ? "Draft"
                : game.status === "live"
                  ? "Live"
                  : "Completed"}
          </span>
          <span className="host-muted host-small">
            {completed ? "Past game" : readOnly ? "Host game" : "Your game"}
          </span>
        </div>
        <h3>{game.name}</h3>
        {challengeTasks.length > 0 && (
          <div
            className="host-game-challenge-icons"
            aria-label="Challenges in this game"
          >
            {challengeTasks.slice(0, 4).map((task, index) => (
              <span
                key={task.id ?? `${task.title}-${index}`}
                title={task.title}
              >
                {challengeIcon(task.title, task.description)}
              </span>
            ))}
          </div>
        )}
        <div className="host-game-meta">
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
        <div className="host-game-meta">
          <span>
            <Icon name="map-pin" className="icon--size-15" />
            {game.venue_name || "Venue not set"}
          </span>
          <span>
            <Icon name="users" className="icon--size-15" />
            About {game.player_count} players
          </span>
        </div>
        <div className="host-game-actions">
          <button
            type="button"
            className="host-button host-button--secondary"
            onClick={() => onEdit(game.id)}
            disabled={readOnly}
          >
            <Icon name="edit3" className="icon--size-15" />{" "}
            {completed
              ? "View plan"
              : game.status === "draft"
                ? "Continue setup"
                : "Edit plan"}
          </button>
          {canPlay && (
            <button
              type="button"
              className="host-button host-button--lime"
              onClick={() => onPlay(game)}
              disabled={playing || readOnly}
            >
              {playing ? (
                <Icon
                  name="loader-circle"
                  className="icon--size-15 host-button-spinner"
                />
              ) : (
                <Icon name="play" className="icon--size-15" />
              )}
              {playing
                ? "Starting…"
                : game.status === "live"
                  ? "Resume live game"
                  : "Play game"}
            </button>
          )}
          {readOnly && (
            <span className="host-preview-readonly-label">Read-only</span>
          )}
        </div>
      </div>
    </article>
  );
}
