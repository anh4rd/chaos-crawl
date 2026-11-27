import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { readPlatformSessionPlayers } from "../../lib/superAdminQueries";
import { updatePlatformPlayer } from "../../lib/superAdminCommands";
import type { ApiResult } from "../../lib/apiResult";
import type { PlatformSessionPlayers } from "../../types/superAdmin";
import { usePlatformPlayers } from "./usePlatformPlayers";

vi.mock("../../lib/superAdminQueries", () => ({
  readPlatformSessionPlayers: vi.fn(),
}));
vi.mock("../../lib/superAdminCommands", () => ({
  updatePlatformPlayer: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred request not initialized");
  };
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function data(id: string): PlatformSessionPlayers {
  return { session_id: id, session_name: id, players: [], teams: [] };
}
it("ignores an obsolete session read after switching sessions", async () => {
  const old = deferred<ApiResult<PlatformSessionPlayers>>();
  vi.mocked(readPlatformSessionPlayers)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: data("new"), error: null });
  const setError = vi.fn();
  const { result } = renderHook(() => usePlatformPlayers(setError, vi.fn()));
  let first = Promise.resolve();
  act(() => {
    first = result.current.open("old");
  });
  await act(async () => {
    await result.current.open("new");
  });
  await act(async () => {
    old.resolve({ data: null, error: { message: "old error" } });
    await first;
  });
  expect(result.current.data?.session_id).toBe("new");
  expect(setError).not.toHaveBeenCalledWith("old error");
});
it("locks duplicate saves and ignores an issued write after closing", async () => {
  const pending = deferred<ApiResult<null>>();
  vi.mocked(readPlatformSessionPlayers).mockResolvedValue({
    data: data("one"),
    error: null,
  });
  vi.mocked(updatePlatformPlayer).mockReturnValue(pending.promise);
  const setError = vi.fn();
  const onSaved = vi.fn();
  const { result } = renderHook(() => usePlatformPlayers(setError, onSaved));
  await act(async () => {
    await result.current.open("one");
  });
  const values = {
    name: "Player",
    avatar_url: null,
    team_id: null,
    score: 0,
    phone: null,
  };
  let saving = Promise.resolve(false);
  act(() => {
    saving = result.current.save("player", values, values);
    void result.current.save("player", values, values);
  });
  expect(updatePlatformPlayer).toHaveBeenCalledTimes(1);
  act(() => result.current.close());
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await saving;
  });
  expect(readPlatformSessionPlayers).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
});
