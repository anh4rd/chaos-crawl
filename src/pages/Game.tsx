import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useGameState } from "../hooks/useGameState";
import { clearPlayerId } from "../lib/playerSession";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const navigate = useNavigate();
  const game = useGameState();
  if (!game) return <p>Waiting for bday kween...</p>;

  const currentPub = game.current_pub;
  const currentChallenge = game.current_challenge;
  const challengeDescription =
    game.challenge_description;
  const sideMissions = Array.isArray((game as any).side_missions)
    ? ((game as any).side_missions as string[])
    : Array.isArray((game as any).sideChallenges)
    ? ((game as any).sideChallenges as string[])
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-6">

      <header>
        <h1 className="text-4xl font-bold">
          Anna's Chaos Crawl
        </h1>
        <p className="text-zinc-400">
          Current Mission
        </p>
      </header>

      <Card>

        <div className="space-y-2">

          <div className="text-sm text-zinc-400">
            📍 Current Pub
          </div>

          <h2 className="text-3xl font-bold">{currentPub}</h2>

        </div>

      </Card>

      <Card>

        <div className="space-y-4">

          <div className="text-sm text-zinc-400">
            ⭐ Main Mission
          </div>

          <h2 className="text-2xl font-bold">{currentChallenge}</h2>

          <p>{challengeDescription}</p>

          <Button>

            Upload Photo

          </Button>

        </div>

      </Card>

      <Card>

        <div className="space-y-3">

          <div className="font-semibold">Side Missions</div>

          <div className="space-y-2">
            {sideMissions.length > 0 ? (
              sideMissions.map((mission, index) => (
                <p key={index} className="text-sm text-zinc-400">
                  • {mission}
                </p>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No side missions available.</p>
            )}
          </div>

        </div>

      </Card>

      <Button type="button" onClick={() => navigate("/leaderboard")}>
        Leaderboard
      </Button>

      <Button
  onClick={() => {
    clearPlayerId();
    navigate("/leaderboard");
  }}
>
  Leave Game
</Button>

    </main>
  );
    navigate("/game");

}