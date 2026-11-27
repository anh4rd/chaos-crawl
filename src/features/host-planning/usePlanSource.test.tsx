import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ApiResult } from "../../lib/apiResult";
import type { StoredPlan } from "../../types/hostPlanning";
import { usePlanFavourites } from "./usePlanFavourites";
import { usePlanSource } from "./usePlanSource";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  favourites: vi.fn(),
  plan: vi.fn(),
  community: vi.fn(),
}));
vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: mocks.identity }));
vi.mock("../../lib/hostPlanApi", () => ({
  readPlanFavourites: mocks.favourites,
  addPlanFavourite: vi.fn(),
  removePlanFavourite: vi.fn(),
  readHostPlan: mocks.plan,
  readApprovedPlanTask: mocks.community,
}));
function pending<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
function stored(id: string): StoredPlan {
  return {
    id,
    host_id: "host-one",
    name: id,
    event_date: "2030-01-01",
    start_time: null,
    end_time: null,
    player_count: 8,
    venue_name: null,
    plan_data: null,
  };
}
const setForm = vi.fn(),
  setStage = vi.fn(),
  setError = vi.fn(),
  setNotice = vi.fn();
const loadFavourites = async (hostId: string) => {
  await mocks.favourites(hostId);
};
const callbacks = { setForm, setStage, loadFavourites, setError, setNotice };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({
    data: { user: { id: "host-one" } },
    error: null,
  });
  mocks.favourites.mockResolvedValue({ data: [], error: null });
  mocks.plan.mockImplementation((id: string) =>
    Promise.resolve({ data: stored(id), error: null }),
  );
});
afterEach(cleanup);
it("uses the game owner's identity for a shared plan", async () => {
  mocks.plan.mockResolvedValue({
    data: { ...stored("shared"), host_id: "owner" },
    error: null,
  });
  const { result } = renderHook(() =>
    usePlanSource({
      id: "shared",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
    }),
  );
  await waitFor(() => expect(result.current.ownerId).toBe("owner"));
  expect(result.current.canChangeHostParticipation).toBe(false);
  expect(setForm).toHaveBeenCalledWith(
    expect.objectContaining({ hostParticipates: false }),
  );
});
it("does not restore an obsolete plan after switching plan identity", async () => {
  const old = pending<ApiResult<StoredPlan>>();
  mocks.plan.mockImplementation((id: string) =>
    id === "old"
      ? old.promise
      : Promise.resolve({ data: stored(id), error: null }),
  );
  const { rerender } = renderHook(
    ({ id }) =>
      usePlanSource({
        id,
        communityTaskId: null,
        exploreTaskJson: null,
        requestedChallengeKind: "main",
        ...callbacks,
      }),
    { initialProps: { id: "old" } },
  );
  await waitFor(() => expect(mocks.plan).toHaveBeenCalledWith("old"));
  rerender({ id: "new" });
  await waitFor(() =>
    expect(setForm).toHaveBeenCalledWith(
      expect.objectContaining({ name: "new" }),
    ),
  );
  await act(async () => {
    old.resolve({ data: stored("old"), error: null });
    await old.promise;
  });
  expect(setForm).toHaveBeenCalledTimes(1);
  expect(setForm).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: "new" }),
  );
});
it("does not begin plan queries if authentication resolves after unmount", async () => {
  const old = pending<{ data: { user: { id: string } }; error: null }>();
  mocks.identity.mockReturnValue(old.promise);
  const { unmount } = renderHook(() =>
    usePlanSource({
      id: "old",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
    }),
  );
  unmount();
  await act(async () => {
    old.resolve({ data: { user: { id: "host-one" } }, error: null });
    await old.promise;
  });
  expect(mocks.favourites).not.toHaveBeenCalled();
  expect(mocks.plan).not.toHaveBeenCalled();
});
it("does not begin the plan read if favourites resolve after unmount", async () => {
  const old = pending<ApiResult<[]>>();
  mocks.favourites.mockReturnValue(old.promise);
  const { unmount } = renderHook(() =>
    usePlanSource({
      id: "old",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
    }),
  );
  await waitFor(() => expect(mocks.favourites).toHaveBeenCalledTimes(1));
  unmount();
  await act(async () => {
    old.resolve({ data: [], error: null });
    await old.promise;
  });
  expect(mocks.plan).not.toHaveBeenCalled();
});
it("reports unavailable favourites while continuing independent plan hydration", async () => {
  mocks.favourites.mockResolvedValueOnce({
    data: null,
    error: { message: "Saved collection unavailable" },
  });
  const { result } = renderHook(() => {
    const favourites = usePlanFavourites({ setError });
    const source = usePlanSource({
      id: "current",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
      loadFavourites: favourites.loadFavourites,
    });
    return { ...source, ...favourites };
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.favouritesAvailable).toBe(false);
  expect(result.current.favouritesError).toContain(
    "Couldn't load your favourites",
  );
  expect(setForm).toHaveBeenCalledWith(
    expect.objectContaining({ name: "current" }),
  );
  await act(async () => {
    await result.current.reloadFavourites();
  });
  expect(result.current.favouritesAvailable).toBe(true);
  expect(mocks.plan).toHaveBeenCalledTimes(1);
  expect(setForm).toHaveBeenCalledTimes(1);
});

it("settles rejected identity recovery and reloads the same plan explicitly", async () => {
  mocks.identity.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() =>
    usePlanSource({
      id: "current",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
    }),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(setError).toHaveBeenCalledWith(expect.stringContaining("session"));
  expect(mocks.plan).not.toHaveBeenCalled();
  act(() => result.current.reload());
  await waitFor(() =>
    expect(setForm).toHaveBeenCalledWith(
      expect.objectContaining({ name: "current" }),
    ),
  );
});
it("settles a rejected plan query without replacing the current draft", async () => {
  mocks.plan.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() =>
    usePlanSource({
      id: "current",
      communityTaskId: null,
      exploreTaskJson: null,
      requestedChallengeKind: "main",
      ...callbacks,
    }),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(setError).toHaveBeenCalledWith("Couldn't load this game plan.");
  expect(setForm).not.toHaveBeenCalled();
});
