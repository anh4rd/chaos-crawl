import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useGameState } from "../game/hooks/useGameState";

export default function Vote() {
  const game = useGameState();
  const navigate = useNavigate();

  useEffect(() => {
    if (game && !game.voting_open) {
      navigate("/game");
    }
  }, [game, navigate]);

  if (!game) {
    return <p>Loading voting...</p>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">Vote!</h1>

        <p className="mt-2 text-zinc-300">{game.current_challenge}</p>
      </header>

      <Card>
        <h2 className="mb-4 text-xl font-bold">Choose the winner</h2>

        <p className="text-zinc-300">Voting entries will appear here.</p>

        <div className="mt-4">
          <Button type="button">Vote</Button>
        </div>
      </Card>
    </main>
  );
}
