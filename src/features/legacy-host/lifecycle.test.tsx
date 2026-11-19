import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLegacyGameControls } from "./useLegacyGameControls";
import { useLegacyRoster } from "./useLegacyRoster";
import { useLegacyScoreAdjustment } from "./useLegacyScoreAdjustment";
import { useLegacyTeams } from "./useLegacyTeams";
import { updateGameState } from "../../lib/gameApi";
import { awardScore } from "../../lib/scoreApi";
import { deletePlayer, renamePlayer } from "../../lib/playerApi";
import {
  createLegacyHostTeam,
  createLegacyHostPlayer,
  assignLegacyHostTeam,
} from "../../lib/legacyHostCommands";
import {
  readLegacyHostTeams,
  subscribeLegacyHostTeams,
} from "../../lib/legacyHostQueries";
import type { ApiResult } from "../../lib/apiResult";
import type { Challenge, GameState, Player } from "../../types/database";
import type { LegacyHostTeam } from "../../types/legacyHost";

vi.mock("../../lib/gameApi", () => ({ updateGameState: vi.fn() }));
vi.mock("../../lib/scoreApi", () => ({ awardScore: vi.fn() }));
vi.mock("../../lib/playerApi", () => ({
  deletePlayer: vi.fn(),
  renamePlayer: vi.fn(),
}));
vi.mock("../../lib/legacyHostCommands", () => ({
  createLegacyHostTeam: vi.fn(),
  createLegacyHostPlayer: vi.fn(),
  assignLegacyHostTeam: vi.fn(),
}));
vi.mock("../../lib/legacyHostQueries", () => ({
  readLegacyHostTeams: vi.fn(),
  subscribeLegacyHostTeams: vi.fn(),
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred operation not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
const challenge: Challenge = {
  id: 1,
  pub_id: 1,
  title: "First challenge",
  description: null,
  points: 10,
  reveal_order: 1,
  allow_photo_upload: false,
};
const game: GameState = {
  id: 1,
  current_pub: "Old pub",
  current_challenge: "First challenge",
  challenge_description: "",
  current_challenge_id: 1,
  current_challenge_order: 1,
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};
const player: Player = { id: "p1", name: "Pat", team: "Ducks", score: 500 };
const success: ApiResult<null> = { data: null, error: null };
let refresh: () => void = () => {};
const unsubscribe = vi.fn();
function gameControls() {
  const onShowLive = vi.fn();
  return {
    ...renderHook(() =>
      useLegacyGameControls({
        game,
        rounds: [
          {
            id: "1",
            label: "Round 1",
            legacyName: "Old pub",
            challenges: [challenge],
          },
        ],
        onShowLive,
      }),
    ),
    onShowLive,
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(updateGameState).mockResolvedValue(success);
  vi.mocked(awardScore).mockResolvedValue({ data: null, error: null });
  vi.mocked(createLegacyHostTeam).mockResolvedValue(success);
  vi.mocked(createLegacyHostPlayer).mockResolvedValue(success);
  vi.mocked(assignLegacyHostTeam).mockResolvedValue(success);
  vi.mocked(renamePlayer).mockResolvedValue(success);
  vi.mocked(deletePlayer).mockResolvedValue(success);
  vi.mocked(readLegacyHostTeams).mockResolvedValue({
    data: [{ id: "ducks", name: "Ducks" }],
    error: null,
  });
  vi.mocked(subscribeLegacyHostTeams).mockImplementation((callback) => {
    refresh = callback;
    return unsubscribe;
  });
});
afterEach(cleanup);

it("round operations take one synchronous write lock before repeated callbacks can run", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(updateGameState).mockReturnValue(write.promise);
  const { result } = gameControls();
  let first = Promise.resolve();
  act(() => {
    first = result.current.revealChallenge(challenge);
    void result.current.scheduleChallenge(challenge);
  });
  expect(updateGameState).toHaveBeenCalledTimes(1);
  await act(async () => {
    write.resolve(success);
    await first;
  });
  await act(async () => {
    await result.current.scheduleChallenge(challenge);
  });
  expect(updateGameState).toHaveBeenCalledTimes(2);
});

it("an obsolete successful reveal cannot navigate a replacement workspace", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(updateGameState).mockReturnValueOnce(write.promise);
  const { result, unmount, onShowLive } = gameControls();
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.revealChallenge(challenge);
  });
  unmount();
  await act(async () => {
    write.resolve(success);
    await operation;
  });
  expect(onShowLive).not.toHaveBeenCalled();
});

it("obsolete game failures do not interrupt the new page with an alert", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(updateGameState).mockReturnValueOnce(write.promise);
  const { result, unmount } = gameControls();
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.setVoting(true, "team");
  });
  unmount();
  await act(async () => {
    write.resolve({ data: null, error: { message: "Old failure" } });
    await operation;
  });
  expect(window.alert).not.toHaveBeenCalled();
});

