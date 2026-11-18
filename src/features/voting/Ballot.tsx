import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { clearPlayerId } from "../../lib/playerSession";
import type { Player, Team } from "../../types/database";
import { useBallot } from "./useBallot";

interface BallotProps {
  playerId: string | null;
  challenge: string;
  target: "player" | "team";
  players: Player[];
  teams: Team[];
  fromAdmin: boolean;
}
export default function Ballot({
  playerId,
  challenge,
  target,
  players,
  teams,
  fromAdmin,
}: BallotProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const ballot = useBallot(playerId, challenge, target);
  const navigate = useNavigate();
  const options =
    target === "team"
      ? teams.map((team) => ({ ...team, description: "" }))
      : players.map((player) => ({
          ...player,
          description: player.team ?? "Unassigned",
        }));
  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      {ballot.sessionInvalid ? (
        <Card>
          <h1 className="text-4xl font-bold">Rejoin Needed</h1>
          <p className="mt-4">
            Your saved player session no longer matches a player in the game.
          </p>
          <Button
            type="button"
            onClick={() => {
              clearPlayerId();
              navigate("/legacy/join", { replace: true });
            }}
          >
            Rejoin Game
          </Button>
        </Card>
      ) : ballot.hasVoted ? (
        <Card>
          <h1 className="text-4xl font-bold">Vote Cast!</h1>
          <p className="mt-4">Your vote for {challenge} is locked in.</p>
          <p className="mt-4 text-sm text-zinc-400">
            Waiting for the host to close voting...
          </p>
        </Card>
      ) : (
        <>
          <header className="text-center">
            <h1 className="text-4xl font-bold">Vote!</h1>
            <p className="mt-2">{challenge}</p>
            <p className="mt-2 text-sm">Choose the winning {target}.</p>
          </header>
          {ballot.hasVoted === null ? (
            <p>Checking your vote...</p>
          ) : (
            <>
              <div className="space-y-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selection === option.id}
                    disabled={ballot.submitting}
                    onClick={() => setSelection(option.id)}
                    className={`w-full rounded-2xl border-4 p-4 text-left ${selection === option.id ? "border-yellow-400 bg-pink-500" : "border-pink-500 bg-black/80"}`}
                  >
                    <div className="text-xl font-bold">{option.name}</div>
                    {option.description && (
                      <div className="text-sm">{option.description}</div>
                    )}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => {
                  void ballot.cast(selection);
                }}
                disabled={ballot.submitting}
              >
                {ballot.submitting ? "Submitting..." : "Cast Vote"}
              </Button>
            </>
          )}
        </>
      )}
      {ballot.error && (
        <div>
          <p role="alert">{ballot.error.message}</p>
          {ballot.hasVoted === null && (
            <Button
              type="button"
              onClick={() => {
                void ballot.reload();
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}
      {fromAdmin && (
        <Button type="button" onClick={() => navigate("/admin")}>
          Back to Host Control
        </Button>
      )}
    </main>
  );
}
