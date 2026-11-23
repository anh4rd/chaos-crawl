import { useState, type FormEvent } from "react";
import ControlPanel from "../../components/ui/ControlPanel";
import Icon from "../../components/ui/Icon";

type Target = "player" | "team";

export default function ScoreAdjustmentForm({
  players,
  teams,
  teamsEnabled,
  busy,
  onAdjust,
  successCount = 0,
}: {
  players: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  teamsEnabled: boolean;
  busy: boolean;
  onAdjust: (target: Target, id: string, delta: number) => void;
  successCount?: number;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [target, setTarget] = useState<Target>("player");
  const [id, setId] = useState("");
  const [points, setPoints] = useState("5");
  const actualTarget = teamsEnabled ? target : "player";
  const options = actualTarget === "player" ? players : teams;
  const selected = options.some((item) => item.id === id) ? id : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(points);
    if (
      !selected ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 2147483647
    )
      return;
    onAdjust(actualTarget, selected, direction === "add" ? amount : -amount);
  }

  return (
    <ControlPanel
      heading="Host controls"
      marker={<Icon name="users" aria-hidden="true" />}
      className="score-adjustment"
    >
      <form className="score-adjustment__form" onSubmit={submit}>
        <label>
          Action
          <select
            value={direction}
            disabled={busy}
            onChange={(event) =>
              setDirection(event.target.value === "remove" ? "remove" : "add")
            }
          >
            <option value="add">Add</option>
            <option value="remove">Remove</option>
          </select>
        </label>
        <label>
          Target
          <select
            value={actualTarget}
            disabled={busy || !teamsEnabled}
            onChange={(event) => {
              setTarget(event.target.value === "team" ? "team" : "player");
              setId("");
            }}
          >
            <option value="player">Player</option>
            {teamsEnabled && <option value="team">Team</option>}
          </select>
        </label>
        <label>
          Name
          <select
            value={selected}
            required
            disabled={busy}
            onChange={(event) => setId(event.target.value)}
          >
            <option value="">Name</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Points
          <input
            type="number"
            min="1"
            max="2147483647"
            step="1"
            required
            value={points}
            disabled={busy}
            onChange={(event) => setPoints(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="score-adjustment__submit"
          disabled={busy || !selected}
          aria-label="Apply score adjustment"
        >
          <Icon
            key={successCount}
            name="check"
            className={successCount > 0 ? "score-adjustment__success" : ""}
            aria-hidden="true"
          />
        </button>
      </form>
    </ControlPanel>
  );
}
