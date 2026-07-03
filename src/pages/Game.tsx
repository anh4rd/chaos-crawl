import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useGameState } from "../hooks/useGameState";
import { clearPlayerId } from "../lib/playerSession";
import { useNavigate } from "react-router-dom";
import useSideChallenges from "../hooks/useSideChallenges";

export default function Game() {
  const navigate = useNavigate();
  const game = useGameState();
  if (!game) return <p>Waiting for bday kween...</p>;
  const sideChallenges = useSideChallenges();
  const currentPub = game.current_pub;
  const currentChallenge = game.current_challenge;
  const challengeDescription = game.challenge_description;

  return (
    <main className="mx-auto min-h-screen max-w-md p-6 space-y-6">

      <header>
          <img
            src={`${import.meta.env.BASE_URL}Title.png`}
            alt="Anna's Chaos Crawl"
            className="mx-auto aspect-ratio:auto mb-4 w-fill"
          />

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

  <h2 className="mb-4 text-2xl font-bold">

    CHAOS BINGO

  </h2>

  <div className="grid grid-cols-2 gap-3">

    {sideChallenges.map((challenge) => (

      <div
        key={challenge.id}
        className="rounded-2xl p-3 border-2 border-pink-500 bg-black/70"
      >

        <div className="text-lg font-bold">

          {challenge.title}

        </div>

        <p className="mt-2 text-sm text-zinc-300">

          {challenge.description}

        </p>

        <div className="mt-3 font-bold text-yellow-400">

          +{challenge.points}

        </div>

      </div>

    ))}

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
}
