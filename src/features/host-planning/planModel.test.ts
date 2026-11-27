import { expect, it } from "vitest";
import { defaultForm, taskLibrary } from "./catalog";
import {
  createPlanWrite,
  derivePlan,
  hydratePlan,
  initialSchedule,
} from "./planModel";
import {
  attachPlanTask,
  changePlanChallengeKind,
  communityPlanTask,
  explorePlanTask,
  savedFavouriteTasks,
} from "./planImports";

it.each([
  ["main", "side"],
  ["main", "secret"],
  ["side", "main"],
  ["side", "secret"],
  ["secret", "main"],
  ["secret", "side"],
] as const)(
  "moves a %s challenge to %s and survives saving and reopening",
  (from, to) => {
    const original = taskLibrary.find((task) => task.kind === from);
    if (!original) throw new Error("Missing challenge fixture");
    const form = {
      ...defaultForm,
      selectedMain: from === "main" ? [original.id] : [],
      selectedSide: from === "side" ? [original.id] : [],
      selectedSecret: from === "secret" ? [original.id] : [],
      secretMissions: from === "secret",
      schedule:
        from === "main"
          ? [
              {
                id: "prep",
                type: "challenge" as const,
                title: "Prep",
                duration: 5,
                taskId: original.id,
                phase: "prep" as const,
              },
              {
                id: "perform",
                type: "challenge" as const,
                title: "Perform",
                duration: 10,
                taskId: original.id,
                phase: "performance" as const,
              },
            ]
          : [],
    };
    const result = changePlanChallengeKind(
      form,
      original,
      to,
      derivePlan(form).selectedTasks,
    );
    expect(result.error).toBeUndefined();
    const saved = createPlanWrite(result.form, "host", "draft");
    const reopened = hydratePlan({
      id: "plan",
      ...saved,
      plan_data: { ...saved.plan_data },
    });
    expect(derivePlan(reopened).selectedTasks).toEqual([
      expect.objectContaining({
        id: original.id,
        kind: to,
        title: original.title,
        points: original.points,
        description: original.description,
      }),
    ]);
    expect(
      reopened.schedule.filter((item) => item.taskId === original.id).length,
    ).toBe(to === "main" ? 1 : 0);
    expect(reopened.selectedMain.includes(original.id)).toBe(to === "main");
    expect(reopened.selectedSide.includes(original.id)).toBe(to === "side");
    expect(reopened.selectedSecret.includes(original.id)).toBe(to === "secret");
    expect(reopened.secretMissions).toBe(to === "secret");
    if (to === "side")
      expect(reopened).toMatchObject({
        sideChallenges: true,
        liveFinal: true,
        slideshow: true,
      });
  },
);

it("clears pre-game references when converting a pre-game challenge", () => {
  const task = taskLibrary[0];
  const form = {
    ...defaultForm,
    selectedMain: [task.id],
    selectedSide: [],
    preGameEnabled: true,
    preGameTaskId: task.id,
    schedule: [
      {
        id: "pregame",
        type: "pregame" as const,
        title: task.title,
        duration: 0,
        taskId: task.id,
      },
      {
        id: "pregame-review",
        type: "pregame-review" as const,
        title: "Review",
        duration: 15,
      },
    ],
  };
  const result = changePlanChallengeKind(
    form,
    task,
    "side",
    derivePlan(form).selectedTasks,
  );
  expect(result.form).toMatchObject({
    preGameEnabled: false,
    preGameTaskId: "",
    schedule: [],
  });
});

it("writes main challenges in schedule order when a side challenge becomes main", () => {
  const side = taskLibrary.find((task) => task.id === "team-handshake");
  if (!side) throw new Error("Missing challenge fixture");
  const custom = { ...taskLibrary[0], id: "custom-main", title: "First" };
  const form = {
    ...defaultForm,
    selectedMain: [custom.id],
    selectedSide: [side.id],
    customTasks: [custom],
    schedule: [
      {
        id: "first",
        type: "challenge" as const,
        title: custom.title,
        duration: custom.minutes,
        taskId: custom.id,
      },
    ],
  };
  const result = changePlanChallengeKind(
    form,
    side,
    "main",
    derivePlan(form).selectedTasks,
  );
  const saved = createPlanWrite(result.form, "host", "draft");
  expect(
    saved.plan_data.selectedTasks
      .filter((task) => task.kind === "main")
      .map((task) => task.id),
  ).toEqual(["custom-main", "team-handshake"]);
});

it("refuses to rewrite an existing duplicate across challenge types", () => {
  const task = taskLibrary[0];
  const form = {
    ...defaultForm,
    selectedMain: [task.id],
    selectedSide: [task.id],
  };
  const result = changePlanChallengeKind(
    form,
    task,
    "secret",
    derivePlan(form).selectedTasks,
  );
  expect(result.form).toBe(form);
  expect(result.error).toMatch(/already selected more than once/);
});
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
