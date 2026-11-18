import { StrictMode } from "react";
import type { User } from "@supabase/supabase-js";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readHostIdentity } from "../../lib/hostAuth";
import { readHostFavourites } from "../../lib/hostSavedQueries";
import { removeHostFavourite } from "../../lib/hostSavedCommands";
import { useSavedItems } from "./useSavedItems";
import type { HostSavedItem } from "../../types/hostSaved";

vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: vi.fn() }));
vi.mock("../../lib/hostSavedQueries", () => ({ readHostFavourites: vi.fn() }));
vi.mock("../../lib/hostSavedCommands", () => ({
  removeHostFavourite: vi.fn(),
}));
type IdentityReply = Awaited<ReturnType<typeof readHostIdentity>>;
function identity(id: string): IdentityReply {
  const user: User = {
    id,
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2030-01-01T12:00:00Z",
  };
  return { data: { user }, error: null };
}
function deferredIdentity() {
  let resolve: (reply: IdentityReply) => void = () => {
    throw new Error("Identity request not initialized");
  };
  const promise = new Promise<IdentityReply>((complete) => {
    resolve = complete;
  });
  return { resolve, promise };
}
const item: HostSavedItem = {
  id: "saved-task",
  item_id: "task",
  item_type: "task",
  item_data: { title: "Task" },
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readHostFavourites).mockResolvedValue({
    data: [item],
    error: null,
  });
});
afterEach(cleanup);

it("does not start a saved-items query when identity resolves after unmount", async () => {
  const pending = deferredIdentity();
  vi.mocked(readHostIdentity).mockReturnValue(pending.promise);
  const { unmount } = renderHook(() => useSavedItems());
  unmount();
  await act(async () => {
    pending.resolve(identity("old-host"));
    await pending.promise;
  });
  expect(readHostFavourites).not.toHaveBeenCalled();
});

it("only the active StrictMode effect reads saved rows when old identity replies arrive later", async () => {
  const obsolete = deferredIdentity();
  const current = deferredIdentity();
  vi.mocked(readHostIdentity)
    .mockReturnValueOnce(obsolete.promise)
    .mockReturnValueOnce(current.promise);
  const { result } = renderHook(() => useSavedItems(), { wrapper: StrictMode });
  expect(readHostIdentity).toHaveBeenCalledTimes(2);
  await act(async () => {
    current.resolve(identity("current-host"));
    await current.promise;
  });
  expect(result.current.items).toEqual([item]);
  await act(async () => {
    obsolete.resolve(identity("old-host"));
    await obsolete.promise;
  });
  expect(readHostFavourites).toHaveBeenCalledExactlyOnceWith("current-host");
});

it("retains removal feedback when an obsolete identity reply would start a failing read", async () => {
  const obsolete = deferredIdentity();
  const current = deferredIdentity();
  vi.mocked(readHostIdentity)
    .mockReturnValueOnce(obsolete.promise)
    .mockReturnValueOnce(current.promise);
  vi.mocked(readHostFavourites)
    .mockResolvedValueOnce({ data: [item], error: null })
    .mockResolvedValueOnce({
      data: null,
      error: { message: "Obsolete read failed" },
    });
  vi.mocked(removeHostFavourite).mockResolvedValue({
    data: null,
    error: { message: "Removal blocked" },
  });
  const { result } = renderHook(() => useSavedItems(), { wrapper: StrictMode });
  await act(async () => {
    current.resolve(identity("current-host"));
    await current.promise;
  });
  await act(async () => {
    await result.current.remove(item);
  });
  expect(result.current.error).toBe("Removal blocked");
  await act(async () => {
    obsolete.resolve(identity("old-host"));
    await obsolete.promise;
  });
  expect(result.current.error).toBe("Removal blocked");
  expect(result.current.items).toEqual([item]);
});
