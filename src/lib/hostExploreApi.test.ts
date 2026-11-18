import { beforeEach, expect, it, vi } from "vitest";
import {
  readCommunitySubmissions,
  readExploreFavourites,
} from "./hostExploreQueries";
import {
  createCommunityChallenge,
  deleteApprovedCommunityChallenge,
  reviewPendingCommunitySubmission,
  saveExploreFavourite,
  updateApprovedCommunityChallenge,
} from "./hostExploreCommands";
import type { CommunityChallengePayload } from "../types/hostExplore";
import { reportError } from "./monitoring";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./sessionSupabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const payload: CommunityChallengePayload = {
  kind: "side",
  points: 0,
  minutes: 1,
  prepMinutes: 0,
  performanceMinutes: 0,
  tags: ["creative", "team"],
  setup: "none",
};

it.each(["synchronous", "rejected"])(
  "Explore reads and writes normalize %s SDK failures without leaking promises",
  async (failure) => {
    const cause = new Error("SDK unavailable");
    const execute = () => Promise.reject(cause);
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      single: vi.fn(execute),
      then: (
        ...args: Parameters<Promise<{ data: unknown; error: unknown }>["then"]>
      ) => execute().then(...args),
    };
    for (const method of [
      "select",
      "eq",
      "order",
      "insert",
      "update",
      "delete",
    ] as const)
      query[method].mockReturnValue(query);
    mocks.from.mockImplementation(() => {
      if (failure === "synchronous") throw cause;
      return query;
    });
    const operations = [
      () => readExploreFavourites("host"),
      () => readCommunitySubmissions(),
      () =>
        saveExploreFavourite({
          hostId: "host",
          itemType: "task",
          itemId: "idea",
          itemData: { title: "Idea" },
        }),
      () =>
        createCommunityChallenge({
          title: "Idea",
          description: "Rules",
          payload,
          submittedBy: "host",
        }),
      () =>
        updateApprovedCommunityChallenge({
          id: "idea",
          title: "Idea",
          description: "Rules",
          payload,
        }),
      () => deleteApprovedCommunityChallenge({ id: "idea" }),
      () =>
        reviewPendingCommunitySubmission({
          id: "idea",
          status: "rejected",
          reviewedBy: "host",
          reviewedAt: "2030-01-01T12:00:00Z",
        }),
    ];
    for (const operation of operations)
      await expect(operation()).resolves.toEqual({
        data: null,
        error: { message: "SDK unavailable" },
      });
    expect(reportError).toHaveBeenCalledTimes(operations.length);
    expect(reportError).toHaveBeenCalledWith(cause, "api");
  },
);
