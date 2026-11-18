import type { PlatformGame } from "../../types/superAdmin";

export default function GameTable({
  games,
  onInspect,
}: {
  games: PlatformGame[];
  onInspect: (id: string) => void;
}) {
  return (
    <div className="sa-table-wrap">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Host</th>
            <th>Status</th>
            <th>Players</th>
            <th>Sessions</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.game_id}>
              <td>
                <strong>{g.name}</strong>
              </td>
              <td>{g.host_email || "—"}</td>
              <td>
                <span className={`sa-status sa-status--${g.status}`}>
                  {g.status}
                </span>
              </td>
              <td>{g.player_count}</td>
              <td>{g.session_count}</td>
              <td>{g.event_date || "—"}</td>
              <td>
                <button
                  className="sa-view"
                  onClick={() => onInspect(g.game_id)}
                >
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
