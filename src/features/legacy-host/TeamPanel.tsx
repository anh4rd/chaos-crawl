import Icon from "../../components/ui/Icon";
import type { TeamPanelModel } from "./types";

export default function TeamPanel({
  teamCount,
  names,
  loading: teamsLoading,
  draft,
  creating,
  canCreate,
  onDraftChange,
  onCreate,
}: TeamPanelModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="users" className="icon--size-14" /> TEAMS
        </span>
        <span className="host-v2__muted">{teamCount} teams</span>
      </div>
      <div className="host-v2__add-row">
        <input
          aria-label="New team name"
          placeholder="New team name"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <button
          type="button"
          className="host-v2__icon-button"
          aria-label="Create team"
          disabled={!canCreate}
          onClick={onCreate}
        >
          {creating ? "…" : <Icon name="plus" className="icon--size-18" />}
        </button>
      </div>
      {teamsLoading ? (
        <p className="host-v2__muted">Loading teams…</p>
      ) : names.length ? (
        <div className="host-v2__team-chips">
          {names.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      ) : (
        <p className="host-v2__empty-copy">
          Create a team or assign players to a team below.
        </p>
      )}
    </section>
  );
}
