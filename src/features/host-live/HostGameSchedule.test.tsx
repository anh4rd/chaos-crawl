import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import HostGameSchedule from "./HostGameSchedule";
import { hostChallengeFixture } from "./testFixtures";

afterEach(cleanup);

it("links scheduled preparation and performance to the live challenge and its saved details", () => {
  const challenge = hostChallengeFixture();
  const onEdit = vi.fn();
  render(
    <HostGameSchedule
      startTime="18:00"
      teamsEnabled={false}
      onBreak={false}
      onEditBreak={vi.fn()}
      defaultBreakMinutes={0}
      plannedTasks={[
        { id: "plan-id", title: challenge.title, equipment: ["Hat"] },
      ]}
      sessionStatus="live"
      currentRound={1}
      schedule={[
        {
          id: "prep",
          type: "challenge",
          taskId: "plan-id",
          title: `${challenge.title} — Player prep`,
          phase: "prep",
          duration: 2,
        },
        {
          id: "performance",
          type: "challenge",
          taskId: "plan-id",
          title: `${challenge.title} — Player performance`,
          phase: "performance",
          duration: 3,
        },
      ]}
      challenges={[challenge]}
      secretAssignments={[]}
      secretMissionForms={null}
      playerById={new Map()}
      busy={false}
      editable
      onEdit={onEdit}
    />,
  );
  const prep = screen
    .getByText(`${challenge.title} — Player prep`)
    .closest("details");
  const performance = screen
    .getByText(`${challenge.title} — Player performance`)
    .closest("details");
  if (!prep || !performance)
    throw new Error("Missing scheduled challenge phases.");
  fireEvent.click(within(prep).getByText(`${challenge.title} — Player prep`));
  expect(prep.open).toBe(true);
  expect(within(prep).getByText(challenge.description)).toBeTruthy();
  expect(within(prep).getByText("+20 POINTS")).toBeTruthy();
  expect(within(prep).getByText("Hat")).toBeTruthy();
  fireEvent.click(
    within(prep).getByRole("button", { name: `Edit ${challenge.title}` }),
  );
  expect(onEdit).toHaveBeenCalledWith(challenge);
  fireEvent.click(
    within(performance).getByText(`${challenge.title} — Player performance`),
  );
  expect(
    within(performance).getByRole("button", {
      name: `Edit ${challenge.title}`,
    }),
  ).toBeTruthy();
});
