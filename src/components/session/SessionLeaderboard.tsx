import type { ReactNode } from "react";
import SessionRankRow from "./SessionRankRow";
import type { RankedParticipant } from "./types";

export default function SessionLeaderboard({
  title = "Leaderboard",
  variant,
  entries,
  teams = [],
  viewerId,
  viewerTeamId,
  controls,
  tourTarget,
}: {
  title?: string;
  variant?: "compact";
  entries: RankedParticipant[];
  teams?: RankedParticipant[];
  viewerId?: string | null;
  viewerTeamId?: string | null;
  controls?: (entry: RankedParticipant) => ReactNode;
  tourTarget?: string;
}) {
  if (variant === "compact")
    return (
      <div className="session-leaderboard session-leaderboard--compact">
        {entries.map((entry, index) => (
          <SessionRankRow
            key={entry.id}
            entry={entry}
            rank={index + 1}
            variant="compact"
          />
        ))}
      </div>
    );
  return (
    <section className="session-leaderboard" data-tour={tourTarget}>
      <header className="session-leaderboard__heading">
        <h2>{title}</h2>
        <span>{entries.length} players</span>
      </header>
      {entries.length === 0 && (
        <p>No players yet. Scores appear when players join.</p>
      )}
      {entries.map((entry, index) => (
        <SessionRankRow
          key={entry.id}
          entry={entry}
          rank={index + 1}
          selected={entry.id === viewerId}
          action={controls?.(entry)}
        />
      ))}
      {teams.length > 0 && (
        <>
          <h3>Team leaderboard</h3>
          {teams.map((entry, index) => (
            <SessionRankRow
              key={entry.id}
              entry={entry}
              rank={index + 1}
              selected={entry.id === viewerTeamId}
            />
          ))}
          <p>Team scores are the combined points earned by members.</p>
        </>
      )}
    </section>
  );
}
