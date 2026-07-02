import { useState } from "react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { usePlayers } from "../game/hooks/usePlayers";
import { useGameState } from "../game/hooks/useGameState";
import { usePubs } from "../game/hooks/usePubs";
import { useChallenges } from "../game/hooks/useChallenges";

import { updateGameState } from "../lib/gameApi";
import { addPoints } from "../lib/playerApi";

export default function Admin() {
  const players = usePlayers();
  const game = useGameState();

  const pubs = usePubs();
  const challenges = useChallenges();

  const [selectedPub, setSelectedPub] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  if (!game) return <p>Loading...</p>;

  const currentPubObject = pubs.find(
    (pub) => pub.name === selectedPub
  );

  const availableChallenges = challenges.filter(
    (challenge) =>
      challenge.pub_id === currentPubObject?.id
  );

  async function goLive() {
    const challenge = challenges.find(
      (c) => c.title === selectedChallenge
    );

    await updateGameState({
      current_pub: selectedPub,
      current_challenge: selectedChallenge,
      challenge_description:
        challenge?.description ?? "",
    });

    alert("Live game updated!");
  }

  async function sendBroadcast() {
    await updateGameState({
      broadcast_message: broadcastMessage,
    });

    setBroadcastMessage("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <h1 className="text-4xl font-bold">
        Host Control
      </h1>

      <Card>

  <h2 className="mb-4 text-xl font-bold">
    Change Live Game
  </h2>

  <label className="mb-2 block text-sm text-zinc-400">
    Pub
  </label>

  <select
    className="mb-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
    value={selectedPub}
    onChange={(e) => {
      setSelectedPub(e.target.value);
      setSelectedChallenge("");
    }}
  >
    <option value="">Select a pub...</option>

    {pubs.map((pub) => (
      <option key={pub.id} value={pub.name}>
        {pub.name}
      </option>
    ))}
  </select>

  <label className="mb-2 block text-sm text-zinc-400">
    Challenge
  </label>

  <div className="mb-6 space-y-3">

    {availableChallenges.map((challenge) => (

      <label
        key={challenge.id}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 p-3"
      >

        <input
          type="radio"
          checked={selectedChallenge === challenge.title}
          onChange={() => setSelectedChallenge(challenge.title)}
        />

        <div>

          <div className="font-semibold">
            {challenge.title}
          </div>

          <div className="text-sm text-zinc-400">
            {challenge.description}
          </div>

        </div>

      </label>

    ))}

  </div>

  <Button onClick={goLive}>
    🚀 Go Live
  </Button>

</Card>

      <Card>

        <h2 className="mb-4 text-xl font-bold">
          Players
        </h2>

        <div className="space-y-3">

          {players.map((player) => (

            <Card key={player.id}>

              <div className="flex items-center justify-between">

                <div>

                  <div className="font-bold">
                    {player.name}
                  </div>

                  <div className="text-zinc-400">
                    {player.team}
                  </div>

                  <div className="mt-2">
                    {player.score} pts
                  </div>

                </div>

                <div className="flex gap-2">

                  <Button
                    onClick={() =>
                      addPoints(player.id, 5)
                    }
                  >
                    +5
                  </Button>

                  <Button
                    onClick={() =>
                      addPoints(player.id, 10)
                    }
                  >
                    +10
                  </Button>

                  <Button
                    onClick={() =>
                      addPoints(player.id, 20)
                    }
                  >
                    +20
                  </Button>

                </div>

              </div>

            </Card>

          ))}

        </div>

      </Card>

      <Card>

        <h2 className="mb-4 text-xl font-bold">
          Broadcast Message
        </h2>

        <Input
          placeholder="Message to everyone..."
          value={broadcastMessage}
          onChange={(e) =>
            setBroadcastMessage(e.target.value)
          }
        />

        <div className="mt-4">

          <Button onClick={sendBroadcast}>
            Send
          </Button>

        </div>

      </Card>

    </main>
  );
}