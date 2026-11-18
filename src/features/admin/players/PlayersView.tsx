import type { ReactNode } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
export interface ManagedPlayer {
  id: string;
  name: string;
  team: string | null;
  score: number;
}
export default function PlayersView({
  players,
  savingPlayerId,
  onChangePoints,
  onRemove,
  renderNameEditor,
}: {
  players: readonly ManagedPlayer[];
  savingPlayerId: string | null;
  onChangePoints: (id: string, amount: number) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
  renderNameEditor: (player: ManagedPlayer) => ReactNode;
}) {
  return (
    <>
      <Card>
        <h2 className="text-2xl font-bold">Players</h2>

        <div className="mt-4 space-y-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="rounded-xl border border-zinc-700 bg-black/50 p-4"
            >
              {renderNameEditor(player)}

              <p className="mt-2 text-sm">
                Team: {player.team ?? "Unassigned"}
              </p>

              <p className="mt-1 font-bold">Score: {player.score}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, 5)}
                >
                  +5
                </Button>

                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, 10)}
                >
                  +10
                </Button>

                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, -5)}
                >
                  -5
                </Button>
              </div>

              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => onRemove(player.id, player.name)}
                >
                  Delete Player
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
