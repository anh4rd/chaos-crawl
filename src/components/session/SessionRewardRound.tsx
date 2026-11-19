import SessionCandidate from "./SessionCandidate";
import SessionLeaderboard from "./SessionLeaderboard";
import type { RewardPresentation } from "./types";

export default function SessionRewardRound({
  round,
  busy = false,
  viewerId,
  onVote,
}: {
  round: RewardPresentation;
  busy?: boolean;
  viewerId?: string | null;
  onVote?: (id: string) => void;
}) {
  return (
    <section className="session-reward-round" aria-live="polite">
      <strong className="session-reward-round__kicker">REWARD POINTS</strong>
      <h2>
        {round.completed
          ? round.winners.length
            ? "Points awarded!"
            : "No votes this time"
          : round.method === "voting"
            ? "Vote for the winner"
            : round.method === "host_awards"
              ? "Judgement is underway…"
              : "Audience cheers!"}
      </h2>
      <p>
        {round.title} · {round.points} points at stake
      </p>
      {!round.completed && round.method === "voting" && (
        <>
          <p>
            {round.votesCast} votes cast so far. Results stay hidden until
            voting closes.
          </p>
          {round.candidates.map((candidate) => (
            <SessionCandidate
              key={candidate.id}
              name={candidate.name}
              detail={candidate.detail}
              selected={candidate.id === round.selectedId}
              busy={busy}
              onSelect={onVote ? () => onVote(candidate.id) : undefined}
            />
          ))}
        </>
      )}
      {!round.completed && round.method !== "voting" && (
        <p>
          {round.method === "host_awards"
            ? "The host is choosing who deserves the points."
            : "Cheer for your favourite. The host will record the winners."}
        </p>
      )}
      {round.completed && (
        <>
          {round.winners.map((winner) => (
            <p className="session-reward-round__winner" key={winner.id}>
              <strong>{winner.name}</strong> +{winner.points} pts
              {round.method === "voting" ? ` · ${winner.votes} votes` : ""}
            </p>
          ))}
          {round.winners.length === 0 && (
            <p>No eligible votes were cast; no points were awarded.</p>
          )}
          <SessionLeaderboard
            title="Updated leaderboard"
            entries={round.leaderboard}
            viewerId={viewerId}
          />
        </>
      )}
    </section>
  );
}
