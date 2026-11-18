import Icon from "../../components/ui/Icon";
import type { PlayerRowModel } from "./types";
export default function PlayerRow({
  player,
  teams,
}: {
  player: PlayerRowModel;
  teams: string[];
}) {
  return (
    <article className="host-v2__player-row">
      <div className="host-v2__avatar" aria-hidden="true">
        {player.initial}
      </div>
      <div className="host-v2__grow">
        <input
          aria-label={`Rename ${player.name}`}
          className="host-v2__player-name"
          defaultValue={player.name}
          key={`${player.id}-${player.name}`}
          onBlur={(event) => void player.onRename(event.target.value)}
        />
        <label className="host-v2__team-select">
          <span>Team</span>
          <select
            value={player.team}
            onChange={(event) => void player.onAssignTeam(event.target.value)}
          >
            <option value="">Unassigned</option>
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="host-v2__remove-button"
        aria-label={`Remove ${player.name}`}
        onClick={player.onRemove}
      >
        <Icon name="x" className="icon--size-16" />
      </button>
    </article>
  );
}
