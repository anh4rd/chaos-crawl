import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ApiResult } from "../../lib/apiResult";
import { defaultForm, taskLibrary } from "./catalog";
import { usePlanSave } from "./usePlanSave";
import { usePlanPhoto } from "./usePlanPhoto";
import { usePlanFavourites } from "./usePlanFavourites";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  url: vi.fn(),
  addFavourite: vi.fn(),
  removeFavourite: vi.fn(),
  readFavourites: vi.fn(),
}));
vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: mocks.identity }));
vi.mock("../../lib/hostPlanApi", () => ({
  createHostPlan: mocks.create,
  updateHostPlan: mocks.update,
  uploadPlanCover: mocks.upload,
  planCoverUrl: mocks.url,
  addPlanFavourite: mocks.addFavourite,
  removePlanFavourite: mocks.removeFavourite,
  readPlanFavourites: mocks.readFavourites,
}));
function pending<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
const setError = vi.fn(),
  setNotice = vi.fn(),
  navigate = vi.fn();
const form = { ...defaultForm, name: "Saved plan" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({
    data: { user: { id: "host-one" } },
    error: null,
  });
  mocks.readFavourites.mockResolvedValue({ data: [], error: null });
  mocks.create.mockResolvedValue({ data: { id: "saved-plan" }, error: null });
  mocks.upload.mockResolvedValue({ data: null, error: null });
  mocks.url.mockReturnValue("https://example.test/cover.png");
});
afterEach(cleanup);
it("serializes repeated save activations into one database write", async () => {
  const deferred = pending<ApiResult<{ id: string }>>();
  mocks.create.mockReturnValue(deferred.promise);
  const { result } = renderHook(() =>
    usePlanSave({ form, navigate, setError, setNotice }),
  );
  let first = Promise.resolve(),
    second = Promise.resolve();
  await act(async () => {
    first = result.current.save("draft");
    second = result.current.save("draft");
  });
  expect(mocks.create).toHaveBeenCalledTimes(1);
  await act(async () => {
    deferred.resolve({ data: { id: "saved-plan" }, error: null });
    await Promise.all([first, second]);
  });
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(result.current.saving).toBe(false);
});
it("does not navigate when an obsolete save completes after unmount", async () => {
  const deferred = pending<ApiResult<{ id: string }>>();
  mocks.create.mockReturnValue(deferred.promise);
  const { result, unmount } = renderHook(() =>
    usePlanSave({ form, navigate, setError, setNotice }),
  );
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.save("draft");
  });
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  unmount();
  await act(async () => {
    deferred.resolve({ data: { id: "saved-plan" }, error: null });
    await operation;
  });
  expect(navigate).not.toHaveBeenCalled();
});
it("blocks invalid planned saves before authentication or writes", async () => {
  const { result } = renderHook(() =>
    usePlanSave({ form, navigate, setError, setNotice }),
  );
  await act(async () => {
    await result.current.save("planned");
  });
  expect(setError).toHaveBeenCalledWith(
    "Add at least one main challenge to the Schedule.",
  );
  expect(mocks.identity).not.toHaveBeenCalled();
  expect(mocks.create).not.toHaveBeenCalled();
});
it("ignores an uploaded cover after the plan identity changes", async () => {
  const deferred = pending<ApiResult<unknown>>();
  mocks.upload.mockReturnValue(deferred.promise);
  const update = vi.fn();
  const { result, rerender } = renderHook(
    ({ id }) => usePlanPhoto({ id, update, setError, setNotice }),
    { initialProps: { id: "old" } },
  );
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.uploadGamePhoto(
      new File(["image"], "cover.png", { type: "image/png" }),
    );
  });
  await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
  rerender({ id: "new" });
  await act(async () => {
    deferred.resolve({ data: null, error: null });
    await operation;
  });
  expect(update).not.toHaveBeenCalled();
  expect(setNotice).not.toHaveBeenCalled();
});
it("prevents duplicate favourite inserts while the first one is pending", async () => {
  const task = taskLibrary[0];
  const deferred =
    pending<ApiResult<{ id: string; item_type: "task"; item_id: string }>>();
  mocks.addFavourite.mockReturnValue(deferred.promise);
  const { result } = renderHook(() => usePlanFavourites({ setError }));
  await act(async () => {
    await result.current.loadFavourites("host-one");
  });
  let first = Promise.resolve(),
    second = Promise.resolve();
  await act(async () => {
    first = result.current.toggleFavourite(task);
    second = result.current.toggleFavourite(task);
  });
  expect(mocks.addFavourite).toHaveBeenCalledTimes(1);
  await act(async () => {
    deferred.resolve({
      data: { id: "fav-one", item_type: "task", item_id: task.id },
      error: null,
    });
    await Promise.all([first, second]);
  });
  expect(result.current.favourites).toHaveLength(1);
});

it("updates the explicit plan and owner targets without placing host_id in update values", async () => {
  mocks.update.mockResolvedValue({ data: null, error: null });
  const { result } = renderHook(() =>
    usePlanSave({ form, id: "saved-plan-11", navigate, setError, setNotice }),
  );
  await act(async () => {
    await result.current.save("draft");
  });
  expect(mocks.update).toHaveBeenCalledWith({
    hostGameId: "saved-plan-11",
    hostId: "host-one",
    values: expect.objectContaining({ name: "Saved plan", status: "draft" }),
  });
  expect(mocks.update.mock.calls[0]?.[0]?.values).not.toHaveProperty("host_id");
  expect(mocks.create).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
  expect(setNotice).toHaveBeenLastCalledWith("Draft saved.");
});
