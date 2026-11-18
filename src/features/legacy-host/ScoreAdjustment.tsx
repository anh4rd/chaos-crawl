import Icon from "../../components/ui/Icon";
import type { ScoreAdjustmentModel } from "./types";

export default function ScoreAdjustment({
  target,
  action,
  players,
  teams,
  selectedPlayerId,
  selectedTeamName,
  points,
  reason,
  onTargetChange,
  onActionChange,
  onPlayerChange,
  onTeamChange,
  onPointsChange,
  onReasonChange,
  onSubmit,
}: ScoreAdjustmentModel) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="plus" className="icon--size-14" /> POINTS ADJUSTMENT
        </span>
      </div>
      <div
        className="host-v2__segmented"
        role="group"
        aria-label="Score target"
      >
        <button
          type="button"
          className={target === "player" ? "is-selected" : ""}
          onClick={() => onTargetChange("player")}
        >
          Player
        </button>
        <button
          type="button"
          className={target === "team" ? "is-selected" : ""}
          onClick={() => onTargetChange("team")}
        >
          Team
        </button>
      </div>
      <div
        className="host-v2__segmented host-v2__segmented--action"
        role="group"
        aria-label="Award or dock points"
      >
        <button
          type="button"
          className={action === "award" ? "is-selected" : ""}
          onClick={() => onActionChange("award")}
        >
          <Icon name="plus" className="icon--size-15" /> Award
        </button>
        <button
          type="button"
          className={action === "dock" ? "is-selected" : ""}
          onClick={() => onActionChange("dock")}
        >
          <Icon name="minus" className="icon--size-15" /> Dock
        </button>
      </div>
      {target === "player" ? (
        <label className="host-v2__field">
          <span>Player</span>
          <select
            value={selectedPlayerId}
            onChange={(event) => onPlayerChange(event.target.value)}
          >
            <option value="">Select a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="host-v2__field">
          <span>Team</span>
          <select
            value={selectedTeamName}
            onChange={(event) => onTeamChange(event.target.value)}
          >
            <option value="">Select a team</option>
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="host-v2__field">
        <span>Points</span>
        <input
          type="number"
          min={1}
          value={points}
          onChange={(event) => onPointsChange(event.target.value)}
        />
      </label>
      <label className="host-v2__field">
        <span>Reason (optional)</span>
        <input
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="e.g. Best costume"
        />
      </label>
      <button
        type="button"
        className="host-v2__button host-v2__button--primary"
        onClick={onSubmit}
      >
        {action === "award" ? "Award points" : "Dock points"}
        <Icon name="chevron-right" className="icon--size-17" />
      </button>
    </section>
  );
}
