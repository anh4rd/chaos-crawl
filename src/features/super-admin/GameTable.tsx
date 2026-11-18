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
