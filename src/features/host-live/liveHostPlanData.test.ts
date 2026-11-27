import { expect, it } from "vitest";
import {
  projectLiveHostPlan,
  patchLiveHostPlanTask,
  plannedTaskForChallenge,
} from "./liveHostPlanData";

it("projects whether the saved plan enables pre-event invitations", () => {
  expect(projectLiveHostPlan({}).invitationEnabled).toBe(true);
  expect(
    projectLiveHostPlan({ inviteBeforeEvent: false }).invitationEnabled,
  ).toBe(false);
  expect(projectLiveHostPlan(null).invitationEnabled).toBeNull();
  expect(
    projectLiveHostPlan({ inviteBeforeEvent: "unexpected" }).invitationEnabled,
  ).toBeNull();
});
it("links a live challenge to its unique saved title without guessing between duplicates", () => {
  const task = { id: "plan-task", title: "Entrance", equipment: ["Hat"] };
  const live = { id: "live-id", title: "Entrance" };
  expect(plannedTaskForChallenge([task], live, [live])).toEqual(task);
  expect(
    plannedTaskForChallenge(
      [task, { id: "other", title: "Entrance" }],
      {
        id: "live-id",
        title: "Entrance",
      },
      [live],
    ),
  ).toBeUndefined();
  expect(
    plannedTaskForChallenge(
      [task, { id: "other", title: "Entrance" }],
      {
        id: "plan-task",
        title: "Entrance",
      },
      [live],
    ),
  ).toEqual(task);
  expect(
    plannedTaskForChallenge([task], live, [
      live,
      { id: "another", title: "Entrance" },
    ]),
  ).toBeUndefined();
});
it("projects the saved in-game reward choice without inventing a setting", () => {
  expect(
    projectLiveHostPlan({ decideRewardInGame: true }).decideRewardInGame,
  ).toBe(true);
  expect(
    projectLiveHostPlan({ decideRewardInGame: false }).decideRewardInGame,
  ).toBe(false);
  expect(
    projectLiveHostPlan({ decideRewardInGame: "true" }).decideRewardInGame,
  ).toBeNull();
});
it.each([
  { value: 0, expected: 0 },
  { value: 2.5, expected: 2.5 },
  { value: " 3.5 ", expected: 3.5 },
  { value: -2, expected: 0 },
  { value: Infinity, expected: 0 },
  { value: {}, expected: 0 },
  { value: [], expected: 0 },
])("retains finite break-minute defaults for $value", ({ value, expected }) => {
  expect(projectLiveHostPlan({ breakMinutes: value }).defaultBreakMinutes).toBe(
    expected,
  );
});
it("accepts missing optional task fields and preserves valid incoming order without copying unknown fields into presentation", () => {
  const data = projectLiveHostPlan({
    autoplay: true,
    selectedTasks: [
      { title: "No id", extra: 42 },
      { id: "second", equipment: [] },
      {},
    ],
    challengeArtUrls: { second: "https://assets.test/second.png" },
    schedule: [
      {
        id: "break",
        type: "break",
        title: "Pause",
        duration: 0,
        phase: "middle",
        extra: 42,
      },
    ],
    gamePhotoUrl: "",
    teamPhotoUrls: { team: "" },
  });
  expect(data.plannedTasks).toEqual([
    { title: "No id" },
    {
      id: "second",
      equipment: [],
      artUrl: "https://assets.test/second.png",
    },
    {},
  ]);
  expect(data.gameSchedule).toEqual([
    {
      id: "break",
      type: "break",
      title: "Pause",
      duration: 0,
      phase: "middle",
    },
  ]);
  expect(data.gamePhotoUrl).toBe("");
  expect(data.teamPhotoUrls).toEqual({ team: "" });
});
it("does not mutate the source plan while updating all matching duplicate task IDs", () => {
  const source = {
    selectedTasks: [
      { id: "same", custom: 1 },
      { id: "same", custom: 2 },
    ],
    challengeArtUrls: { same: "https://assets.test/same.png" },
    other: [1],
  };
  const patch = {
    title: "Changed",
    description: "Description",
    minutes: 1,
    points: 0,
    equipment: [],
    setup: "",
    prep: "",
  };
  const updated = patchLiveHostPlanTask(source, "same", patch);
  expect(updated?.planData).toEqual({
    ...source,
    selectedTasks: source.selectedTasks.map((task) => ({ ...task, ...patch })),
  });
  expect(updated?.plannedTasks.map((task) => task.artUrl)).toEqual([
    "https://assets.test/same.png",
    "https://assets.test/same.png",
  ]);
  expect(source.selectedTasks).toEqual([
    { id: "same", custom: 1 },
    { id: "same", custom: 2 },
  ]);
});
