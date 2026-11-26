import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ApiResult } from "../../lib/apiResult";
import type {
  HostDirectoryEntry,
  HostGame,
  HostPreviewIdentity,
} from "../../types/hostHub";
import { useHostHub } from "./useHostHub";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  games: vi.fn(),
  admin: vi.fn(),
  preview: vi.fn(),
  directory: vi.fn(),
  launch: vi.fn(),
}));
vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: mocks.identity }));
vi.mock("../../lib/hostHubQueries", () => ({
  readHostGames: mocks.games,
  readPlatformAdmin: mocks.admin,
  readHostPreview: mocks.preview,
  readHostDirectory: mocks.directory,
}));
vi.mock("../../lib/gameSessions", () => ({
  createOrGetHostGameSession: mocks.launch,
}));
function game(id: string): HostGame {
  return {
    id,
    name: id,
    event_date: "2030-01-01",
    start_time: null,
    end_time: null,
    player_count: 12,
    venue_name: null,
    status: "planned",
  };
}
function pending<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}
const navigate = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({
    data: { user: { id: "host-one" } },
    error: null,
  });
  mocks.games.mockResolvedValue({ data: [game("current")], error: null });
  mocks.admin.mockResolvedValue({ data: false, error: null });
  mocks.directory.mockResolvedValue({ data: [], error: null });
});
afterEach(cleanup);
it("keeps the latest view when an earlier game read finishes late", async () => {
  const old = pending<ApiResult<HostGame[]>>();
  mocks.games.mockImplementation((view: string) =>
    view === "home"
      ? old.promise
      : Promise.resolve({ data: [game("new")], error: null }),
  );
  const { result, rerender } = renderHook(
    ({ view }: { view: "home" | "games" }) =>
      useHostHub({ view, viewAsHostId: null, navigate }),
    { initialProps: { view: "home" } },
  );
  await waitFor(() => expect(mocks.games).toHaveBeenCalledTimes(1));
  rerender({ view: "games" });
  await waitFor(() => expect(result.current.games[0]?.id).toBe("new"));
  await act(async () => {
    old.resolve({ data: [game("old")], error: null });
    await old.promise;
  });
  expect(result.current.games[0]?.id).toBe("new");
});
it("keeps the current preview identity when an earlier preview finishes late", async () => {
  const old =
    pending<ApiResult<{ host: HostPreviewIdentity; games: HostGame[] }>>();
  mocks.admin.mockResolvedValue({ data: true, error: null });
  mocks.preview.mockImplementation((id: string) =>
    id === "old"
      ? old.promise
      : Promise.resolve({
          data: {
            host: { id, email: null, display_name: id },
            games: [game(id)],
          },
          error: null,
        }),
  );
  const { result, rerender } = renderHook(
    ({ id }) => useHostHub({ view: "home", viewAsHostId: id, navigate }),
    { initialProps: { id: "old" } },
  );
  await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith("old"));
  rerender({ id: "new" });
  await waitFor(() => expect(result.current.viewingHost?.id).toBe("new"));
  await act(async () => {
    old.resolve({
      data: {
        host: { id: "old", email: null, display_name: "Old" },
        games: [game("old")],
      },
      error: null,
    });
    await old.promise;
  });
  expect(result.current.viewingHost?.id).toBe("new");
  expect(result.current.games[0]?.id).toBe("new");
});
it("does not publish a late directory after leaving the home view", async () => {
  const old = pending<ApiResult<HostDirectoryEntry[]>>();
  mocks.admin.mockResolvedValue({ data: true, error: null });
  mocks.directory.mockReturnValue(old.promise);
  const { result, rerender } = renderHook(
    ({ view }: { view: "home" | "games" }) =>
      useHostHub({ view, viewAsHostId: null, navigate }),
    { initialProps: { view: "home" } },
  );
  await waitFor(() => expect(mocks.directory).toHaveBeenCalledTimes(1));
  rerender({ view: "games" });
  await waitFor(() => expect(mocks.games).toHaveBeenCalledTimes(2));
  await act(async () => {
    old.resolve({
      data: [
        {
          host_id: "old",
          email: null,
          display_name: "Old",
          created_at: "2020-01-01",
          game_count: 1,
        },
      ],
      error: null,
    });
    await old.promise;
  });
  expect(result.current.hostDirectory).toEqual([]);
});
it("does not begin queries when identity resolves after unmount", async () => {
  const old = pending<{ data: { user: { id: string } }; error: null }>();
  mocks.identity.mockReturnValue(old.promise);
  const { unmount } = renderHook(() =>
    useHostHub({ view: "home", viewAsHostId: null, navigate }),
  );
  unmount();
  await act(async () => {
    old.resolve({ data: { user: { id: "host-one" } }, error: null });
    await old.promise;
  });
  expect(mocks.games).not.toHaveBeenCalled();
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("settles a rejected identity read and recovers on a new view", async () => {
  mocks.identity.mockRejectedValueOnce(new Error("Offline"));
  const { result, rerender } = renderHook(
    ({ view }: { view: "home" | "games" }) =>
      useHostHub({ view, viewAsHostId: null, navigate }),
    { initialProps: { view: "home" } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toContain("session");
  rerender({ view: "games" });
  await waitFor(() => expect(result.current.games).toHaveLength(1));
  expect(result.current.error).toBe("");
});
it.each(["games", "preview"])(
  "recovers a rejected %s read through the matching feedback path",
  async (stage) => {
    if (stage === "games")
      mocks.games.mockRejectedValueOnce(new Error("Offline"));
    else {
      mocks.admin.mockResolvedValue({ data: true, error: null });
      mocks.preview.mockRejectedValueOnce(new Error("Preview offline"));
    }
    const { result } = renderHook(() =>
      useHostHub({
        view: "home",
        viewAsHostId: stage === "preview" ? "other" : null,
        navigate,
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toContain(
      stage === "games" ? "Couldn't load your plans" : "Preview offline",
    );
  },
);
it("keeps a failed launch visible when a newer query succeeds", async () => {
  mocks.launch.mockRejectedValueOnce(new Error("Launch failed"));
  const { result, rerender } = renderHook(
    ({ view }: { view: "home" | "games" }) =>
      useHostHub({ view, viewAsHostId: null, navigate }),
    { initialProps: { view: "home" } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await result.current.playGame(game("current"));
  });
  rerender({ view: "games" });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe("Launch failed");
});
