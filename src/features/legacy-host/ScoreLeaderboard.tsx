import Icon from "../../components/ui/Icon";
import type { ScoreLeaderboardModel } from "./types";

export default function ScoreLeaderboard({
  target,
  loading,
  entries,
  onTargetChange,
}: ScoreLeaderboardModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="trophy" className="icon--size-14" /> LEADERBOARD
        </span>
        <span className="host-v2__muted">
          {loading ? "Updating…" : "Live scores"}
        </span>
      </div>
      <div
        className="host-v2__segmented"
        role="group"
        aria-label="Leaderboard view"
      >
        <button
          type="button"
          className={target === "player" ? "is-selected" : ""}
          onClick={() => onTargetChange("player")}
        >
          Player scores
        </button>
        <button
          type="button"
          className={target === "team" ? "is-selected" : ""}
          onClick={() => onTargetChange("team")}
        >
          Team scores
        </button>
      </div>
      {entries.length ? (
        <div className="host-v2__leaderboard">
          {entries.map((entry, index) => (
            <div className="host-v2__leader-row" key={entry.id}>
              <span
                className={`host-v2__rank ${index === 0 ? "is-first" : ""}`}
              >
                {index + 1}
              </span>
              <span className="host-v2__leader-name">{entry.name}</span>
              <strong>
                {entry.score} <small>pts</small>
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="host-v2__empty-copy">
          Scores will appear here when points are awarded.
        </p>
      )}
    </section>
  );
}
