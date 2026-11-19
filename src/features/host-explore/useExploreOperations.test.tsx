import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useExploreFavourites } from "./useExploreFavourites";
import { useExploreModeration } from "./useExploreModeration";
import { readHostIdentity } from "../../lib/hostAuth";
import { readExploreFavourites } from "../../lib/hostExploreQueries";
import {
  deleteApprovedCommunityChallenge,
  reviewPendingCommunitySubmission,
  saveExploreFavourite,
} from "../../lib/hostExploreCommands";
import { removeHostFavourite } from "../../lib/hostSavedCommands";
import type { ApiResult } from "../../lib/apiResult";
import type {
  CommunitySubmission,
  HostFavourite,
} from "../../types/hostExplore";
import type { CatalogTask } from "./types";

vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: vi.fn() }));
vi.mock("../../lib/hostExploreQueries", () => ({
  readExploreFavourites: vi.fn(),
}));
vi.mock("../../lib/hostExploreCommands", () => ({
  saveExploreFavourite: vi.fn(),
  deleteApprovedCommunityChallenge: vi.fn(),
  reviewPendingCommunitySubmission: vi.fn(),
}));
vi.mock("../../lib/hostSavedCommands", () => ({
  removeHostFavourite: vi.fn(),
}));

function identity(): Awaited<ReturnType<typeof readHostIdentity>> {
  const user: User = {
    id: "host",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2030-01-01T12:00:00Z",
  };
  return { data: { user }, error: null };
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred operation not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
function task(id = "first"): CatalogTask {
  return {
    id,
    title: id,
    description: "Build together.",
    kind: "main",
    points: 10,
    minutes: 5,
    tags: [],
    setup: "none",
  };
}
function favourite(id = "first"): HostFavourite {
  return { id: `saved-${id}`, item_type: "task", item_id: id, item_data: {} };
}
function submission(id = "first"): CommunitySubmission {
  return {
    id,
    item_type: "challenge",
    title: id,
    description: "Build together.",
    payload: {},
    status: "pending",
    submitted_by: "host",
    review_note: null,
    created_at: "2030-01-01T12:00:00Z",
  };
}
function feedback() {
  return {
    onActionStart: vi.fn(),
    onActionError: vi.fn(),
    onQueryError: vi.fn(),
  };
}
async function favourites() {
  const notices = feedback();
  const hook = renderHook(() => useExploreFavourites(notices));
  await waitFor(() =>
    expect(hook.result.current.loadingFavourites).toBe(false),
  );
  return { ...hook, notices };
}
function moderation() {
  const notices = feedback();
  const loadSubmissions = vi.fn<() => Promise<void>>().mockResolvedValue();
  return {
    ...renderHook(() =>
      useExploreModeration({
        ...notices,
        isPlatformAdmin: true,
        loadSubmissions,
      }),
    ),
    notices,
    loadSubmissions,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readHostIdentity).mockResolvedValue(identity());
  vi.mocked(readExploreFavourites).mockResolvedValue({ data: [], error: null });
  vi.mocked(saveExploreFavourite).mockImplementation(async ({ itemId }) => ({
    data: favourite(itemId),
    error: null,
  }));
  vi.mocked(removeHostFavourite).mockResolvedValue({ data: null, error: null });
  vi.mocked(reviewPendingCommunitySubmission).mockResolvedValue({
    data: null,
    error: null,
  });
  vi.mocked(deleteApprovedCommunityChallenge).mockResolvedValue({
    data: null,
    error: null,
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(cleanup);

it("locks a repeated favourite synchronously before identity resolves", async () => {
  const { result, notices } = await favourites();
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  let first = Promise.resolve();
  let repeat = Promise.resolve();
  act(() => {
    first = result.current.toggleFavourite("task", "first", task());
    repeat = result.current.toggleFavourite("task", "first", task());
  });
  expect(readHostIdentity).toHaveBeenCalledTimes(2);
  expect(notices.onActionStart).toHaveBeenCalledTimes(1);
  await act(async () => {
    auth.resolve(identity());
    await Promise.all([first, repeat]);
  });
  expect(saveExploreFavourite).toHaveBeenCalledTimes(1);
  expect(result.current.isSaved("task", "first")).toBe(true);
});

it("locks repeated favourite removal without sending a second delete", async () => {
  vi.mocked(readExploreFavourites).mockResolvedValue({
    data: [favourite()],
    error: null,
  });
  const { result } = await favourites();
  const deletion = deferred<ApiResult<unknown>>();
  vi.mocked(removeHostFavourite).mockReturnValue(deletion.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.toggleFavourite("task", "first", task());
    void result.current.toggleFavourite("task", "first", task());
  });
  expect(removeHostFavourite).toHaveBeenCalledTimes(1);
  await act(async () => {
    deletion.resolve({ data: null, error: null });
    await operation;
  });
  expect(result.current.isSaved("task", "first")).toBe(false);
});

it("a retained favourite callback uses the latest saved record after completion", async () => {
  const { result } = await favourites();
  const toggle = result.current.toggleFavourite;
  await act(async () => {
    await toggle("task", "first", task());
  });
  await act(async () => {
    await toggle("task", "first", task());
  });
  expect(saveExploreFavourite).toHaveBeenCalledTimes(1);
  expect(removeHostFavourite).toHaveBeenCalledExactlyOnceWith({
    id: "saved-first",
  });
  expect(result.current.isSaved("task", "first")).toBe(false);
});

it("favourite identity rejection releases its lock and allows retry", async () => {
  const { result, notices } = await favourites();
  vi.mocked(readHostIdentity).mockRejectedValueOnce(
    new Error("Identity unavailable"),
  );
  await act(async () => {
    await expect(
      result.current.toggleFavourite("task", "first", task()),
    ).resolves.toBeUndefined();
  });
  expect(notices.onActionError).toHaveBeenCalledWith("Identity unavailable");
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  expect(result.current.isSaved("task", "first")).toBe(true);
});

it("distinct favourites can complete out of order without losing either saved record", async () => {
  const { result } = await favourites();
  const first = deferred<ApiResult<HostFavourite>>();
  const second = deferred<ApiResult<HostFavourite>>();
  vi.mocked(saveExploreFavourite).mockImplementation(({ itemId }) =>
    itemId === "first" ? first.promise : second.promise,
  );
  let a = Promise.resolve();
  let b = Promise.resolve();
  act(() => {
    a = result.current.toggleFavourite("task", "first", task());
    b = result.current.toggleFavourite("task", "second", task("second"));
  });
  await waitFor(() => expect(saveExploreFavourite).toHaveBeenCalledTimes(2));
  expect(result.current.isFavouriteBusy("task", "first")).toBe(true);
  expect(result.current.isFavouriteBusy("task", "second")).toBe(true);
  await act(async () => {
    second.resolve({ data: favourite("second"), error: null });
    await b;
  });
  expect(result.current.isFavouriteBusy("task", "first")).toBe(true);
  expect(result.current.isFavouriteBusy("task", "second")).toBe(false);
  await act(async () => {
    first.resolve({ data: favourite(), error: null });
    await a;
  });
  expect(result.current.isSaved("task", "first")).toBe(true);
  expect(result.current.isSaved("task", "second")).toBe(true);
  expect(result.current.isFavouriteBusy("task", "first")).toBe(false);
  expect(result.current.isFavouriteBusy("task", "second")).toBe(false);
});

it("obsolete favourite identity cannot start a save or publish feedback", async () => {
  const { result, unmount, notices } = await favourites();
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.toggleFavourite("task", "first", task());
  });
  unmount();
  await act(async () => {
    auth.resolve(identity());
    await operation;
  });
  expect(saveExploreFavourite).not.toHaveBeenCalled();
  expect(notices.onActionError).not.toHaveBeenCalled();
});

it("opposite review decisions share a synchronous record lock before identity resolves", async () => {
  const { result, notices } = moderation();
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.reviewSubmission(submission(), "approved");
    void result.current.reviewSubmission(submission(), "rejected");
  });
  expect(readHostIdentity).toHaveBeenCalledTimes(1);
  expect(notices.onActionStart).toHaveBeenCalledTimes(1);
  await act(async () => {
    auth.resolve(identity());
    await operation;
  });
  expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(1);
  expect(reviewPendingCommunitySubmission).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "first",
      status: "approved",
      reviewedBy: "host",
    }),
  );
});

