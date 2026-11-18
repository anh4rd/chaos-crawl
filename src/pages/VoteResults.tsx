import PageFrame from "../components/ui/PageFrame";
import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import VoteResultsView from "../features/voting/VoteResultsView";

import { useGameState } from "../game/hooks/useGameState";

import { usePlayers } from "../game/hooks/usePlayers";

import { useTeams } from "../game/hooks/useTeams";
import { useVotes } from "../game/hooks/useVotes";
import { tallyPlayerVotes, tallyTeamVotes } from "../lib/voteResults";
import DataError from "../components/ui/DataError";
import LoadingScreen from "../components/ui/LoadingScreen";

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

  useEffect(() => {
    if (!game) {
      return;
    }

    if (game.voting_open) {
      navigate("/vote", { replace: true });
    } else if (game.show_vote_results !== true) {
      navigate("/game", {
        replace: true,
      });
    }
  }, [game, navigate]);

  if (game && (game.voting_open || game.show_vote_results !== true))
    return <LoadingScreen>Waiting for published results…</LoadingScreen>;

  const failed = [gameQuery, playersQuery, teamsQuery, votesQuery].find(
    (query) => query.error,
  );
  if (failed?.error)
    return <DataError error={failed.error} retry={failed.reload} />;
  if (
    !game ||
    [playersQuery, teamsQuery, votesQuery].some((query) => query.loading)
  ) {
    return (
      <PageFrame variant="content">
        <p>Loading results...</p>
      </PageFrame>
    );
  }

  const results =
    game.voting_target === "team"
      ? tallyTeamVotes(votes, teams)
      : tallyPlayerVotes(votes, players);

  return (
    <VoteResultsView challenge={game.current_challenge} results={results} />
  );
}
