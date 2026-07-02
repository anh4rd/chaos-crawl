import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { game } from "../game/data/game";

export default function Game() {
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

          <h2 className="text-3xl font-bold">
            {game.currentPub}
          </h2>

        </div>

      </Card>

      <Card>

        <div className="space-y-4">

          <div className="text-sm text-zinc-400">
            ⭐ Main Mission
          </div>

          <h2 className="text-2xl font-bold">
            {game.currentMission.title}
          </h2>

          <p>
            {game.currentMission.description}
          </p>

          <Button>

            Upload Photo

          </Button>

        </div>

      </Card>

      <Card>

        <div className="space-y-3">

          <div className="font-semibold">
            game.sideMissions.map(...)
          </div>


            Side Missions
        </div>

      </Card>

      <Button type="button" onClick={() => window.location.href = "/leaderboard"}>
        Leaderboard
      </Button>

    </main>
  );
}