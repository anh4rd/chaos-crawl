import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";

import { useGameState } from "../game/hooks/useGameState";

import { usePlayers } from "../game/hooks/usePlayers";

import { useTeams } from "../game/hooks/useTeams";
import { useVotes } from "../game/hooks/useVotes";
import { tallyPlayerVotes, tallyTeamVotes } from "../lib/voteResults";
import DataError from "../components/ui/DataError";

export default function VoteResults() {
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const teamsQuery = useTeams();
  const { data: teams } = teamsQuery;
  const votesQuery = useVotes(game?.current_challenge);
  const { data: votes } = votesQuery;
  const navigate = useNavigate();

  // Host closed results:
  // send everyone back to game
  useEffect(() => {
    if (!game) {
      return;
    }

    if (game.show_vote_results !== true) {
      navigate("/game", {
        replace: true,
      });
    }
  }, [game, navigate]);

  const failed = [gameQuery, playersQuery, teamsQuery, votesQuery].find(
    (query) => query.error,
  );
  if (failed) return <DataError error={failed.error!} retry={failed.reload} />;
  if (
    !game ||
    [playersQuery, teamsQuery, votesQuery].some((query) => query.loading)
  ) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>Loading results...</p>
      </main>
    );
  }

  const results =
    game.voting_target === "team"
      ? tallyTeamVotes(votes, teams)
      : tallyPlayerVotes(votes, players);

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <Card>
        <h1 className="text-4xl font-bold">Voting Results</h1>

        <p className="mt-3">{game.current_challenge}</p>
      </Card>

      <ol className="space-y-3">
        {results.map((result, index) => (
          <li key={result.id}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <span className="mr-3">{index === 0 ? "👑" : ""}</span>

                  <strong>{result.name}</strong>
                </div>

                <div className="text-2xl font-bold">{result.votes}</div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </main>
  );
}
