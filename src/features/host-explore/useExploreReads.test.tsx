import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { AuthError, type User } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useExploreFavourites } from "./useExploreFavourites";
import { useExploreCommunity } from "./useExploreCommunity";
import { readHostIdentity } from "../../lib/hostAuth";
import { readPlatformAdmin } from "../../lib/hostHubQueries";
import {
  readCommunitySubmissions,
  readExploreFavourites,
} from "../../lib/hostExploreQueries";
import { saveExploreFavourite } from "../../lib/hostExploreCommands";
import { removeHostFavourite } from "../../lib/hostSavedCommands";
import type { ApiResult } from "../../lib/apiResult";
import type {
  CommunitySubmission,
  HostFavourite,
} from "../../types/hostExplore";
import type { CatalogTask } from "./types";

vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: vi.fn() }));
vi.mock("../../lib/hostHubQueries", () => ({ readPlatformAdmin: vi.fn() }));
vi.mock("../../lib/hostExploreQueries", () => ({
  readCommunitySubmissions: vi.fn(),
  readExploreFavourites: vi.fn(),
}));
vi.mock("../../lib/hostExploreCommands", () => ({
  saveExploreFavourite: vi.fn(),
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
    throw new Error("Deferred read not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Deferred read not initialized");
  };
  const promise = new Promise<T>((complete, fail) => {
    resolve = complete;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function favourite(id = "first"): HostFavourite {
  return { id: `saved-${id}`, item_type: "task", item_id: id, item_data: {} };
}
function task(): CatalogTask {
  return {
    id: "first",
    title: "First",
    description: "Build together.",
    kind: "main",
    points: 10,
    minutes: 5,
    tags: [],
    setup: "none",
  };
}
function approved(): CommunitySubmission {
  return {
    id: "approved",
    item_type: "challenge",
    title: "Approved public challenge",
    description: "Build together.",
    payload: {},
    status: "approved",
    submitted_by: "host",
    review_note: null,
    created_at: "2030-01-01T12:00:00Z",
  };
}
function cachedSubmissions(): CommunitySubmission[] {
  return [
    approved(),
    { ...approved(), id: "pending", status: "pending" },
    { ...approved(), id: "rejected", status: "rejected" },
  ];
}

function favourites() {
  const notices = {
    onQueryError: vi.fn(),
    onActionStart: vi.fn(),
    onActionError: vi.fn(),
  };
  return { ...renderHook(() => useExploreFavourites(notices)), notices };
}
async function community() {
  const onQueryError = vi.fn();
  const hook = renderHook(() => useExploreCommunity(onQueryError));
  await waitFor(() =>
    expect(hook.result.current.submissions).toEqual(cachedSubmissions()),
  );
  return { ...hook, onQueryError };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readHostIdentity).mockResolvedValue(identity());
  vi.mocked(readPlatformAdmin).mockResolvedValue({ data: true, error: null });
  vi.mocked(readCommunitySubmissions).mockResolvedValue({
    data: cachedSubmissions(),
    error: null,
  });
  vi.mocked(readExploreFavourites).mockResolvedValue({ data: [], error: null });
  vi.mocked(saveExploreFavourite).mockResolvedValue({
    data: favourite(),
    error: null,
  });
  vi.mocked(removeHostFavourite).mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

it("a rejected initial favourite identity settles loading and reports query feedback", async () => {
  vi.mocked(readHostIdentity).mockRejectedValueOnce(
    new Error("Identity unavailable"),
  );
  const { result, notices } = favourites();
  await waitFor(() => expect(result.current.loadingFavourites).toBe(false));
  expect(notices.onQueryError).toHaveBeenCalledExactlyOnceWith(
    "Identity unavailable",
  );
  expect(readExploreFavourites).not.toHaveBeenCalled();
  expect(notices.onActionError).not.toHaveBeenCalled();
});

it("an obsolete favourite identity rejection does not publish feedback", async () => {
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  const { unmount, notices } = favourites();
  unmount();
  await act(async () => {
    auth.reject(new Error("Obsolete identity"));
    await auth.promise.catch(() => {});
  });
  expect(readExploreFavourites).not.toHaveBeenCalled();
  expect(notices.onQueryError).not.toHaveBeenCalled();
  expect(notices.onActionError).not.toHaveBeenCalled();
});

it("a rejected community identity clears previous private presentation and resolves reload", async () => {
  const { result, onQueryError } = await community();
  expect(result.current.isPlatformAdmin).toBe(true);
  expect(result.current.submissions).toEqual(cachedSubmissions());
  vi.mocked(readHostIdentity).mockRejectedValueOnce(
    new Error("Identity unavailable"),
  );
  await act(async () => {
    await expect(result.current.loadSubmissions()).resolves.toBeUndefined();
  });
  expect(result.current.currentUserId).toBeNull();
  expect(result.current.isPlatformAdmin).toBe(false);
  expect(result.current.submissions).toEqual([approved()]);
  expect(onQueryError).toHaveBeenCalledExactlyOnceWith("Identity unavailable");
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
  await act(async () => {
    await result.current.loadSubmissions();
  });
  expect(result.current.currentUserId).toBe("host");
  expect(result.current.isPlatformAdmin).toBe(true);
  expect(result.current.submissions).toEqual(cachedSubmissions());
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(2);
});

it("missing community identity cannot retain prior admin controls even when the independent admin result is true", async () => {
  const { result, onQueryError } = await community();
  vi.mocked(readHostIdentity).mockResolvedValueOnce({
    data: { user: null },
    error: new AuthError("Expired"),
  });
  await act(async () => {
    await result.current.loadSubmissions();
  });
  expect(result.current.currentUserId).toBeNull();
  expect(result.current.isPlatformAdmin).toBe(false);
  expect(result.current.submissions).toEqual([approved()]);
  expect(onQueryError).toHaveBeenCalledExactlyOnceWith(
    "Your session has expired. Please log in again.",
  );
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it("an obsolete rejected community reload cannot clear identity or publish feedback", async () => {
  const { result, unmount, onQueryError } = await community();
  const auth = deferred<Awaited<ReturnType<typeof readHostIdentity>>>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(auth.promise);
  const reload = result.current.loadSubmissions();
  unmount();
  await act(async () => {
    auth.reject(new Error("Obsolete identity"));
    await expect(reload).resolves.toBeUndefined();
  });
  expect(onQueryError).not.toHaveBeenCalled();
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it("an earlier favourite snapshot preserves a completed save and unrelated server records", async () => {
  const read = deferred<ApiResult<HostFavourite[]>>();
  vi.mocked(readExploreFavourites).mockReturnValueOnce(read.promise);
  const { result } = favourites();
  await waitFor(() => expect(readExploreFavourites).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  expect(result.current.isSaved("task", "first")).toBe(true);
  await act(async () => {
    read.resolve({ data: [favourite("other")], error: null });
    await read.promise;
  });
  expect(result.current.loadingFavourites).toBe(false);
  expect(result.current.isSaved("task", "first")).toBe(true);
  expect(result.current.isSaved("task", "other")).toBe(true);
});

it("an earlier favourite snapshot cannot resurrect a save removed before that read completes", async () => {
  const read = deferred<ApiResult<HostFavourite[]>>();
  vi.mocked(readExploreFavourites).mockReturnValueOnce(read.promise);
  const { result } = favourites();
  await waitFor(() => expect(readExploreFavourites).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  expect(result.current.isSaved("task", "first")).toBe(false);
  await act(async () => {
    read.resolve({ data: [favourite(), favourite("other")], error: null });
    await read.promise;
  });
  expect(result.current.isSaved("task", "first")).toBe(false);
  expect(result.current.isSaved("task", "other")).toBe(true);
});

it("a failed favourite command does not mask the incoming server snapshot", async () => {
  const read = deferred<ApiResult<HostFavourite[]>>();
  vi.mocked(readExploreFavourites).mockReturnValueOnce(read.promise);
  vi.mocked(saveExploreFavourite).mockResolvedValueOnce({
    data: null,
    error: { message: "Save failed" },
  });
  const { result, notices } = favourites();
  await waitFor(() => expect(readExploreFavourites).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  await act(async () => {
    read.resolve({ data: [favourite()], error: null });
    await read.promise;
  });
  expect(result.current.isSaved("task", "first")).toBe(true);
  expect(notices.onActionError).toHaveBeenCalledExactlyOnceWith("Save failed");
  expect(notices.onQueryError).not.toHaveBeenCalled();
});

it("an ordinary favourite query failure settles loading without erasing a completed local save", async () => {
  const read = deferred<ApiResult<HostFavourite[]>>();
  vi.mocked(readExploreFavourites).mockReturnValueOnce(read.promise);
  const { result, notices } = favourites();
  await waitFor(() => expect(readExploreFavourites).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.toggleFavourite("task", "first", task());
  });
  await act(async () => {
    read.resolve({ data: null, error: { message: "Query failed" } });
    await read.promise;
  });
  expect(result.current.loadingFavourites).toBe(false);
  expect(result.current.isSaved("task", "first")).toBe(true);
  expect(notices.onQueryError).toHaveBeenCalledExactlyOnceWith(
    "Couldn't load your saved items. Check that the host planning migration has been run.",
  );
});
