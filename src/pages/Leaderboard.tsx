import { usePlayers } from "../game/hooks/usePlayers";
import Card from "../components/ui/Card";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const navigate = useNavigate();
  const players = usePlayers();

  const sortedPlayers = [...players].sort(
    (a, b) => b.score - a.score
  );

  return (
    <main className="mx-auto max-w-md p-6">

      <h1 className="mb-6 text-4xl font-bold">
        Leaderboard
      </h1>

      <div className="space-y-4">

        {sortedPlayers.map((player, index) => (

          <Card key={player.id}>

            <div className="flex justify-between items-center">

              <div>

                <div className="font-bold">

                  #{index + 1} {player.name}

                </div>

                <div className="text-zinc-400">

                  {player.team}

                </div>

              </div>

              <div className="text-xl font-bold">

                {player.score} pts

              </div>

            </div>

          </Card>

        ))}

      </div>

    </main>
  );
    navigate("/leaderboard");

}