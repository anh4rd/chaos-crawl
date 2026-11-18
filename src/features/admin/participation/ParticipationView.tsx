import type { ReactNode } from "react";
import Card from "../../../components/ui/Card";
export default function ParticipationView({
  gameAvailable,
  players,
  playerId,
  onPlayer,
  feedback,
  upload,
  children,
}: {
  gameAvailable: boolean;
  players: readonly { id: string; name: string; team: string | null }[];
  playerId: string;
  onPlayer: (value: string) => void;
  feedback?: ReactNode;
  upload: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {gameAvailable ? (
        <>
          {feedback}
          {upload}
          <Card>
            <h2 className="text-xl font-bold">Play as a Player</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Choose your joined player account to take part as host.
            </p>
            <select
              aria-label="Play as player"
              value={playerId}
              onChange={(event) => onPlayer(event.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
            >
              <option value="">Select player</option>
              {players.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.team ? ` • ${candidate.team}` : ""}
                </option>
              ))}
            </select>
          </Card>
          <Card>
            <h2 className="text-2xl font-bold">Chaos Bingo</h2>
            {!playerId ? (
              <p className="mt-4 text-yellow-400">
                Select a player above to take part.
              </p>
            ) : (
              <div className="mt-4 space-y-4">{children}</div>
            )}
          </Card>
        </>
      ) : (
        <p>Waiting for an active game...</p>
      )}
    </>
  );
}
