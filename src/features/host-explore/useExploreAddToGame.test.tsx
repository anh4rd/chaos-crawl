import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { defaultForm } from "../host-planning/catalog";
import { createPlanWrite } from "../host-planning/planModel";
import { useExploreAddToGame } from "./useExploreAddToGame";
import type { CatalogTask } from "./types";

const mocks = vi.hoisted(() => ({
  games: vi.fn(),
  plan: vi.fn(),
  update: vi.fn(),
  community: vi.fn(),
  sessions: vi.fn(),
}));
vi.mock("../../lib/hostExploreQueries", () => ({
  readExploreGames: mocks.games,
  readExploreGamePlan: mocks.plan,
  readExploreActiveSessions: mocks.sessions,
}));
vi.mock("../../lib/hostExploreCommands", () => ({
  updateExploreGamePlan: mocks.update,
}));
vi.mock("../../lib/hostPlanApi", () => ({
  readApprovedPlanTask: mocks.community,
}));
const task: CatalogTask = {
  id: "idea",
  title: "Idea",
  description: "Test",
  kind: "main",
  points: 10,
  minutes: 5,
  tags: [],
  setup: "none",
};
const game = { id: "one", name: "One", status: "planned" as const };
const snapshot = createPlanWrite(defaultForm, "owner", "draft").plan_data;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.games.mockResolvedValue({ data: [], error: null });
  mocks.plan.mockResolvedValue({
    data: {
      id: "one",
      status: "planned",
      plan_data: snapshot,
      updated_at: "2030-01-01T00:00:00Z",
    },
    error: null,
  });
  mocks.update.mockResolvedValue({ data: { id: "one" }, error: null });
  mocks.sessions.mockResolvedValue({ data: [], error: null });
});
afterEach(cleanup);
it("offers game creation only when no editable games exist", async () => {
  const navigate = vi.fn();
  const { result } = renderHook(() => useExploreAddToGame({ navigate }));
  act(() => result.current.start(task, "secret"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.games).toEqual([]);
  expect(mocks.update).not.toHaveBeenCalled();
  act(() => result.current.create());
  expect(navigate).toHaveBeenCalledWith(
    expect.stringMatching(
      /\/host\/games\/new\?exploreTask=.*&challengeKind=secret$/,
    ),
  );
});
it("adds directly to one game with a guarded update", async () => {
  mocks.games.mockResolvedValue({ data: [game], error: null });
  const { result } = renderHook(() =>
    useExploreAddToGame({ navigate: vi.fn() }),
  );
  act(() => result.current.start(task, "main"));
  await waitFor(() => expect(result.current.notice).toContain("Added"));
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "one",
      status: "planned",
      updatedAt: "2030-01-01T00:00:00Z",
      plan: expect.objectContaining({ selectedMain: ["explore-idea"] }),
    }),
  );
  expect(result.current.choice).toBeNull();
});
it("rechecks an approved community challenge before adding it", async () => {
  mocks.games.mockResolvedValue({ data: [game], error: null });
  mocks.community.mockResolvedValue({
    data: {
      id: "approved",
      title: "Community",
      description: "Test",
      payload: { points: 12 },
      status: "approved",
    },
    error: null,
  });
  const { result } = renderHook(() =>
    useExploreAddToGame({ navigate: vi.fn() }),
  );
  act(() =>
    result.current.start({ ...task, id: "community-approved" }, "secret"),
  );
  await waitFor(() => expect(result.current.notice).toContain("Community"));
  expect(mocks.community).toHaveBeenCalledWith("approved");
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      plan: expect.objectContaining({
        selectedSecret: ["community-approved"],
        secretMissions: true,
      }),
    }),
  );
});
it("waits for a selection when there are multiple games and reports write conflicts", async () => {
  const other = { id: "two", name: "Two", status: "draft" as const };
  mocks.games.mockResolvedValue({ data: [game, other], error: null });
  mocks.update.mockResolvedValue({ data: null, error: null });
  const { result } = renderHook(() =>
    useExploreAddToGame({ navigate: vi.fn() }),
  );
  act(() => result.current.start(task, "side"));
  await waitFor(() => expect(result.current.games).toHaveLength(2));
  expect(mocks.update).not.toHaveBeenCalled();
  act(() => result.current.choose(other));
  await waitFor(() => expect(result.current.error).toContain("game changed"));
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({ id: "two" }),
  );
});
it("does not claim to update a game whose session already exists", async () => {
  mocks.games.mockResolvedValue({ data: [game], error: null });
  mocks.sessions.mockResolvedValue({ data: [{ id: "session" }], error: null });
  const { result } = renderHook(() =>
    useExploreAddToGame({ navigate: vi.fn() }),
  );
  act(() => result.current.start(task, "main"));
  await waitFor(() => expect(result.current.error).toContain("active session"));
  expect(mocks.update).not.toHaveBeenCalled();
});
it("does not start a write after the selection is cancelled during loading", async () => {
  let resolve: (value: {
    data: (typeof game)[];
    error: null;
  }) => void = () => {};
  mocks.games.mockReturnValue(
    new Promise((finish) => {
      resolve = finish;
    }),
  );
  const { result } = renderHook(() =>
    useExploreAddToGame({ navigate: vi.fn() }),
  );
  act(() => result.current.start(task, "main"));
  act(() => result.current.close());
  await act(async () => resolve({ data: [game], error: null }));
  expect(mocks.plan).not.toHaveBeenCalled();
});
