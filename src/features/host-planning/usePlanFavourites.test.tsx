import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runApi } from "../../lib/apiResult";
import { usePlanFavourites } from "./usePlanFavourites";
import type { Task } from "./types";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  read: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  report: vi.fn(),
}));
vi.mock("../../lib/monitoring", () => ({ reportError: mocks.report }));
vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: mocks.identity }));
vi.mock("../../lib/hostPlanApi", () => ({
  readPlanFavourites: mocks.read,
  addPlanFavourite: mocks.add,
  removePlanFavourite: mocks.remove,
}));
const task: Task = {
  id: "task",
  title: "Task",
  description: "",
  points: 10,
  kind: "main",
  minutes: 5,
  vibe: [],
  accessibility: [],
  equipment: [],
  setup: "",
  prep: "",
  evidenceRequired: false,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({
    data: { user: { id: "host" } },
    error: null,
  });
  mocks.add.mockResolvedValue({ data: null, error: null });
  mocks.remove.mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);
it("blocks an unknown collection, preserves its snapshot on failure and recovers before choosing delete", async () => {
  const setError = vi.fn();
  const { result } = renderHook(() => usePlanFavourites({ setError }));
  await act(async () => {
    await result.current.toggleFavourite(task);
  });
  expect(mocks.add).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
  mocks.read.mockResolvedValueOnce({
    data: null,
    error: { message: "Offline" },
  });
  await act(async () => {
    await result.current.loadFavourites("host");
  });
  expect(result.current.favouritesAvailable).toBe(false);
  mocks.read.mockResolvedValueOnce({
    data: [{ id: "saved", item_type: "task", item_id: "task", item_data: {} }],
    error: null,
  });
  await act(async () => {
    await result.current.reloadFavourites();
  });
  expect(result.current.favouritesAvailable).toBe(true);
  mocks.read.mockRejectedValueOnce(new Error("Offline again"));
  await act(async () => {
    await result.current.reloadFavourites();
  });
  expect(result.current.favourites).toHaveLength(1);
  expect(result.current.favouritesAvailable).toBe(false);
  mocks.read.mockResolvedValueOnce({
    data: [{ id: "saved", item_type: "task", item_id: "task", item_data: {} }],
    error: null,
  });
  await act(async () => {
    await result.current.reloadFavourites();
  });
  await act(async () => {
    await result.current.toggleFavourite(task);
  });
  expect(mocks.add).not.toHaveBeenCalled();
  expect(mocks.remove).toHaveBeenCalledWith("saved");
});
it("ignores an obsolete failed collection read after a newer successful load", async () => {
  let finish: (value: {
    data: null;
    error: { message: string };
  }) => void = () => {};
  mocks.read
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    )
    .mockResolvedValueOnce({ data: [], error: null });
  const { result } = renderHook(() => usePlanFavourites({ setError: vi.fn() }));
  let old: Promise<void> = Promise.resolve();
  act(() => {
    old = result.current.loadFavourites("old");
  });
  await act(async () => {
    await result.current.loadFavourites("current");
  });
  await act(async () => {
    finish({ data: null, error: { message: "Obsolete" } });
    await old;
  });
  expect(result.current.favouritesAvailable).toBe(true);
  expect(result.current.favouritesError).toBe("");
});
it("ignores identity rejection after favourite retry unmount", async () => {
  let fail: (reason: Error) => void = () => {};
  mocks.identity.mockReturnValueOnce(
    new Promise((_resolve, reject) => {
      fail = reject;
    }),
  );
  const setError = vi.fn();
  const { result, unmount } = renderHook(() => usePlanFavourites({ setError }));
  let retry: Promise<void> = Promise.resolve();
  act(() => {
    retry = result.current.reloadFavourites();
  });
  unmount();
  await act(async () => {
    fail(new Error("Late failure"));
    await retry;
  });
  expect(mocks.read).not.toHaveBeenCalled();
  expect(setError).not.toHaveBeenCalled();
});

it.each(["read", "add", "remove"] as const)(
  "reports a normalized %s failure once and catches unexpected rejection once",
  async (stage) => {
    for (const mode of ["returned", "rejected"] as const) {
      mocks.report.mockClear();
      const cause = new Error(`${stage} unavailable`);
      const fail = () =>
        mode === "returned"
          ? runApi(async () => ({ data: null, error: cause }))
          : Promise.reject(cause);
      const { result, unmount } = renderHook(() =>
        usePlanFavourites({ setError: vi.fn() }),
      );
      if (stage === "read") {
        mocks.read.mockImplementationOnce(fail);
        await act(async () => {
          await result.current.loadFavourites("host");
        });
      } else {
        mocks.read.mockResolvedValueOnce({
          data:
            stage === "remove"
              ? [{ id: "saved", item_type: "task", item_id: "task" }]
              : [],
          error: null,
        });
        await act(async () => {
          await result.current.loadFavourites("host");
        });
        mocks[stage].mockImplementationOnce(fail);
        await act(async () => {
          await result.current.toggleFavourite(task);
        });
      }
      expect(mocks.report).toHaveBeenCalledTimes(1);
      expect(mocks.report).toHaveBeenCalledWith(cause, "api");
      unmount();
    }
  },
);
