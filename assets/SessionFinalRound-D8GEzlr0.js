var e=`import SessionLeaderboard from "./SessionLeaderboard";
import SessionState from "./SessionState";
import SessionVotingCard from "./SessionVotingCard";
import type { RankedParticipant, VotingEntry } from "./types";

export default function SessionFinalRound({
  title,
  description,
  points,
  galleryOpen,
  votingOpen,
  completed,
  entries,
  busy = false,
  onVote,
  leaderboard = [],
}: {
  title?: string | null;
  description?: string | null;
  points: number;
  galleryOpen: boolean;
  votingOpen: boolean;
  completed: boolean;
  entries: VotingEntry[];
  busy?: boolean;
  onVote?: (id: string) => void;
  leaderboard?: RankedParticipant[];
}) {
  return (
    <section className="session-final-round" data-tour="player-final">
      <h2 className="session-final-round__heading">Side challenge voting</h2>
      {!galleryOpen ? (
        <SessionState title="The final vote isn't open yet">
          The host will open the final round when it is time to celebrate the
          submissions.
        </SessionState>
      ) : (
        <>
          <header className="session-final-round__challenge">
            <strong>SIDE CHALLENGE · +{points} BONUS POINTS</strong>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </header>
          <output>
            {votingOpen
              ? "Voting is open. Results stay hidden until voting closes."
              : completed
                ? "Voting is closed. Tied top submissions receive the challenge bonus."
                : "Waiting for voting to start."}
          </output>
          {entries.length === 0 && (
            <SessionState title="No entries for this challenge" />
          )}
          <div className="session-final-round__entries">
            {entries.map((entry) => (
              <SessionVotingCard
                key={entry.id}
                entry={entry}
                open={votingOpen}
                busy={busy}
                onVote={onVote ? () => onVote(entry.id) : undefined}
              />
            ))}
          </div>
          {completed && !votingOpen && (
            <SessionLeaderboard
              title="Updated leaderboard"
              entries={leaderboard}
            />
          )}
        </>
      )}
    </section>
  );
}
`;export{e as default};