it("cancel failure reports once without escaping and releases its lock for retry", async () => {
  vi.mocked(updateGameState).mockResolvedValueOnce({
    data: null,
    error: { message: "Cancel failed" },
  });
  const { result } = gameControls();
  await act(async () => {
    await expect(
      result.current.cancelScheduledReveal(),
    ).resolves.toBeUndefined();
  });
  expect(window.alert).toHaveBeenCalledExactlyOnceWith(
    "Could not cancel schedule: Cancel failed",
  );
  await act(async () => {
    await result.current.cancelScheduledReveal();
  });
  expect(updateGameState).toHaveBeenCalledTimes(2);
});

it("manual score submission locks synchronously while keeping a later explicit award available", async () => {
  const write = deferred<Awaited<ReturnType<typeof awardScore>>>();
  vi.mocked(awardScore).mockReturnValue(write.promise);
  const { result } = renderHook(useLegacyScoreAdjustment);
  act(() => {
    result.current.setSelectedPlayerId("p1");
  });
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.handleAwardOrDock();
    void result.current.handleAwardOrDock();
  });
  expect(awardScore).toHaveBeenCalledTimes(1);
  await act(async () => {
    write.resolve({ data: null, error: null });
    await operation;
  });
  await act(async () => {
    await result.current.handleAwardOrDock();
  });
  expect(awardScore).toHaveBeenCalledTimes(2);
});

it("obsolete score errors cannot alert after the host leaves", async () => {
  const write = deferred<Awaited<ReturnType<typeof awardScore>>>();
  vi.mocked(awardScore).mockReturnValueOnce(write.promise);
  const { result, unmount } = renderHook(useLegacyScoreAdjustment);
  act(() => {
    result.current.setSelectedPlayerId("p1");
  });
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.handleAwardOrDock();
  });
  unmount();
  await act(async () => {
    write.resolve({ data: null, error: { message: "Old award failure" } });
    await operation;
  });
  expect(window.alert).not.toHaveBeenCalled();
});

for (const target of ["team", "player"]) {
  it(`repeated ${target} creation has a synchronous lock`, async () => {
    const command =
      target === "team"
        ? vi.mocked(createLegacyHostTeam)
        : vi.mocked(createLegacyHostPlayer);
    const write = deferred<ApiResult<null>>();
    command.mockReturnValueOnce(write.promise);
    const reload = vi.fn<() => Promise<void>>().mockResolvedValue();
    const { result } = renderHook(() => useLegacyRoster(reload));
    act(() => {
      if (target === "team") result.current.setTeamNameDraft("Owls");
      else result.current.setNewPlayerName("Kai");
    });
    let operation = Promise.resolve();
    act(() => {
      operation =
        target === "team"
          ? result.current.addTeam()
          : result.current.addPlayer();
      if (target === "team") void result.current.addTeam();
      else void result.current.addPlayer();
    });
    expect(command).toHaveBeenCalledTimes(1);
    await act(async () => {
      write.resolve(success);
      await operation;
    });
  });
}

it("a pending rename excludes conflicting removal of that player before confirmation", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(renamePlayer).mockReturnValueOnce(write.promise);
  const { result } = renderHook(() => useLegacyRoster(async () => {}));
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.savePlayerName(player, "New Pat");
    void result.current.removePlayer(player);
  });
  expect(window.confirm).not.toHaveBeenCalled();
  expect(deletePlayer).not.toHaveBeenCalled();
  await act(async () => {
    write.resolve(success);
    await operation;
  });
});

it("different player records can still mutate independently", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(assignLegacyHostTeam).mockReturnValueOnce(write.promise);
  const { result } = renderHook(() => useLegacyRoster(async () => {}));
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.assignTeam(player, "Owls");
    void result.current.assignTeam({ ...player, id: "p2" }, "Ducks");
  });
  expect(assignLegacyHostTeam).toHaveBeenCalledTimes(2);
  await act(async () => {
    write.resolve(success);
    await operation;
  });
});

it("obsolete team creation cannot start another team read", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(createLegacyHostTeam).mockReturnValueOnce(write.promise);
  const reload = vi.fn<() => Promise<void>>().mockResolvedValue();
  const { result, unmount } = renderHook(() => useLegacyRoster(reload));
  act(() => {
    result.current.setTeamNameDraft("Owls");
  });
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.addTeam();
  });
  unmount();
  await act(async () => {
    write.resolve(success);
    await operation;
  });
  expect(reload).not.toHaveBeenCalled();
});