it("review and delete cannot write the same record concurrently", async () => {
  const { result } = moderation();
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.reviewSubmission(submission(), "approved");
    void result.current.deleteCommunityChallenge(submission());
  });
  expect(window.confirm).not.toHaveBeenCalled();
  expect(deleteApprovedCommunityChallenge).not.toHaveBeenCalled();
  await act(async () => {
    auth.resolve(identity());
    await operation;
  });
});

it("repeated approved challenge deletion confirms and writes only once", async () => {
  const { result } = moderation();
  const deletion = deferred<ApiResult<unknown>>();
  vi.mocked(deleteApprovedCommunityChallenge).mockReturnValue(deletion.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.deleteCommunityChallenge(submission());
    void result.current.deleteCommunityChallenge(submission());
  });
  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(deleteApprovedCommunityChallenge).toHaveBeenCalledTimes(1);
  await act(async () => {
    deletion.resolve({ data: null, error: null });
    await operation;
  });
});

it("review remains locked through its refresh and then permits a fresh retry", async () => {
  const { result, loadSubmissions } = moderation();
  const reload = deferred<void>();
  loadSubmissions.mockReturnValueOnce(reload.promise);
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.reviewSubmission(submission(), "approved");
  });
  await waitFor(() => expect(loadSubmissions).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.reviewSubmission(submission(), "rejected");
  });
  expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(1);
  await act(async () => {
    reload.resolve();
    await operation;
  });
  await act(async () => {
    await result.current.reviewSubmission(submission(), "rejected");
  });
  expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(2);
});

