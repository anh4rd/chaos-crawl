import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  readPlatformGames,
  readPlatformGameDetail,
} from "../../lib/superAdminQueries";
import type { ApiResult } from "../../lib/apiResult";
import type { PlatformGame, PlatformGameDetail } from "../../types/superAdmin";
import { usePlatformGames } from "./usePlatformGames";
import { useGameInspector } from "./useGameInspector";
vi.mock("../../lib/superAdminQueries", () => ({
  readPlatformGames: vi.fn(),
  readPlatformGameDetail: vi.fn(),
}));
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred request not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
function game(id: string): PlatformGame {
  return {
    game_id: id,
    name: id,
    host_email: null,
    status: "planned",
    event_date: null,
    created_at: "2030-01-01",
    player_count: 0,
    session_count: 0,
    live_sessions: 0,
  };
}
function detail(id: string): PlatformGameDetail {
  return { game: { name: id }, sessions: [] };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readPlatformGames).mockResolvedValue({ data: [], error: null });
  vi.mocked(readPlatformGameDetail).mockResolvedValue({
    data: detail("Current"),
    error: null,
  });
});
afterEach(cleanup);

it("a newer list refresh retains its rows after the obsolete initial reply", async () => {
  const old = deferred<ApiResult<PlatformGame[]>>();
  vi.mocked(readPlatformGames)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: [game("Current")], error: null });
  const setError = vi.fn();
  const { result } = renderHook(() => usePlatformGames(setError));
  await act(async () => {
    await result.current.load();
  });
  await act(async () => {
    old.resolve({ data: [game("Old")], error: null });
    await old.promise;
  });
  expect(result.current.games).toEqual([game("Current")]);
  expect(result.current.loading).toBe(false);
});

it("an obsolete denied list response cannot overwrite a current successful refresh", async () => {
  const old = deferred<ApiResult<PlatformGame[]>>();
  vi.mocked(readPlatformGames)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: [game("Current")], error: null });
  const setError = vi.fn();
  const { result } = renderHook(() => usePlatformGames(setError));
  await act(async () => {
    await result.current.load();
  });
  await act(async () => {
    old.resolve({ data: null, error: { message: "Not authorised" } });
    await old.promise;
  });
  expect(setError).not.toHaveBeenCalledWith("Not authorised");
  expect(result.current.denied).toBe(false);
});

it("a list response from an unmounted workspace cannot publish feedback", async () => {
  const old = deferred<ApiResult<PlatformGame[]>>();
  vi.mocked(readPlatformGames).mockReturnValueOnce(old.promise);
  const setError = vi.fn();
  const { unmount } = renderHook(() => usePlatformGames(setError));
  unmount();
  await act(async () => {
    old.resolve({ data: null, error: { message: "Old account error" } });
    await old.promise;
  });
  expect(setError).not.toHaveBeenCalledWith("Old account error");
});

it("only the current StrictMode list lifetime can publish rows", async () => {
  const old = deferred<ApiResult<PlatformGame[]>>();
  const current = deferred<ApiResult<PlatformGame[]>>();
  vi.mocked(readPlatformGames)
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(current.promise);
  const setError = vi.fn();
  const { result } = renderHook(() => usePlatformGames(setError), {
    wrapper: StrictMode,
  });
  await act(async () => {
    current.resolve({ data: [game("Current")], error: null });
    await current.promise;
  });
  await act(async () => {
    old.resolve({ data: [game("Old")], error: null });
    await old.promise;
  });
  expect(result.current.games).toEqual([game("Current")]);
});

it.each([false, true])(
  "closing pending inspector prevents stale completion (failure=%s)",
  async (failure) => {
    const old = deferred<ApiResult<PlatformGameDetail>>();
    vi.mocked(readPlatformGameDetail).mockReturnValueOnce(old.promise);
    const setError = vi.fn();
    const { result } = renderHook(() => useGameInspector(setError));
    let opening = Promise.resolve();
    act(() => {
      opening = result.current.openGame("Old");
    });
    act(() => {
      result.current.close();
    });
    expect(result.current.detailLoading).toBe(false);
    await act(async () => {
      old.resolve(
        failure
          ? { data: null, error: { message: "Old detail error" } }
          : { data: detail("Old"), error: null },
      );
      await opening;
    });
    expect(result.current.selected).toBeNull();
    expect(setError).not.toHaveBeenCalledWith("Old detail error");
  },
);

it.each([false, true])(
  "old inspector cannot overwrite or unlock fresh pending inspection (failure=%s)",
  async (failure) => {
    const old = deferred<ApiResult<PlatformGameDetail>>();
    const current = deferred<ApiResult<PlatformGameDetail>>();
    vi.mocked(readPlatformGameDetail)
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    const setError = vi.fn();
    const { result } = renderHook(() => useGameInspector(setError));
    let oldOpening = Promise.resolve();
    let newOpening = Promise.resolve();
    act(() => {
      oldOpening = result.current.openGame("Old");
    });
    act(() => {
      result.current.close();
      newOpening = result.current.openGame("Current");
    });
    await act(async () => {
      old.resolve(
        failure
          ? { data: null, error: { message: "Old detail error" } }
          : { data: detail("Old"), error: null },
      );
      await oldOpening;
    });
    expect(result.current.detailLoading).toBe(true);
    expect(result.current.selected).toBeNull();
    expect(setError).not.toHaveBeenCalledWith("Old detail error");
    await act(async () => {
      current.resolve({ data: detail("Current"), error: null });
      await newOpening;
    });
    expect(result.current.selected).toEqual(detail("Current"));
    expect(result.current.detailLoading).toBe(false);
  },
);

it("an unmounted inspector cannot publish a failed reply", async () => {
  const pending = deferred<ApiResult<PlatformGameDetail>>();
  vi.mocked(readPlatformGameDetail).mockReturnValueOnce(pending.promise);
  const setError = vi.fn();
  const { result, unmount } = renderHook(() => useGameInspector(setError));
  let opening = Promise.resolve();
  act(() => {
    opening = result.current.openGame("Old");
  });
  unmount();
  await act(async () => {
    pending.resolve({ data: null, error: { message: "Old detail error" } });
    await opening;
  });
  expect(setError).not.toHaveBeenCalledWith("Old detail error");
});

it("a missing detail payload produces recoverable feedback instead of an empty inspector", async () => {
  vi.mocked(readPlatformGameDetail).mockResolvedValueOnce({
    data: null,
    error: null,
  });
  const setError = vi.fn();
  const { result } = renderHook(() => useGameInspector(setError));
  await act(async () => {
    await result.current.openGame("Missing");
  });
  expect(result.current.selected).toBeNull();
  expect(result.current.detailLoading).toBe(false);
  expect(setError).toHaveBeenCalledWith("Game details are unavailable.");
});

it("retained list refresh callbacks do not issue requests after unmount", async () => {
  const setError = vi.fn();
  const { result, unmount } = renderHook(() => usePlatformGames(setError));
  const reload = result.current.load;
  unmount();
  await act(async () => {
    await reload();
  });
  expect(readPlatformGames).toHaveBeenCalledTimes(1);
});

it("retained inspector callbacks do not issue requests after unmount", async () => {
  const setError = vi.fn();
  const { result, unmount } = renderHook(() => useGameInspector(setError));
  const open = result.current.openGame;
  unmount();
  await act(async () => {
    await open("Old");
  });
  expect(readPlatformGameDetail).not.toHaveBeenCalled();
});
