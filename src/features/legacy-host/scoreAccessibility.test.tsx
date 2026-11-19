import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import ScoreLeaderboard from "./ScoreLeaderboard";
import ScoreAdjustment from "./ScoreAdjustment";
import type { ScoreAction, ScoreTarget } from "./types";

afterEach(cleanup);
function Leaderboard() {
  const [target, setTarget] = useState<ScoreTarget>("player");
  return (
    <ScoreLeaderboard
      target={target}
      onTargetChange={setTarget}
      loading={false}
      entries={[]}
    />
  );
}
function Adjustment() {
  const [target, setTarget] = useState<ScoreTarget>("player");
  const [action, setAction] = useState<ScoreAction>("award");
  return (
    <ScoreAdjustment
      target={target}
      action={action}
      onTargetChange={setTarget}
      onActionChange={setAction}
      players={[]}
      teams={[]}
      selectedPlayerId=""
      selectedTeamName=""
      points="5"
      reason=""
      onPlayerChange={vi.fn()}
      onTeamChange={vi.fn()}
      onPointsChange={vi.fn()}
      onReasonChange={vi.fn()}
      onSubmit={vi.fn()}
    />
  );
}
it("announces the selected leaderboard view and updates it after activation", () => {
  render(<Leaderboard />);
  const group = within(screen.getByRole("group", { name: "Leaderboard view" }));
  expect(
    group.getByRole("button", { name: "Player scores", pressed: true }),
  ).toBeDefined();
  const teams = group.getByRole("button", {
    name: "Team scores",
    pressed: false,
  });
  teams.focus();
  fireEvent.click(teams);
  expect(
    group.getByRole("button", { name: "Team scores", pressed: true }),
  ).toBe(teams);
  expect(
    group.getByRole("button", { name: "Player scores", pressed: false }),
  ).toBeDefined();
  expect(document.activeElement).toBe(teams);
});
it("exposes independent target and award/dock selections without changing the native fields", () => {
  render(<Adjustment />);
  const target = within(screen.getByRole("group", { name: "Score target" }));
  const action = within(
    screen.getByRole("group", { name: "Award or dock points" }),
  );
  expect(
    target.getByRole("button", { name: "Player", pressed: true }),
  ).toBeDefined();
  expect(
    action.getByRole("button", { name: "Award", pressed: true }),
  ).toBeDefined();
  fireEvent.click(target.getByRole("button", { name: "Team", pressed: false }));
  fireEvent.click(action.getByRole("button", { name: "Dock", pressed: false }));
  expect(
    target.getByRole("button", { name: "Team", pressed: true }),
  ).toBeDefined();
  expect(
    action.getByRole("button", { name: "Dock", pressed: true }),
  ).toBeDefined();
  expect(
    target.getByRole("button", { name: "Player", pressed: false }),
  ).toBeDefined();
  expect(
    action.getByRole("button", { name: "Award", pressed: false }),
  ).toBeDefined();
  expect(screen.getByRole("combobox", { name: "Team" })).toBeDefined();
  expect(
    screen.getByRole("spinbutton", { name: "Points" }).getAttribute("value"),
  ).toBe("5");
});