it("obsolete roster errors do not publish old command feedback", async () => {
  const write = deferred<ApiResult<null>>();
  vi.mocked(createLegacyHostPlayer).mockReturnValueOnce(write.promise);
  const { result, unmount } = renderHook(() => useLegacyRoster(async () => {}));
  act(() => {
    result.current.setNewPlayerName("Kai");
  });
  let operation = Promise.resolve();
  act(() => {
    operation = result.current.addPlayer();
  });
  unmount();
  await act(async () => {
    write.resolve({ data: null, error: { message: "Old roster failure" } });
    await operation;
  });
  expect(window.alert).not.toHaveBeenCalled();
});

it("a newer Realtime team read wins over the obsolete initial snapshot", async () => {
  const first = deferred<ApiResult<LegacyHostTeam[]>>();
  const second = deferred<ApiResult<LegacyHostTeam[]>>();
  vi.mocked(readLegacyHostTeams)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result } = renderHook(useLegacyTeams);
  act(() => {
    refresh();
  });
  await act(async () => {
    second.resolve({ data: [{ id: "new", name: "Newest" }], error: null });
    await second.promise;
  });
  await act(async () => {
    first.resolve({ data: [{ id: "old", name: "Old" }], error: null });
    await first.promise;
  });
  expect(result.current.data).toEqual([{ id: "new", name: "Newest" }]);
});

it("an old team completion cannot clear a newer read's loading state", async () => {
  const first = deferred<ApiResult<LegacyHostTeam[]>>();
  const second = deferred<ApiResult<LegacyHostTeam[]>>();
  vi.mocked(readLegacyHostTeams)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result } = renderHook(useLegacyTeams);
  act(() => {
    refresh();
  });
  await act(async () => {
    first.resolve({ data: [{ id: "old", name: "Old" }], error: null });
    await first.promise;
  });
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toEqual([]);
  await act(async () => {
    second.resolve({ data: [{ id: "new", name: "Newest" }], error: null });
    await second.promise;
  });
  expect(result.current.loading).toBe(false);
});

it("team cleanup removes its listener and ignores an already queued callback", async () => {
  const { unmount } = renderHook(useLegacyTeams);
  await waitFor(() => expect(readLegacyHostTeams).toHaveBeenCalledTimes(1));
  unmount();
  act(() => {
    refresh();
  });
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(readLegacyHostTeams).toHaveBeenCalledTimes(1);
});

it("a thrown team read settles loading, reports a retryable error and recovers", async () => {
  vi.mocked(readLegacyHostTeams).mockRejectedValueOnce(
    new Error("Team read unavailable"),
  );
  const { result } = renderHook(useLegacyTeams);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error?.message).toBe("Team read unavailable");
  await act(async () => {
    await result.current.reload();
  });
  expect(result.current.error).toBeNull();
  expect(result.current.data).toEqual([{ id: "ducks", name: "Ducks" }]);
});

it("an old team follow-up read cannot release a newer creation's busy lock", async () => {
  const reload = deferred<void>();
  const second = deferred<ApiResult<null>>();
  vi.mocked(createLegacyHostTeam)
    .mockResolvedValueOnce(success)
    .mockReturnValueOnce(second.promise);
  const loadTeams = vi
    .fn<() => Promise<void>>()
    .mockReturnValueOnce(reload.promise)
    .mockResolvedValue();
  const { result } = renderHook(() => useLegacyRoster(loadTeams));
  act(() => {
    result.current.setTeamNameDraft("Owls");
  });
  let first = Promise.resolve();
  act(() => {
    first = result.current.addTeam();
  });
  await waitFor(() => expect(loadTeams).toHaveBeenCalledTimes(1));
  expect(result.current.creatingTeam).toBe(false);
  act(() => {
    result.current.setTeamNameDraft("Foxes");
  });
  let current = Promise.resolve();
  act(() => {
    current = result.current.addTeam();
  });
  expect(result.current.creatingTeam).toBe(true);
  await act(async () => {
    reload.resolve();
    await first;
  });
  expect(result.current.creatingTeam).toBe(true);
  await act(async () => {
    second.resolve(success);
    await current;
  });
  expect(result.current.creatingTeam).toBe(false);
});

it("failed team subscription setup stays recoverable without crashing or pretending a read repaired it", async () => {
  vi.mocked(subscribeLegacyHostTeams).mockImplementationOnce(() => {
    throw new Error("Team channel unavailable");
  });
  const { result } = renderHook(useLegacyTeams);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([{ id: "ducks", name: "Ducks" }]);
  expect(result.current.error?.message).toBe("Team channel unavailable");
  await act(async () => {
    await result.current.reload();
  });
  expect(result.current.error?.message).toBe("Team channel unavailable");
});
