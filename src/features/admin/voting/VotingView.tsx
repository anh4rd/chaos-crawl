import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
export default function VotingView({
  game,
  liveResults,
  onTarget,
  onOpenVoting,
  onCloseVoting,
  onCloseResults,
  onNavigate,
}: {
  game: {
    current_challenge: string;
    voting_target: "player" | "team" | null;
    voting_open: boolean;
    show_vote_results: boolean;
  } | null;
  liveResults: readonly { id: string; name: string; votes: number }[];
  onTarget: (value: string) => Promise<void>;
  onOpenVoting: () => Promise<void>;
  onCloseVoting: () => Promise<void>;
  onCloseResults: () => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  return (
    <>
      {game ? (
        <>
          <Card>
            <h2 className="text-xl font-bold">Voting</h2>

            <p className="mt-2 text-sm text-zinc-400">
              Current challenge: {game.current_challenge}
            </p>

            <select
              value={game.voting_target ?? "player"}
              onChange={(event) => onTarget(event.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
            >
              <option value="player">Vote for Player</option>

              <option value="team">Vote for Team</option>
            </select>

            <div className="mt-4 space-y-3">
              {!game.voting_open && !game.show_vote_results && (
                <Button type="button" onClick={onOpenVoting}>
                  Open Voting
                </Button>
              )}

              {game.voting_open && (
                <>
                  <Button
                    type="button"
                    onClick={() => onNavigate("/vote?from=admin")}
                  >
                    🗳️ Vote Now
                  </Button>

                  <Button type="button" onClick={onCloseVoting}>
                    Close Voting & Show Results
                  </Button>
                </>
              )}

              {game.show_vote_results && (
                <>
                  <Button
                    type="button"
                    onClick={() => onNavigate("/vote-results")}
                  >
                    View Results
                  </Button>

                  <Button type="button" onClick={onCloseResults}>
                    Close Results & Return Everyone
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Live Voting Results</h2>

            <p className="mt-2">{game.current_challenge}</p>

            {liveResults.length === 0 ? (
              <p className="mt-4 text-zinc-400">No votes yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {liveResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-xl bg-black/50 p-3"
                  >
                    <strong>
                      {index === 0 ? "👑 " : ""}

                      {result.name}
                    </strong>

                    <span className="text-xl font-bold">{result.votes}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <p>No live game is available yet.</p>
      )}
    </>
  );
}
