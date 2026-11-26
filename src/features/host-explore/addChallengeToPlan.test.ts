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
it("preserves both types when the same challenge is added to different categories", () => {
  const first = addChallengeToPlan(plan(), explorePlanTask(idea, "main"));
  const second = addChallengeToPlan(
    first.plan,
    explorePlanTask(idea, "secret"),
  );
  expect(second.plan).toMatchObject({
    selectedMain: ["explore-idea"],
    selectedSecret: ["explore-idea-secret"],
    selectedTasks: expect.arrayContaining([
      expect.objectContaining({ id: "explore-idea", kind: "main" }),
      expect.objectContaining({ id: "explore-idea-secret", kind: "secret" }),
    ]),
  });
});
it("rejects malformed or legacy metadata without overwriting it", () => {
  expect(() =>
    addChallengeToPlan({ selectedTasks: [] }, explorePlanTask(idea, "side")),
  ).toThrow(/Open and save/);
});
