import Button from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import FilterGroup from "../../components/ui/FilterGroup";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
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
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="plus" className="icon--size-14" /> POINTS ADJUSTMENT
        </Overline>
      </PanelHeading>
      <FilterGroup variant="console" role="group" aria-label="Score target">
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          className={target === "player" ? "btn--console-selected" : ""}
          onClick={() => onTargetChange("player")}
        >
          Player
        </Button>
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          className={target === "team" ? "btn--console-selected" : ""}
          onClick={() => onTargetChange("team")}
        >
          Team
        </Button>
      </FilterGroup>
      <FilterGroup
        variant="console-action"
        role="group"
        aria-label="Award or dock points"
      >
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          className={action === "award" ? "btn--console-selected" : ""}
          onClick={() => onActionChange("award")}
        >
          <Icon name="plus" className="icon--size-15" /> Award
        </Button>
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          className={action === "dock" ? "btn--console-selected" : ""}
          onClick={() => onActionChange("dock")}
        >
          <Icon name="minus" className="icon--size-15" /> Dock
        </Button>
      </FilterGroup>
      {target === "player" ? (
        <Field variant="console" label="Player">
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
        </Field>
      ) : (
        <Field variant="console" label="Team">
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
        </Field>
      )}
      <Field variant="console" label="Points">
        <input
          type="number"
          min={1}
          value={points}
          onChange={(event) => onPointsChange(event.target.value)}
        />
      </Field>
      <Field variant="console" label="Reason (optional)">
        <input
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="e.g. Best costume"
        />
      </Field>
      <Button
        type="button"
        fullWidth={false}
        variant="console-primary"
        onClick={onSubmit}
      >
        {action === "award" ? "Award points" : "Dock points"}
        <Icon name="chevron-right" className="icon--size-17" />
      </Button>
    </ContentPanel>
  );
}
