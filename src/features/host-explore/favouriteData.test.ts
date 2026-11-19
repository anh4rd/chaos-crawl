import { expect, it } from "vitest";
import type { CatalogTask } from "./types";
import { favouriteData } from "./favouriteData";

it("retains the saved-item JSON contract for absent optional durations and non-finite numbers", () => {
  const task: CatalogTask = {
    id: "idea",
    title: "Idea",
    description: "Rules",
    kind: "side",
    points: NaN,
    minutes: Infinity,
    prepMinutes: undefined,
    performanceMinutes: 0,
    tags: ["creative", "team"],
    setup: "none",
  };
  expect(JSON.parse(JSON.stringify(favouriteData(task)))).toEqual({
    id: "idea",
    title: "Idea",
    description: "Rules",
    kind: "side",
    points: null,
    minutes: null,
    performanceMinutes: 0,
    tags: ["creative", "team"],
    setup: "none",
  });
  expect(task.tags).toEqual(["creative", "team"]);
  expect(task.prepMinutes).toBeUndefined();
});
