import { describe, expect, it } from "vitest";
import type { CommunitySubmission } from "../../types/hostExplore";
import {
  communityTasksFromSubmissions,
  filterTasks,
  filterLocations,
  filterRoutes,
} from "./catalogueModel";
import {
  createChallengeDraft,
  draftFromSubmission,
  challengePayload,
} from "./challengeDraft";
import type { LocationIdea, RouteIdea } from "./types";

function submission(
  overrides: Partial<CommunitySubmission> = {},
): CommunitySubmission {
  return {
    id: "paper",
    item_type: "challenge",
    title: "Paper tower",
    description: "Build together.",
    payload: {},
    status: "approved",
    submitted_by: "host",
    review_note: null,
    created_at: "2030-01-01T12:00:00Z",
    ...overrides,
  };
}

describe("community catalogue projections", () => {
  it("publishes only approved challenges and preserves incoming order", () => {
    const rows = [
      submission({ id: "second" }),
      submission({ status: "pending" }),
      submission({ item_type: "venue" }),
      submission({ status: "rejected" }),
      submission({ id: "first" }),
    ];
    expect(communityTasksFromSubmissions(rows).map((task) => task.id)).toEqual([
      "community-second",
      "community-first",
    ]);
  });
  it("retains zero scores while distinguishing optional public durations from editable zeros", () => {
    const row = submission({
      payload: { points: 0, minutes: 0, prepMinutes: 0, performanceMinutes: 0 },
    });
    expect(communityTasksFromSubmissions([row])[0]).toMatchObject({
      points: 0,
      minutes: 0,
      prepMinutes: undefined,
      performanceMinutes: undefined,
    });
    expect(draftFromSubmission(row)).toMatchObject({
      points: 0,
      minutes: 0,
      prepMinutes: 0,
      performanceMinutes: 0,
    });
  });
  it("keeps public and editor defaults distinct for loosely shaped persisted payloads", () => {
    const row = submission({
      payload: {
        kind: "unknown",
        setup: "unknown",
        points: "17",
        minutes: "6",
      },
    });
    expect(communityTasksFromSubmissions([row])[0]).toMatchObject({
      kind: "main",
      setup: "none",
      points: 17,
      minutes: 6,
      tags: ["community"],
    });
    expect(draftFromSubmission(row)).toMatchObject({
      kind: "main",
      setup: "none",
      points: 17,
      minutes: 6,
      tags: ["creative", "team"],
    });
    const tags = [
      "one",
      2,
      true,
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const tagged = submission({
      payload: { kind: "secret", setup: "some", tags },
    });
    expect(communityTasksFromSubmissions([tagged])[0]?.tags).toEqual(
      tags.map(String),
    );
    expect(draftFromSubmission(tagged).tags).toEqual([
      "one",
      "2",
      "true",
      "four",
      "five",
      "six",
      "seven",
      "eight",
    ]);
  });
});

describe("challenge draft persistence projection", () => {
  it("creates independent drafts so edits cannot leak into a subsequent contribution", () => {
    const first = createChallengeDraft();
    first.tags.push("edited");
    first.title = "Changed";
    expect(createChallengeDraft()).toMatchObject({
      title: "",
      tags: ["creative", "team"],
    });
  });
  it("enforces existing numeric bounds and preserves tag selection order without mutating the draft", () => {
    const draft = {
      ...createChallengeDraft(),
      points: Infinity,
      minutes: 0,
      prepMinutes: -3,
      performanceMinutes: 500,
      tags: ["creative", "team", "a", "b", "c", "d", "e", "f", "ignored"],
    };
    expect(challengePayload(draft)).toEqual({
      kind: "main",
      points: 100,
      minutes: 1,
      prepMinutes: 0,
      performanceMinutes: 180,
      tags: ["creative", "team", "a", "b", "c", "d", "e", "f"],
      setup: "none",
    });
    expect(draft.tags).toHaveLength(9);
    expect(
      challengePayload({
        ...draft,
        points: NaN,
        minutes: NaN,
        prepMinutes: NaN,
        performanceMinutes: NaN,
      }),
    ).toMatchObject({
      points: 0,
      minutes: 1,
      prepMinutes: 0,
      performanceMinutes: 0,
    });
  });
});

describe("catalogue searches", () => {
  it("combines category and trimmed case-insensitive search without sorting tasks", () => {
    const tasks = communityTasksFromSubmissions([
      submission({ id: "b", payload: { kind: "side", tags: ["TEAMWORK"] } }),
      submission({ id: "a", payload: { kind: "main", tags: ["solo"] } }),
    ]);
    expect(
      filterTasks(tasks, "  BUILD TOGETHER  ", "side").map((task) => task.id),
    ).toEqual(["community-b"]);
    expect(filterTasks(tasks, "", "team").map((task) => task.id)).toEqual([
      "community-b",
    ]);
    expect(filterTasks(tasks, "", "all").map((task) => task.id)).toEqual([
      "community-b",
      "community-a",
    ]);
  });
  it("uses venue cost and suitability independently of the one-venue flag", () => {
    const venue: LocationIdea = {
      id: "hall",
      title: "Hall",
      description: "Indoor space",
      venueType: "hall",
      cost: "Low",
      bestFor: ["large groups"],
      considerations: ["Step-free entrance"],
      oneVenue: true,
    };
    expect(filterLocations([venue], " STEP-FREE ", "budget")).toEqual([venue]);
    expect(filterLocations([venue], "", "outdoors")).toEqual([]);
    expect(
      filterLocations([{ ...venue, oneVenue: false }], "", "one venue"),
    ).toEqual([]);
    expect(
      filterLocations([{ ...venue, cost: "Medium" }], "", "budget"),
    ).toEqual([]);
  });
  it("searches route stops and retains budget/category rules", () => {
    const route: RouteIdea = {
      id: "loop",
      title: "Loop",
      description: "A short route",
      style: "Classic",
      duration: "2 hours",
      budget: "Low",
      stops: ["Riverside café"],
      tags: ["one venue"],
      note: "Check opening hours",
    };
    expect(filterRoutes([route], "  RIVERSIDE  ", "budget")).toEqual([route]);
    expect(filterRoutes([route], "", "one venue")).toEqual([route]);
    expect(
      filterRoutes([{ ...route, budget: "Medium" }], "", "budget"),
    ).toEqual([]);
    expect(filterRoutes([route], "no match", "all")).toEqual([]);
  });
});
