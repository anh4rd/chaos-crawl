import { expect, it } from "vitest";
import { projectLiveHostPlan, patchLiveHostPlanTask } from "./liveHostPlanData";
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
