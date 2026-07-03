import { useNavigate } from "react-router-dom";
import { usePlayers } from "../game/hooks/usePlayers";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Leaderboard() {
  const players = usePlayers();
  const navigate = useNavigate();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-4xl font-bold">Leaderboard</h1>

      <div className="space-y-4">
        {sortedPlayers.map((player, index) => (
          <Card key={player.id}>
            <div className="grid grid-cols-3 justify-between items-center align-left gap-10">
              <div>
                <h2> {index + 1}. </h2>
              </div><div>
                <div className="font-bold">{player.name}</div>  
                <div className="text-zinc-400">{player.team}</div>
              </div>

              <div className="text-xl font-bold">{player.score} pts</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button type="button" onClick={() => navigate("/game")}>Back</Button>
      </div>
    </main>
  );
}
