import { expect, it } from "vitest";
import { defaultForm } from "./catalog";
import { createPlanWrite, hydratePlan, initialSchedule } from "./planModel";
import {
  attachPlanTask,
  communityPlanTask,
  explorePlanTask,
  savedFavouriteTasks,
} from "./planImports";
it("restores legacy selected IDs using saved row fields as authoritative values", () => {
  const form = hydratePlan({
    id: "legacy",
    host_id: "host-one",
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
it("preserves challenge artwork URLs in saved plans", () => {
  const form = hydratePlan({
    id: "artwork",
    host_id: "host-one",
    name: "Artwork plan",
    event_date: null,
    start_time: null,
    end_time: null,
    player_count: null,
    venue_name: null,
    plan_data: {
      challengeArtUrls: {
        pineapple: "https://assets.test/pineapple.png",
      },
    },
  });
  expect(form.challengeArtUrls).toEqual({
    pineapple: "https://assets.test/pineapple.png",
  });
  expect(
    createPlanWrite(form, "host-one", "planned").plan_data.challengeArtUrls,
  ).toEqual(form.challengeArtUrls);
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

it("selects and enables imported secret missions without changing other selections", () => {
  const task = explorePlanTask(
    JSON.stringify({ id: "one", title: "Secret", description: "Task" }),
    "secret",
  );
  const form = attachPlanTask(attachPlanTask(defaultForm, task), task);
  expect(task).toMatchObject({ kind: "secret", evidenceRequired: true });
  expect(form).toMatchObject({
    secretMissions: true,
    selectedSecret: ["explore-one"],
    selectedMain: defaultForm.selectedMain,
    selectedSide: defaultForm.selectedSide,
  });
  expect(initialSchedule(form)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "secret-reveal" }),
    ]),
  );
  expect(
    communityPlanTask(
      {
        id: "two",
        title: "Community",
        description: "Task",
        payload: {},
        status: "approved",
      },
      "secret",
    ),
  ).toMatchObject({ kind: "secret", evidenceRequired: true });
});

it("projects saved challenges of each kind and reports malformed items separately", () => {
  const result = savedFavouriteTasks([
    {
      id: "fav",
      item_id: "community-one",
      item_type: "task",
      item_data: {
        id: "community-one",
        title: "Hidden mission",
        description: "A private challenge",
        kind: "secret",
        points: 15,
        minutes: 5,
        tags: ["sneaky"],
        setup: "basic",
      },
    },
    {
      id: "custom",
      item_id: "custom-one",
      item_type: "task",
      item_data: {
        id: "custom-one",
        title: "Custom mission",
        description: "Use a prop",
        kind: "secret",
        points: 7,
        minutes: 3,
        vibe: ["creative"],
        accessibility: ["standing"],
        equipment: ["Hat"],
        setup: "Bring a hat.",
        prep: "Find a hat.",
      },
    },
    {
      id: "other",
      item_id: "side",
      item_type: "task",
      item_data: {
        id: "side",
        title: "Side challenge",
        description: "An optional task",
        kind: "side",
      },
    },
    {
      id: "main",
      item_id: "main",
      item_type: "task",
      item_data: {
        id: "main",
        title: "Main challenge",
        description: "A scheduled task",
        kind: "main",
      },
    },
    {
      id: "location",
      item_id: "location",
      item_type: "venue",
      item_data: { kind: "main" },
    },
    {
      id: "broken",
      item_id: "broken",
      item_type: "task",
      item_data: { kind: "secret" },
    },
  ]);
  expect(result.invalid).toEqual({ main: 0, side: 0, secret: 1 });
  expect(result.tasks).toMatchObject([
    {
      id: "community-one",
      title: "Hidden mission",
      kind: "secret",
      evidenceRequired: true,
    },
    {
      id: "custom-one",
      equipment: ["Hat"],
      setup: "Bring a hat.",
      prep: "Find a hat.",
    },
    { id: "side", kind: "side", evidenceRequired: true },
    { id: "main", kind: "main", evidenceRequired: false },
  ]);
});