it("review identity rejection reports feedback and releases the record for retry", async () => {
  const { result, notices } = moderation();
  vi.mocked(readHostIdentity).mockRejectedValueOnce(
    new Error("Identity unavailable"),
  );
  await act(async () => {
    await expect(
      result.current.reviewSubmission(submission(), "approved"),
    ).resolves.toBeUndefined();
  });
  expect(notices.onActionError).toHaveBeenCalledWith("Identity unavailable");
  await act(async () => {
    await result.current.reviewSubmission(submission(), "approved");
  });
  expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(1);
});

it("obsolete moderation completion cannot reload or publish failed action feedback", async () => {
  const { result, unmount, loadSubmissions, notices } = moderation();
  const update = deferred<ApiResult<unknown>>();
  vi.mocked(reviewPendingCommunitySubmission).mockReturnValueOnce(
    update.promise,
  );
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.reviewSubmission(submission(), "approved");
  });
  await waitFor(() =>
    expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(1),
  );
  unmount();
  await act(async () => {
    update.resolve({ data: null, error: { message: "Obsolete failure" } });
    await operation;
  });
  expect(loadSubmissions).not.toHaveBeenCalled();
  expect(notices.onActionError).not.toHaveBeenCalled();
});

it("distinct moderation records retain independent busy lifetimes and failed feedback", async () => {
  const { result, notices, loadSubmissions } = moderation();
  const first = deferred<ApiResult<unknown>>();
  const second = deferred<ApiResult<unknown>>();
  vi.mocked(reviewPendingCommunitySubmission).mockImplementation(({ id }) =>
    id === "first" ? first.promise : second.promise,
  );
  let a = Promise.resolve();
  let b = Promise.resolve();
  act(() => {
    a = result.current.reviewSubmission(submission(), "approved");
    b = result.current.reviewSubmission(submission("second"), "rejected");
  });
  await waitFor(() =>
    expect(reviewPendingCommunitySubmission).toHaveBeenCalledTimes(2),
  );
  expect(result.current.isReviewing("first")).toBe(true);
  expect(result.current.isReviewing("second")).toBe(true);
  await act(async () => {
    first.resolve({ data: null, error: { message: "First review failed" } });
    await a;
  });
  expect(result.current.isReviewing("first")).toBe(false);
  expect(result.current.isReviewing("second")).toBe(true);
  await act(async () => {
    second.resolve({ data: null, error: null });
    await b;
  });
  expect(result.current.isReviewing("second")).toBe(false);
  expect(loadSubmissions).toHaveBeenCalledTimes(1);
  expect(notices.onActionError).toHaveBeenCalledExactlyOnceWith(
    "First review failed",
  );
});
