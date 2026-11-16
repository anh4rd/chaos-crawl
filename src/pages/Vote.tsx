import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGameState } from "../game/hooks/useGameState";
import { usePlayers } from "../game/hooks/usePlayers";
import { useTeams } from "../game/hooks/useTeams";
import { usePlayerSession } from "../game/hooks/usePlayerSession";
import DataError from "../components/ui/DataError";
import Ballot from "../features/voting/Ballot";

export default function Vote() {
  const gameQuery = useGameState();
  const { data: game } = gameQuery;
  const players = usePlayers();
  const teams = useTeams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromAdmin = params.get("from") === "admin";
  const session = usePlayerSession();
  const playerId = session.playerId;

  useEffect(() => {
    if (!game || session.error) return;
    if (game.show_vote_results) navigate("/vote-results", { replace: true });
    else if (!game.voting_open)
      navigate(fromAdmin ? "/admin" : "/game", { replace: true });
  }, [game, fromAdmin, navigate, session.error]);

  if (session.error)
    return <DataError error={session.error} retry={session.reload} />;
  const failed = [gameQuery, players, teams].find((query) => query.error);
  if (failed) return <DataError error={failed.error!} retry={failed.reload} />;
  if (!game || players.loading || teams.loading)
    return (
      <main className="p-6">
        <p>Loading voting...</p>
      </main>
    );
  return (
    <Ballot
      key={JSON.stringify([
        playerId,
        game.current_challenge,
        game.voting_target,
      ])}
      playerId={playerId}
      challenge={game.current_challenge}
      target={game.voting_target}
      players={players.data}
      teams={teams.data}
      fromAdmin={fromAdmin}
    />
  );
}
