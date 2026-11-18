import PlayerRow from "./PlayerRow";
import Icon from "../../components/ui/Icon";
import type { PlayerRosterModel } from "./types";
export default function PlayerRoster({
  players,
  teams,
  draft,
  creating,
  canCreate,
  onDraftChange,
  onCreate,
}: PlayerRosterModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="users" className="icon--size-14" /> PLAYER ROSTER
        </span>
        <span className="host-v2__muted">{players.length} players</span>
      </div>
      <div className="host-v2__add-row">
        <input
          aria-label="New player name"
          placeholder="Add a player"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <button
          type="button"
          className="host-v2__icon-button"
          aria-label="Add player"
          disabled={!canCreate}
          onClick={onCreate}
        >
          {creating ? "…" : <Icon name="plus" className="icon--size-18" />}
        </button>
      </div>
      {players.length ? (
        <div className="host-v2__player-list">
          {players.map((player) => (
            <PlayerRow key={player.id} player={player} teams={teams} />
          ))}
        </div>
      ) : (
        <p className="host-v2__empty-copy">
          Players will appear here when they join using your game code.
        </p>
      )}
    </section>
  );
}
