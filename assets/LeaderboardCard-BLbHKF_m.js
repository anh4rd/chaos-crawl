var e=`import { useId } from "react";
import Card from "../../components/ui/Card";
import { type LeaderboardEntry } from "../../lib/leaderboard";
import { ScoreHistoryRow } from "./ScoreHistoryRow";

export function LeaderboardCard({
  entry,
  index,
  expanded,
  onToggle,
}: {
  entry: LeaderboardEntry;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const historyId = useId();
  return (
    <Card className="leaderboard-card">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? historyId : undefined}
        onClick={onToggle}
        className="leaderboard-card__toggle"
      >
        <div className="leaderboard-card__summary">
          <div className="leaderboard-card__identity">
            <span className="leaderboard-card__rank">
              {index === 0
                ? "👑"
                : index === 1
                  ? "🥈"
                  : index === 2
                    ? "🥉"
                    : \`\${index + 1}.\`}
            </span>

            <div>
              <h2 className="leaderboard-card__name">{entry.name}</h2>

              <p className="leaderboard-card__hint">
                {entry.events.length} award
                {entry.events.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="leaderboard-card__score">
            <div className="leaderboard-card__total">{entry.score}</div>

            <div className="leaderboard-card__unit">points</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div id={historyId} className="leaderboard-card__history">
          {entry.events.length === 0 ? (
            <p className="leaderboard-card__hint">No points awarded yet.</p>
          ) : (
            entry.events.map((event) => (
              <ScoreHistoryRow key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}
`;export{e as default};