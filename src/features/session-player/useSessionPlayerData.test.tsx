import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSessionPlayerData } from "./useSessionPlayerData";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../../lib/sessionSupabase", () => ({ supabase: { rpc } }));
beforeEach(() => {
  rpc.mockReset();
  rpc.mockImplementation(() => Promise.resolve({ data: null, error: null }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("discards a pending view after the participant credential changes", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  rpc.mockImplementation((name: string, args: { p_player_token?: string }) =>
    name === "cc_get_game_session_view"
      ? args.p_player_token === "old"
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve({
            data: {
              session: { final_gallery_open: false },
              player: { id: "new-player" },
            },
            error: null,
          })
      : Promise.resolve({ data: null, error: null }),
  );
  const { result, rerender } = renderHook(
    ({ token }) => useSessionPlayerData("123456", token, "game"),
    { initialProps: { token: "old" } },
  );
  rerender({ token: "new" });
  await waitFor(() =>
    expect(result.current.view?.player.id).toBe("new-player"),
  );
  await act(async () => {
    resolveOld({
      data: {
        session: { final_gallery_open: false },
        player: { id: "old-player" },
      },
      error: null,
    });
  });
  expect(result.current.view?.player.id).toBe("new-player");
  expect(
    rpc.mock.calls.filter(
      ([name, args]) =>
        name === "cc_get_player_secret_missions" &&
        args.p_player_token === "old",
    ),
  ).toHaveLength(0);
});

it("cleans polling timers and ignores in-flight work on unmount", async () => {
  vi.useFakeTimers();
  let resolveView: (value: unknown) => void = () => {};
  rpc.mockImplementation((name: string) =>
    name === "cc_get_game_session_view"
      ? new Promise((resolve) => {
          resolveView = resolve;
        })
      : Promise.resolve({ data: null, error: null }),
  );
  const { unmount } = renderHook(() =>
    useSessionPlayerData("123456", "token", "game"),
  );
  unmount();
  await act(async () => {
    resolveView({
      data: { session: { final_gallery_open: false }, player: { id: "late" } },
      error: null,
    });
    vi.advanceTimersByTime(30000);
  });
  expect(
    rpc.mock.calls.filter(([name]) => name === "cc_get_game_session_view"),
  ).toHaveLength(1);
  expect(
    rpc.mock.calls.filter(([name]) => name === "cc_get_player_secret_missions"),
  ).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
