import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostSessionFixture } from "./testFixtures";
import { useHostPlan } from "./useHostPlan";
const read = vi.hoisted(() => vi.fn());
vi.mock("../../lib/sessionSupabase", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: read }) }) }),
  },
}));
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
it("projects malformed persisted values before they reach live presentation", async () => {
  read.mockResolvedValue({
    data: {
      plan_data: {
        gamePhotoUrl: 42,
        teamPhotoUrls: { valid: "photo.jpg", invalid: {} },
        selectedTasks: [
          null,
          { id: "bad", equipment: [42] },
          { id: "good", title: "Ready", equipment: ["Hat"] },
        ],
        schedule: [
          null,
          { type: "break", title: "Rest", duration: 5 },
          { type: "bad", title: 42, duration: "oops" },
        ],
      },
    },
    error: null,
  });
  const { result } = renderHook(() =>
    useHostPlan({ session: hostSessionFixture() }),
  );
  await waitFor(() =>
    expect(result.current.plannedTasks).toEqual([
      { id: "good", title: "Ready", equipment: ["Hat"] },
    ]),
  );
  expect(result.current.gamePhotoUrl).toBeNull();
  expect(result.current.teamPhotoUrls).toEqual({ valid: "photo.jpg" });
  expect(result.current.gameSchedule).toEqual([
    { type: "break", title: "Rest", duration: 5 },
  ]);
});
it("reports an initial failed read without inventing plan data", async () => {
  read.mockResolvedValue({
    data: null,
    error: { message: "Plan unavailable" },
  });
  const { result } = renderHook(() =>
    useHostPlan({ session: hostSessionFixture() }),
  );
  await waitFor(() => expect(result.current.error).toBe("Plan unavailable"));
  expect(result.current.loading).toBe(false);
  expect(result.current.plannedTasks).toEqual([]);
});
it("does not expose the prior plan when the host-game identity changes", async () => {
  read.mockResolvedValueOnce({
    data: {
      plan_data: { gamePhotoUrl: "old.jpg", selectedTasks: [{ id: "old" }] },
    },
    error: null,
  });
  let finish: (value: unknown) => void = () => {};
  read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result, rerender } = renderHook(
    ({ id }) =>
      useHostPlan({ session: hostSessionFixture({ host_game_id: id }) }),
    { initialProps: { id: "old" } },
  );
  await waitFor(() => expect(result.current.gamePhotoUrl).toBe("old.jpg"));
  rerender({ id: "new" });
  expect(result.current.gamePhotoUrl).toBeNull();
  expect(result.current.plannedTasks).toEqual([]);
  await act(async () =>
    finish({
      data: { plan_data: { selectedTasks: [{ title: "New" }] } },
      error: null,
    }),
  );
  await waitFor(() =>
    expect(result.current.plannedTasks).toEqual([{ title: "New" }]),
  );
});

it("recovers a rejected read and keeps a later identity safe from obsolete rejection", async () => {
  read.mockRejectedValueOnce(new Error("Offline"));
  const initialProps: { id: string | null } = { id: "first" };
  const { result, rerender, unmount } = renderHook(
    ({ id }: { id: string | null }) =>
      useHostPlan({ session: hostSessionFixture({ host_game_id: id }) }),
    { initialProps },
  );
  await waitFor(() => expect(result.current.error).toBe("Offline"));
  let reject: (reason: Error) => void = () => {};
  read.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  let obsolete: Promise<void> | undefined;
  act(() => {
    obsolete = result.current.reload();
  });
  read.mockResolvedValueOnce({
    data: {
      plan_data: {
        selectedTasks: [{ id: "current" }],
        breakMinutes: "2.5",
        autoplay: true,
      },
    },
    error: null,
  });
  rerender({ id: "second" });
  await waitFor(() =>
    expect(result.current.plannedTasks).toEqual([{ id: "current" }]),
  );
  await act(async () => {
    reject(new Error("Old failure"));
    await obsolete;
  });
  expect(result.current.error).toBe("");
  expect(result.current.defaultBreakMinutes).toBe(2.5);
  expect(result.current.autoplayEnabled).toBe(true);
  rerender({ id: null });
  expect(result.current.plannedTasks).toEqual([]);
  expect(result.current.loading).toBe(false);
  unmount();
});
it("retries current failures and ignores completion after unmount", async () => {
  read.mockResolvedValueOnce({ data: null, error: { message: "Failed" } });
  const { result, unmount } = renderHook(() =>
    useHostPlan({ session: hostSessionFixture() }),
  );
  await waitFor(() => expect(result.current.error).toBe("Failed"));
  read.mockResolvedValueOnce({
    data: { plan_data: { gamePhotoUrl: "current.jpg" } },
    error: null,
  });
  await act(async () => {
    await result.current.reload();
  });
  expect(result.current.gamePhotoUrl).toBe("current.jpg");
  expect(result.current.error).toBe("");
  let finish: (value: unknown) => void = () => {};
  read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending: Promise<void> | undefined;
  act(() => {
    pending = result.current.reload();
  });
  unmount();
  await act(async () => {
    finish({ data: { plan_data: { gamePhotoUrl: "late.jpg" } }, error: null });
    await pending;
  });
  expect(result.current.gamePhotoUrl).toBe("current.jpg");
});
