import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getGame } from "../lib/gameApi";

export default function Game() {
  const [game, setGame] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getGame().then((result) => {
      if (result.data) {
        setGame(result.data as Record<string, unknown>);
      }
    });
  }, []);

  const currentPub = game?.current_pub as string | undefined ?? "Unknown pub";
  const currentChallenge = game?.current_challenge as string | undefined ?? "No mission loaded.";
  const challengeDescription = game?.challenge_description as string | undefined ?? "Check back soon.";
  const sideMissions = Array.isArray(game?.side_missions)
    ? (game.side_missions as string[])
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

      <Button type="button" onClick={() => window.location.href = "/leaderboard"}>
        Leaderboard
      </Button>

    </main>
  );
}