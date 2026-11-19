import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  add: vi.fn(),
  subtract: vi.fn(),
  remove: vi.fn(),
  rename: vi.fn(),
  createTeam: vi.fn(),
  assign: vi.fn(),
  reload: vi.fn(),
  reloadScores: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("../../lib/gameApi", () => ({ updateGameState: mocks.update }));
vi.mock("../../lib/playerApi", () => ({
  addPoints: mocks.add,
  removePoints: mocks.subtract,
  deletePlayer: mocks.remove,
  renamePlayer: mocks.rename,
  changeTeam: mocks.assign,
}));
vi.mock("../../lib/legacyAdminCommands", () => ({
  createLegacyAdminTeam: mocks.createTeam,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../../game/hooks/useGameState", () => ({
  useGameState: () => ({
    data: {
      id: 1,
      current_pub: "First pub",
      current_challenge: "Current",
      current_challenge_id: 1,
      current_challenge_order: 1,
      voting_open: false,
      voting_target: "player",
      show_vote_results: false,
      slideshow_open: false,
    },
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
vi.mock("../../game/hooks/usePubs", () => ({
  usePubs: () => ({
    data: [{ id: 1, name: "First pub", sort_order: 1 }],
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
vi.mock("../../game/hooks/useChallenges", () => ({
  useChallenges: () => ({
    data: [],
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
vi.mock("../../game/hooks/usePlayers", () => ({
  usePlayers: () => ({
    data: [
      { id: "a", name: "Anna", team: null, score: 0 },
      { id: "b", name: "Bob", team: null, score: 0 },
    ],
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
vi.mock("../../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () => ({
    data: [],
    loading: false,
    error: null,
    reload: mocks.reloadScores,
  }),
}));
vi.mock("../../game/hooks/useTeams", () => ({
  useTeams: () => ({
    data: [],
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
vi.mock("../../game/hooks/useVotes", () => ({
  useVotes: () => ({
    data: [],
    loading: false,
    error: null,
    reload: mocks.reload,
  }),
}));
import { useGameControls } from "./game/useGameControls";
import { useTeamManagement } from "./teams/useTeamManagement";
import { usePlayerScoreControls } from "./players/usePlayerScoreControls";
import PlayerNameEditor from "./players/PlayerNameEditor";
import PlayersTab from "./players/PlayersTab";
import VotingTab from "./voting/VotingTab";
type Result = { data: null; error: null | { message: string } };
function deferred() {
  let resolve: (result: Result) => void = () => {
    throw new Error("Not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Not initialized");
  };
  const promise = new Promise<Result>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  for (const command of [
    mocks.update,
    mocks.add,
    mocks.subtract,
    mocks.remove,
    mocks.rename,
    mocks.createTeam,
    mocks.assign,
  ])
    command.mockResolvedValue({ data: null, error: null });
  mocks.reload.mockResolvedValue(undefined);
  mocks.reloadScores.mockResolvedValue(undefined);
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("locks game updates before React rerenders and releases after completion", async () => {
  const pending = deferred();
  mocks.update.mockReturnValue(pending.promise);
  const { result } = renderHook(() => useGameControls());
  let operation: Promise<void> = Promise.resolve();
  act(() => {
    operation = result.current.startSlideshow();
    void result.current.goLive();
  });
  expect(mocks.update).toHaveBeenCalledOnce();
  expect(window.confirm).toHaveBeenCalledOnce();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await operation;
  });
  mocks.update.mockResolvedValue({ data: null, error: null });
  await act(async () => {
    await result.current.startSlideshow();
  });
  expect(mocks.update).toHaveBeenCalledTimes(2);
});
it.each(["success", "returned", "thrown"])(
  "ignores %s slideshow outcomes after leaving its controller",
  async (mode) => {
    const pending = deferred();
    mocks.update.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useGameControls());
    let operation: Promise<void> = Promise.resolve();
    act(() => {
      operation = result.current.startSlideshow();
    });
    unmount();
    await act(async () => {
      if (mode === "thrown") pending.reject(new Error("Offline"));
      else
        pending.resolve({
          data: null,
          error: mode === "returned" ? { message: "Denied" } : null,
        });
      await operation.catch(() => {});
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  },
);
it("does not publish an old schedule confirmation after unmount", async () => {
  const pending = deferred();
  mocks.update.mockReturnValue(pending.promise);
  const { result, unmount } = renderHook(() => useGameControls());
  let operation: Promise<void> = Promise.resolve();
  act(() => {
    operation = result.current.scheduleChallenge({ id: 1, title: "Current" });
  });
  unmount();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await operation;
  });
  expect(window.alert).not.toHaveBeenCalled();
});
it("reports a current game transport failure and permits retry", async () => {
  mocks.update.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() => useGameControls());
  await act(async () => {
    await result.current.startSlideshow().catch(() => {});
  });
  expect(window.alert).toHaveBeenCalledWith("Could not update game: Offline");
  await act(async () => {
    await result.current.startSlideshow();
  });
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
    "/slideshow?host=true",
  );
});
it("locks score commands synchronously across the displayed roster", async () => {
  const pending = deferred();
  mocks.add.mockReturnValue(pending.promise);
  const { result } = renderHook(() =>
    usePlayerScoreControls(mocks.reloadScores),
  );
  let operation: Promise<void> = Promise.resolve();
  act(() => {
    operation = result.current.changePoints("a", 5);
    void result.current.changePoints("b", 10);
  });
  expect(mocks.add).toHaveBeenCalledExactlyOnceWith("a", 5);
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await operation;
  });
});
it.each(["success", "returned", "thrown"])(
  "ignores %s score outcomes after leaving the roster",
  async (mode) => {
    const pending = deferred();
    mocks.add.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() =>
      usePlayerScoreControls(mocks.reloadScores),
    );
    let operation: Promise<void> = Promise.resolve();
    act(() => {
      operation = result.current.changePoints("a", 5);
    });
    unmount();
    await act(async () => {
      if (mode === "thrown") pending.reject(new Error("Offline"));
      else
        pending.resolve({
          data: null,
          error: mode === "returned" ? { message: "Denied" } : null,
        });
      await operation;
    });
    expect(mocks.reloadScores).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  },
);
it.each(["success", "returned", "thrown"])(
  "ignores %s create-team outcomes after leaving its tab",
  async (mode) => {
    const pending = deferred();
    mocks.createTeam.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() =>
      useTeamManagement({
        reloadTeams: mocks.reload,
        reloadPlayers: mocks.reload,
      }),
    );
    act(() => result.current.setNewTeamName("Ducks"));
    let operation: Promise<void> = Promise.resolve();
    act(() => {
      operation = result.current.createTeam();
    });
    unmount();
    await act(async () => {
      if (mode === "thrown") pending.reject(new Error("Offline"));
      else
        pending.resolve({
          data: null,
          error: mode === "returned" ? { message: "Denied" } : null,
        });
      await operation;
    });
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  },
);
it.each(["success", "returned", "thrown"])(
  "ignores %s assignment outcomes after leaving its tab",
  async (mode) => {
    const pending = deferred();
    mocks.assign.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() =>
      useTeamManagement({
        reloadTeams: mocks.reload,
        reloadPlayers: mocks.reload,
      }),
    );
    let operation: Promise<void> = Promise.resolve();
    act(() => {
      operation = result.current.assignTeam("a", "Ducks");
    });
    unmount();
    await act(async () => {
      if (mode === "thrown") pending.reject(new Error("Offline"));
      else
        pending.resolve({
          data: null,
          error: mode === "returned" ? { message: "Denied" } : null,
        });
      await operation;
    });
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  },
);
it("does not reload an old name editor after leaving the roster", async () => {
  const pending = deferred();
  mocks.rename.mockReturnValue(pending.promise);
  const { unmount } = render(
    <PlayerNameEditor playerId="a" name="Anna" reload={mocks.reload} />,
  );
  const input = screen.getByRole("textbox", { name: "Name for Anna" });
  fireEvent.change(input, { target: { value: "Annabel" } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
  unmount();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await pending.promise;
  });
  expect(mocks.reload).not.toHaveBeenCalled();
});
it("locks only duplicate player deletions and preserves independent removals", async () => {
  const pending = deferred();
  mocks.remove.mockReturnValue(pending.promise);
  render(<PlayersTab />);
  const buttons = screen.getAllByRole("button", { name: "Delete Player" });
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[1]);
  expect(mocks.remove.mock.calls).toEqual([["a"], ["b"]]);
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await pending.promise;
  });
});
it.each(["success", "returned", "thrown"])(
  "ignores %s removal outcomes after leaving the roster",
  async (mode) => {
    const pending = deferred();
    mocks.remove.mockReturnValue(pending.promise);
    const { unmount } = render(<PlayersTab />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Delete Player" })[0],
    );
    unmount();
    await act(async () => {
      if (mode === "thrown") pending.reject(new Error("Offline"));
      else
        pending.resolve({
          data: null,
          error: mode === "returned" ? { message: "Denied" } : null,
        });
      await pending.promise.catch(() => {});
    });
    expect(mocks.reload).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  },
);
it("locks voting phase writes synchronously", async () => {
  const pending = deferred();
  mocks.update.mockReturnValue(pending.promise);
  render(<VotingTab />);
  const button = screen.getByRole("button", { name: "Open Voting" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(mocks.update).toHaveBeenCalledOnce();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await pending.promise;
  });
});
it("does not alert for an obsolete voting target failure", async () => {
  const pending = deferred();
  mocks.update.mockReturnValue(pending.promise);
  const { unmount } = render(<VotingTab />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "team" } });
  unmount();
  await act(async () => {
    pending.resolve({ data: null, error: { message: "Denied" } });
    await pending.promise;
  });
  expect(window.alert).not.toHaveBeenCalled();
});

it("does not redirect when the screen tab changes while its request is pending", async () => {
  const pending = deferred();
  mocks.update.mockReturnValue(pending.promise);
  const { result, rerender } = renderHook(
    ({ section }: { section: "live" | "screens" }) => useGameControls(section),
    { initialProps: { section: "screens" } },
  );
  let operation: Promise<void> = Promise.resolve();
  act(() => {
    operation = result.current.startSlideshow();
  });
  rerender({ section: "live" });
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await operation;
  });
  expect(mocks.navigate).not.toHaveBeenCalled();
});
it("a stale game outcome cannot unlock the fresh tab's pending operation", async () => {
  const old = deferred(),
    fresh = deferred();
  mocks.update
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(fresh.promise);
  const { result, rerender } = renderHook(
    ({ section }: { section: "live" | "screens" }) => useGameControls(section),
    { initialProps: { section: "screens" } },
  );
  let original: Promise<void> = Promise.resolve(),
    current: Promise<void> = Promise.resolve();
  act(() => {
    original = result.current.startSlideshow();
  });
  rerender({ section: "live" });
  act(() => {
    current = result.current.goLive();
  });
  expect(mocks.update).toHaveBeenCalledTimes(2);
  await act(async () => {
    old.resolve({ data: null, error: { message: "Obsolete" } });
    await original;
  });
  act(() => {
    void result.current.startSlideshow();
  });
  expect(mocks.update).toHaveBeenCalledTimes(2);
  expect(window.alert).not.toHaveBeenCalled();
  await act(async () => {
    fresh.resolve({ data: null, error: null });
    await current;
  });
});
