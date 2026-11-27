import { useLayoutEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import type {
  PlatformPlayerUpdate,
  PlatformSessionPlayers,
} from "../../types/superAdmin";
import PlayerEditor from "./PlayerEditor";

export default function SessionPlayers({
  data,
  busy,
  onSave,
}: {
  data: PlatformSessionPlayers;
  busy: boolean;
  onSave: (
    playerId: string,
    values: PlatformPlayerUpdate,
    expected: PlatformPlayerUpdate,
  ) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const restoreId = useRef<string | null>(null);
  const playerRows = useRef(new Map<string, HTMLLIElement>());
  useLayoutEffect(() => {
    if (!editingId && restoreId.current) {
      playerRows.current
        .get(restoreId.current)
        ?.querySelector("button")
        ?.focus();
      restoreId.current = null;
    }
  }, [editingId]);
  function finishEditing(id: string) {
    restoreId.current = id;
    setEditingId(null);
  }
  const player = data.players.find((item) => item.id === editingId);
  if (player)
    return (
      <PlayerEditor
        key={player.id}
        player={player}
        teams={data.teams}
        busy={busy}
        onCancel={() => finishEditing(player.id)}
        onSave={async (values) => {
          if (
            await onSave(player.id, values, {
              name: player.name,
              avatar_url: player.avatar_url,
              team_id: player.team_id,
              score: player.score,
              phone: player.phone,
            })
          )
            finishEditing(player.id);
        }}
      />
    );
  return (
    <>
      <h3>Players in {data.session_name}</h3>
      {data.players.length ? (
        <ul>
          {data.players.map((item) => (
            <li
              key={item.id}
              ref={(element) => {
                if (element) playerRows.current.set(item.id, element);
                else playerRows.current.delete(item.id);
              }}
            >
              {item.name} · {item.score} pts{" "}
              <Button
                type="button"
                variant="comic-secondary"
                fullWidth={false}
                onClick={() => setEditingId(item.id)}
              >
                Edit {item.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No players have joined this session.</p>
      )}
    </>
  );
}
