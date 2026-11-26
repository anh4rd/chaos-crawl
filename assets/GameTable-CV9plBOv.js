var e=`import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import StatusPill from "../../components/ui/StatusPill";
import type { PlatformGame } from "../../types/superAdmin";

export default function GameTable({
  games,
  onInspect,
}: {
  games: PlatformGame[];
  onInspect: (id: string) => void;
}) {
  return (
    <DataTable>
      <thead>
        <tr>
          <th scope="col">Game</th>
          <th scope="col">Host</th>
          <th scope="col">Status</th>
          <th scope="col">Players</th>
          <th scope="col">Sessions</th>
          <th scope="col">Date</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => {
          const tone =
            game.status === "live" || game.status === "completed"
              ? game.status
              : "default";
          return (
            <tr key={game.game_id}>
              <td>
                <strong>{game.name}</strong>
              </td>
              <td>{game.host_email || "—"}</td>
              <td>
                <StatusPill variant="table" tone={tone}>
                  {game.status}
                </StatusPill>
              </td>
              <td>{game.player_count}</td>
              <td>{game.session_count}</td>
              <td>{game.event_date || "—"}</td>
              <td>
                <Button
                  variant="table-action"
                  fullWidth={false}
                  onClick={() => onInspect(game.game_id)}
                >
                  Inspect
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
`;export{e as default};