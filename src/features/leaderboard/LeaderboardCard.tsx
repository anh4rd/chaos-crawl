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
  return (
    <Card>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {index === 0
                ? "👑"
                : index === 1
                  ? "🥈"
                  : index === 2
                    ? "🥉"
                    : `${index + 1}.`}
            </span>

            <div>
              <h2 className="text-xl font-bold">{entry.name}</h2>

              <p className="text-sm opacity-70">
                {entry.events.length} award
                {entry.events.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">{entry.score}</div>

            <div className="text-xs opacity-70">points</div>
          </div>
        </div>
      </button>

      {/* SCORE HISTORY */}

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
          {entry.events.length === 0 ? (
            <p className="text-sm opacity-70">No points awarded yet.</p>
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
