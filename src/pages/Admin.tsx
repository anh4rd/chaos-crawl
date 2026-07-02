import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { usePlayers } from "../game/hooks/usePlayers";
import { updateGameState } from "../lib/gameApi";
import { useGameState } from "../game/hooks/useGameState";

export default function Admin() {
  const players = usePlayers();

  async function nextPub() {
    await updateGameState({
      current_pub: "The Dog & Bell"
    });
  }

  async function revealChallenge() {
    await updateGameState({
      current_challenge: "Hide the Pineapple",
      challenge_description: "Hide the pineapple somewhere on your person."
    });
  }

  const game = useGameState ();
  if (!game) return <p>Loading...</p>;

  const currentChallenge = "Become Nan";

  const challengeDescription =
    "Take the funniest photo pretending to be Little Nan.";

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <h1 className="text-4xl font-bold">
        Host Control
      </h1>

      <Card>

        <h2 className="mb-2 text-xl font-bold">
          Current Pub
        </h2>

        <p>{game.currentPub}</p>

      </Card>

      <Card>

        <h2 className="mb-2 text-xl font-bold">
          Current Challenge
        </h2>

        <h3 className="font-semibold">
          {currentChallenge}
        </h3>

        <p className="mt-2 text-zinc-400">
          {challengeDescription}
        </p>

      </Card>

      <Card>

        <h2 className="mb-4 text-xl font-bold">
          Players Joined
        </h2>

        <div className="space-y-3">

          {players.length === 0 && (
            <p className="text-zinc-500">
              Nobody has joined yet.
            </p>
          )}

          {players.map((player: { id: string; name: string; team: string }) => (
            <div
              key={player.id}
              className="flex justify-between rounded-xl bg-zinc-800 p-3"
            >
              <span>{player.name}</span>

              <span>{player.team}</span>
            </div>
          ))}

        </div>

      </Card>

      <Card>

        <div className="space-y-3">

          <Button onClick={nextPub}
          >
            Next Pub
          </Button>

          <Button onClick={revealChallenge}>
            Reveal Challenge
          </Button>

          <Button>
            Broadcast Message
          </Button>

        </div>

      </Card>

    </main>
  );
}