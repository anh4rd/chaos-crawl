import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../hooks/useGameState";
import { usePlayers } from "../game/hooks/usePlayers";

import {
  getPlayerId,
  clearPlayerId,
} from "../lib/playerSession";
import {
  getMyVote,
  submitVote,
} from "../lib/voteApi";

export default function Vote() {
  const game = useGameState();
  const players = usePlayers();
  const navigate = useNavigate();

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string | null>(null);

  const [hasVoted, setHasVoted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const playerId = getPlayerId();
  useEffect(() => {
  if (game?.voting_open === false) {
    navigate("/game");
  }
}, [game?.voting_open, navigate]);

  useEffect(() => {
    async function checkExistingVote() {
      if (!game?.current_challenge || !playerId) {
        return;
      }

      const { data, error } = await getMyVote(
        playerId,
        game.current_challenge
      );

      if (error) {
        console.error("CHECK VOTE ERROR", error);
        return;
      }

      if (data) {
        setHasVoted(true);
      }
    }

    checkExistingVote();
  }, [game?.current_challenge, playerId]);

  async function handleVote() {
    if (!game) {
      return;
    }

    if (!playerId) {
      alert("Player session not found. Please rejoin the game.");
      navigate("/");
      return;
    }

    if (!selectedPlayerId) {
      alert("Choose someone first.");
      return;
    }

    setSubmitting(true);

    // Check saved player still exists
    const currentPlayer = players.find(
      (player) => player.id === playerId
    );

    if (!currentPlayer) {
      setSubmitting(false);
      clearPlayerId();

      alert(
        "Your saved player session is no longer valid. Please join again."
      );

      navigate("/");
      return;
    }

    const { error } = await submitVote(
      playerId,
      selectedPlayerId,
      game.current_challenge
    );

    setSubmitting(false);

    if (error) {
      console.error("VOTE ERROR FULL:", error);

      if (error.code === "23505") {
        setHasVoted(true);
        return;
      }

      alert(`Vote failed: ${error.message}`);
      return;
    }

    setHasVoted(true);
  }

  if (!game) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-6">
        <p>Loading voting...</p>
      </main>
    );
  }

  if (hasVoted) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
        <Card>
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              Vote Cast!
            </h1>

            <p className="mt-4">
              Your vote for {game.current_challenge} is locked in.
            </p>
          </div>
        </Card>

        <p className ="mt-4 text-sm text-zinc400">
          Waiting for the host to close voting...
        </p>
        
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">
          Vote!
        </h1>

        <p className="mt-2">
          {game.current_challenge}
        </p>

        <p className="mt-2 text-sm">
          Choose the winner.
        </p>
      </header>

      <div className="space-y-3">
        {players.map((player) => {
          const selected =
            selectedPlayerId === player.id;

          return (
            <button
              key={player.id}
              type="button"
              onClick={() =>
                setSelectedPlayerId(player.id)
              }
              className={`
                w-full rounded-2xl border-4 p-4 text-left
                ${
                  selected
                    ? "border-yellow-400 bg-pink-500"
                    : "border-pink-500 bg-black/80"
                }
              `}
            >
              <div className="text-xl font-bold">
                {player.name}
              </div>

              <div className="text-sm">
                {player.team}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        onClick={handleVote}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Cast Vote"}
      </Button>
    </main>
  );
}