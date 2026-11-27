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

it("ignores portrait responses from a previous player credential", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  rpc.mockImplementation((name: string, args: { p_player_token?: string }) => {
    if (name === "cc_get_game_session_view")
      return Promise.resolve({
        data: {
          session: { final_gallery_open: false },
          player: { id: args.p_player_token },
        },
        error: null,
      });
    if (name === "cc_get_session_portraits")
      return args.p_player_token === "old"
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve({
            data: { players: { new: "new.jpg" }, teams: {} },
            error: null,
          });
    return Promise.resolve({ data: null, error: null });
  });
  const { result, rerender } = renderHook(
    ({ token }) => useSessionPlayerData("123456", token, "game"),
    { initialProps: { token: "old" } },
  );
  await waitFor(() =>
    expect(rpc).toHaveBeenCalledWith("cc_get_session_portraits", {
      p_join_code: "123456",
      p_player_token: "old",
    }),
  );
  rerender({ token: "new" });
  await waitFor(() =>
    expect(result.current.portraits.players).toEqual({ new: "new.jpg" }),
  );
  await act(async () =>
    resolveOld({
      data: { players: { old: "old.jpg" }, teams: {} },
      error: null,
    }),
  );
  expect(result.current.portraits.players).toEqual({ new: "new.jpg" });
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

for (const signal of ["session", "gallery", "status"] as const) {
  it(`does not promote a completed gallery leaderboard while the ${signal} voting signal is active`, async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "cc_get_game_session_view"
            ? {
                session: {
                  final_gallery_open: true,
                  final_voting_open: signal === "session",
                },
                player: { id: "player" },
              }
            : name === "cc_player_get_session_final_round_gallery"
              ? {
                  voting_open: signal === "gallery",
                  challenge_status: signal === "status" ? "voting" : "results",
                  voting_completed: true,
                  leaderboard: [
                    {
                      player_id: "unpublished",
                      name: "Unpublished leader",
                      score: 777,
                    },
                  ],
                }
              : null,
        error: null,
      }),
    );
    const { result } = renderHook(() =>
      useSessionPlayerData("123456", "token", "final"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual([]);
    expect(result.current.finalGallery?.voting_completed).toBe(true);
  });
}

it("finishes loading when the gallery RPC has no current gallery", async () => {
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data:
        name === "cc_get_game_session_view"
          ? {
              session: { final_gallery_open: true, final_voting_open: false },
              player: { id: "player" },
            }
          : null,
      error: null,
    }),
  );
  const { result } = renderHook(() =>
    useSessionPlayerData("123456", "token", "final"),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.finalGallery).toBeNull();
  expect(result.current.leaderboard).toEqual([]);
});

it("loads public artwork for the current challenge without player credentials", async () => {
  const artUrl = "https://assets.test/challenge.png";
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data:
        name === "cc_get_game_session_view"
          ? {
              session: { final_gallery_open: false },
              player: { id: "player" },
              challenge: {
                id: "challenge",
                title: "Make an entrance",
              },
            }
          : name === "cc_get_public_main_challenge_art"
            ? artUrl
            : null,
      error: null,
    }),
  );
  const { result } = renderHook(() =>
    useSessionPlayerData("123456", "player-token", "game"),
  );
  await waitFor(() => expect(result.current.mainChallengeArtUrl).toBe(artUrl));
  expect(rpc).toHaveBeenCalledWith("cc_get_public_main_challenge_art", {
    p_join_code: "123456",
    p_challenge_id: "challenge",
    p_challenge_title: "Make an entrance",
  });
});
