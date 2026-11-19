import { expect, it } from "vitest";
import { defaultForm } from "./catalog";
import { createPlanWrite, hydratePlan } from "./planModel";
import { communityPlanTask, explorePlanTask } from "./planImports";
it("restores legacy selected IDs using saved row fields as authoritative values", () => {
  const form = hydratePlan({
    id: "legacy",
    name: "Saved name",
    event_date: "2030-02-03",
    start_time: "19:20:00",
    end_time: "22:30:00",
    player_count: 8,
    venue_name: "Saved venue",
    plan_data: {
      name: "Old name",
      selectedTaskIds: ["team-handshake", "pineapple", "unknown"],
    },
  });
  expect(form).toMatchObject({
    name: "Saved name",
    eventDate: "2030-02-03",
    startTime: "19:20",
    idealEndTime: "22:30",
    playerCount: 8,
    venueName: "Saved venue",
    selectedMain: ["pineapple"],
    selectedSide: ["team-handshake", "team-laugh"],
    customTasks: [],
  });
});
it("persists phased schedule timing separately from the target finish time", () => {
  const form = {
    ...defaultForm,
    name: "Phased plan",
    startTime: "18:00",
    idealEndTime: "22:00",
    selectedMain: ["pineapple"],
    schedule: [
      {
        id: "prep",
        type: "challenge" as const,
        title: "Prep",
        duration: 7,
        taskId: "pineapple",
      },
      {
        id: "perform",
        type: "challenge" as const,
        title: "Perform",
        duration: 11,
        taskId: "pineapple",
      },
    ],
  };
  const payload = createPlanWrite(form, "host-one", "planned");
  expect(payload.end_time).toBe("22:00");
  expect(payload.plan_data).toMatchObject({
    version: 3,
    estimatedEndTime: "18:58",
    selectedTaskIds: ["pineapple", "team-handshake", "team-laugh"],
    generatedEquipment: ["Pineapple"],
  });
  expect(payload.plan_data.schedule).toHaveLength(2);
});
it("retains the distinct timing defaults of community and Explore imports", () => {
  const community = communityPlanTask(
    {
      id: "one",
      title: "Community",
      description: "Task",
      payload: { minutes: 0, points: -2 },
      status: "approved",
    },
    "side",
  );
  const explore = explorePlanTask(
    JSON.stringify({
      id: "one",
      title: "Explore",
      description: "Task",
      minutes: 0,
      points: -2,
    }),
    "side",
  );
  expect(community).toMatchObject({
    id: "community-one",
    minutes: 1,
    points: 0,
    evidenceRequired: true,
  });
  expect(explore).toMatchObject({
    id: "explore-one",
    minutes: 10,
    points: 0,
    evidenceRequired: true,
  });
});
it("rejects malformed Explore objects before they enter the planning form", () => {
  for (const value of [
    null,
    {},
    { id: "one", title: "Broken", description: "Task", tags: [1] },
  ])
    expect(() => explorePlanTask(JSON.stringify(value), "main")).toThrow(
      "Invalid Explore challenge.",
    );
});
