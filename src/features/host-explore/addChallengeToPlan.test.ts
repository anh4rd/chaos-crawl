import { expect, it } from "vitest";
import { defaultForm } from "../host-planning/catalog";
import { createPlanWrite } from "../host-planning/planModel";
import { explorePlanTask } from "../host-planning/planImports";
import { addChallengeToPlan } from "./addChallengeToPlan";

const idea = JSON.stringify({
  id: "idea",
  title: "Idea",
  description: "A challenge",
  minutes: 5,
  points: 12,
});
function plan() {
  return {
    ...createPlanWrite(defaultForm, "owner", "draft").plan_data,
    unknownField: { keep: true },
  };
}
it.each(["main", "side", "secret"] as const)(
  "adds %s without losing plan data and is idempotent",
  (kind) => {
    const task = explorePlanTask(idea, kind);
    const result = addChallengeToPlan(plan(), task);
    expect(result.added).toBe(true);
    expect(result.plan).toMatchObject({
      unknownField: { keep: true },
      customTasks: [expect.objectContaining({ id: task.id, kind })],
      selectedTasks: expect.arrayContaining([
        expect.objectContaining({ id: task.id, kind }),
      ]),
      selectedTaskIds: expect.arrayContaining([task.id]),
      ...(kind === "main"
        ? {
            selectedMain: [task.id],
            schedule: expect.arrayContaining([
              expect.objectContaining({ taskId: task.id }),
            ]),
          }
        : {}),
      ...(kind === "side"
        ? {
            selectedSide: expect.arrayContaining([task.id]),
            sideChallenges: true,
          }
        : {}),
      ...(kind === "secret"
        ? {
            selectedSecret: [task.id],
            secretMissions: true,
            schedule: expect.arrayContaining([
              expect.objectContaining({ type: "secret-reveal" }),
            ]),
          }
        : {}),
    });
    expect(addChallengeToPlan(result.plan, task).added).toBe(false);
  },
);
it.each([
  ["main", "side"],
  ["main", "secret"],
  ["side", "main"],
  ["side", "secret"],
  ["secret", "main"],
  ["secret", "side"],
] as const)(
  "rejects adding a %s challenge as %s without changing the plan",
  (firstKind, nextKind) => {
    const first = addChallengeToPlan(plan(), explorePlanTask(idea, firstKind));
    const before = structuredClone(first.plan);
    expect(() =>
      addChallengeToPlan(first.plan, explorePlanTask(idea, nextKind)),
    ).toThrow(`already in this game as ${firstKind}`);
    expect(first.plan).toEqual(before);
  },
);

it("recognizes a catalogue alias and a previously suffixed duplicate", () => {
  const main = addChallengeToPlan(plan(), explorePlanTask(idea, "main"));
  const alias = { ...explorePlanTask(idea, "side"), id: "catalog:idea" };
  expect(() => addChallengeToPlan(main.plan, alias)).toThrow(
    /already in this game as main/,
  );
  const saved = explorePlanTask(idea, "secret");
  const legacy = {
    ...plan(),
    customTasks: [{ ...saved, id: "explore-idea-secret" }],
    selectedSecret: ["explore-idea-secret"],
  };
  expect(() =>
    addChallengeToPlan(legacy, explorePlanTask(idea, "side")),
  ).toThrow(/already in this game as secret/);
});
it("allows a different type after the old type has been removed", () => {
  const old = explorePlanTask(idea, "side");
  const removed = { ...plan(), customTasks: [old] };
  const result = addChallengeToPlan(removed, explorePlanTask(idea, "secret"));
  expect(result.plan.customTasks).toEqual([
    expect.objectContaining({ id: old.id, kind: "secret" }),
  ]);
  expect(result.plan.selectedSecret).toEqual([old.id]);
});
it("rejects malformed or legacy metadata without overwriting it", () => {
  expect(() =>
    addChallengeToPlan({ selectedTasks: [] }, explorePlanTask(idea, "side")),
  ).toThrow(/Open and save/);
});
