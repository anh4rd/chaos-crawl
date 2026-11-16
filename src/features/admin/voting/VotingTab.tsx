import { useVotes } from "../../../game/hooks/useVotes";
import QueryPanel from "../QueryPanel";
import { useNavigate } from "react-router-dom";
import { updateGameState } from "../../../lib/gameApi";
import { tallyPlayerVotes, tallyTeamVotes } from "../../../lib/voteResults";
import { useGameState } from "../../../game/hooks/useGameState";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useTeams } from "../../../game/hooks/useTeams";
import { openVoting, closeVoting, closeResults } from "./votingControls";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

export default function VotingTab() {
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const teamsQuery = useTeams();
  const { data: teams } = teamsQuery;
  const votesQuery = useVotes(game?.current_challenge);
  const { data: votes } = votesQuery;
  const navigate = useNavigate();
  const liveResults =
    game?.voting_target === "team"
      ? tallyTeamVotes(votes, teams)
      : tallyPlayerVotes(votes, players);
  return (
    <QueryPanel
      queries={[gameQuery, playersQuery, teamsQuery, votesQuery]}
      loadingText="Loading voting controls..."
    >
      {game ? (
        <>
          <Card>
            <h2 className="text-xl font-bold">Voting</h2>

            <p className="mt-2 text-sm text-zinc-400">
              Current challenge: {game.current_challenge}
            </p>

            <select
              value={game.voting_target ?? "player"}
              onChange={async (event) => {
                const { error } = await updateGameState({
                  voting_target: event.target.value as "player" | "team",
                });
                if (error)
                  alert(`Could not change voting target: ${error.message}`);
              }}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
            >
              <option value="player">Vote for Player</option>

              <option value="team">Vote for Team</option>
            </select>

            <div className="mt-4 space-y-3">
              {!game.voting_open && !game.show_vote_results && (
                <Button type="button" onClick={openVoting}>
                  Open Voting
                </Button>
              )}

              {game.voting_open && (
                <>
                  <Button
                    type="button"
                    onClick={() => navigate("/vote?from=admin")}
                  >
                    🗳️ Vote Now
                  </Button>

                  <Button type="button" onClick={closeVoting}>
                    Close Voting & Show Results
                  </Button>
                </>
              )}

              {game.show_vote_results && (
                <>
                  <Button
                    type="button"
                    onClick={() => navigate("/vote-results")}
                  >
                    View Results
                  </Button>

                  <Button type="button" onClick={closeResults}>
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
    </QueryPanel>
  );
}
