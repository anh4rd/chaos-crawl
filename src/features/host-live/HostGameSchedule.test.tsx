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
      reviewFinalDuration={null}
      plannedSideChallenges={false}
      plannedSecretMissions={false}
      reviewOpen={false}
      onReview={vi.fn()}
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

it("places a combined review at the end and opens existing host controls", () => {
  const onReview = vi.fn();
  render(
    <HostGameSchedule
      startTime="18:00"
      teamsEnabled={false}
      onBreak={false}
      onEditBreak={vi.fn()}
      defaultBreakMinutes={0}
      reviewFinalDuration={30}
      plannedSideChallenges
      plannedSecretMissions
      reviewOpen
      onReview={onReview}
      plannedTasks={[]}
      sessionStatus="live"
      currentRound={1}
      schedule={[
        { id: "welcome", type: "welcome", title: "Welcome", duration: 10 },
      ]}
      challenges={[
        hostChallengeFixture(),
        { ...hostChallengeFixture(), id: "side", kind: "side", title: "Side" },
      ]}
      secretAssignments={[]}
      secretMissionForms={null}
      playerById={new Map()}
      busy={false}
      editable
      onEdit={vi.fn()}
    />,
  );
  const review = screen
    .getByText("Review side challenges and secret missions")
    .closest("li");
  if (!review) throw new Error("Missing review stage.");
  expect(review.getAttribute("aria-current")).toBe("step");
  expect(within(review).getByText("18:20")).toBeTruthy();
  fireEvent.click(
    within(review).getByText("Review side challenges and secret missions"),
  );
  expect(within(review).getByText("35 min")).toBeTruthy();
  expect(
    within(review).getByText(/Secret mission review time is not included/),
  ).toBeTruthy();
  fireEvent.click(
    within(review).getByRole("button", { name: "Open review controls" }),
  );
  expect(onReview).toHaveBeenCalledOnce();
});

it("shows a secret-only review for older games without inventing a duration", () => {
  render(
    <HostGameSchedule
      startTime={null}
      teamsEnabled={false}
      onBreak={false}
      onEditBreak={vi.fn()}
      defaultBreakMinutes={0}
      reviewFinalDuration={null}
      plannedSideChallenges={false}
      plannedSecretMissions={false}
      reviewOpen={false}
      onReview={vi.fn()}
      plannedTasks={[]}
      sessionStatus="lobby"
      currentRound={0}
      schedule={[]}
      challenges={[{ ...hostChallengeFixture(), kind: "secret" }]}
      secretAssignments={[]}
      secretMissionForms={null}
      playerById={new Map()}
      busy={false}
      editable
      onEdit={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByText("Review secret missions"));
  expect(screen.getByText("Duration not set")).toBeTruthy();
  expect(screen.queryByText("Review side challenges")).toBeNull();
});
