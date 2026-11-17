import QueryPanel from "../QueryPanel";
import { buildLeaderboards } from "../../../lib/leaderboard";
import { useState } from "react";
import { useScoreEvents } from "../../../game/hooks/useScoreEvents";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { addPoints, removePoints, deletePlayer } from "../../../lib/playerApi";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PlayerNameEditor from "./PlayerNameEditor";

export default function PlayersTab() {
  const playersQuery = usePlayers();
  const { data: players, reload } = playersQuery;
  const scoresQuery = useScoreEvents();
  const { data: scoreEvents, reload: reloadScores } = scoresQuery;
  const scores = new Map(
    buildLeaderboards(players, scoreEvents).players.map((entry) => [
      entry.id,
      entry.score,
    ]),
  );
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  async function changePoints(playerId: string, amount: number) {
    setSavingPlayerId(playerId);
    try {
      const { error } = await (amount < 0
        ? removePoints(playerId, -amount)
        : addPoints(playerId, amount));
      if (error) {
        alert(`Could not update score: ${error.message}`);
        return;
      }
      await reloadScores();
    } catch (cause) {
      alert(
        `Could not update score: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      setSavingPlayerId(null);
    }
  }
  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete ${name}?`)) return;
    const { error } = await deletePlayer(id);
    if (error) {
      alert(`Could not delete player: ${error.message}`);
      return;
    }
    await reload();
  }
  return (
    <QueryPanel
      queries={[playersQuery, scoresQuery]}
      loadingText="Loading players and scores..."
    >
      <>
        <Card>
          <h2 className="text-2xl font-bold">Players</h2>

          <div className="mt-4 space-y-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-xl border border-zinc-700 bg-black/50 p-4"
              >
                <PlayerNameEditor
                  playerId={player.id}
                  name={player.name}
                  reload={reload}
                />

                <p className="mt-2 text-sm">
                  Team: {player.team ?? "Unassigned"}
                </p>

                <p className="mt-1 font-bold">
                  Score: {scores.get(player.id) ?? 0}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    disabled={savingPlayerId !== null}
                    onClick={() => changePoints(player.id, 5)}
                  >
                    +5
                  </Button>

                  <Button
                    type="button"
                    disabled={savingPlayerId !== null}
                    onClick={() => changePoints(player.id, 10)}
                  >
                    +10
                  </Button>

                  <Button
                    type="button"
                    disabled={savingPlayerId !== null}
                    onClick={() => changePoints(player.id, -5)}
                  >
                    -5
                  </Button>
                </div>

                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={() => remove(player.id, player.name)}
                  >
                    Delete Player
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    </QueryPanel>
  );
}
