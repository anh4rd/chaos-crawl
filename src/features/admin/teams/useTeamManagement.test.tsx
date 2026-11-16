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
  changeTeam: vi.fn(),
  reloadPlayers: vi.fn(),
  reloadTeams: vi.fn(),
}));
vi.mock("../../../lib/playerApi", () => ({ changeTeam: mocks.changeTeam }));
vi.mock("../../../lib/supabase", () => ({
  supabase: { from: () => ({ insert: vi.fn() }) },
}));
vi.mock("../../../game/hooks/usePlayers", () => ({
  usePlayers: () => ({
    data: [
      { id: "a", name: "Anna", team: null },
      { id: "b", name: "Bob", team: null },
    ],
    loading: false,
    error: null,
    reload: mocks.reloadPlayers,
  }),
}));
vi.mock("../../../game/hooks/useTeams", () => ({
  useTeams: () => ({
    data: [{ id: "team", name: "Ducks" }],
    loading: false,
    error: null,
    reload: mocks.reloadTeams,
  }),
}));
import { useTeamManagement } from "./useTeamManagement";
import TeamsTab from "./TeamsTab";

type Outcome = { data: null; error: null | { message: string } };
function deferred() {
  let resolve!: (value: Outcome) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<Outcome>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function management() {
  return renderHook(() =>
    useTeamManagement({
      reloadPlayers: mocks.reloadPlayers,
      reloadTeams: mocks.reloadTeams,
    }),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.reloadPlayers.mockResolvedValue(undefined);
  mocks.reloadTeams.mockResolvedValue(undefined);
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(cleanup);

it.each([
  ["a", "b"],
  ["b", "a"],
] as const)(
  "retains each player's pending state when %s completes before %s",
  async (first, second) => {
    const requests = { a: deferred(), b: deferred() };
    mocks.changeTeam.mockImplementation(
      (id: "a" | "b") => requests[id].promise,
    );
    const { result } = management();
    const operations = {} as Record<"a" | "b", Promise<void>>;
    act(() => {
      operations.a = result.current.assignTeam("a", "Ducks");
      operations.b = result.current.assignTeam("b", "Ducks");
    });
    expect([...result.current.assigningPlayerIds].sort()).toEqual(["a", "b"]);
    await act(async () => {
      requests[first].resolve({ data: null, error: null });
      await operations[first];
    });
    expect(result.current.assigningPlayerIds.has(first)).toBe(false);
    expect(result.current.assigningPlayerIds.has(second)).toBe(true);
    await act(async () => {
      requests[second].resolve({ data: null, error: null });
      await operations[second];
    });
    expect(result.current.assigningPlayerIds.size).toBe(0);
    expect(mocks.reloadPlayers).toHaveBeenCalledTimes(2);
  },
);
it("locks duplicate assignments for the same player before React rerenders", async () => {
  const request = deferred();
  mocks.changeTeam.mockReturnValue(request.promise);
  const { result } = management();
  let operation!: Promise<void>;
  act(() => {
    operation = result.current.assignTeam("a", "Ducks");
    void result.current.assignTeam("a", "Other team");
  });
  expect(mocks.changeTeam).toHaveBeenCalledExactlyOnceWith("a", "Ducks");
  await act(async () => {
    request.resolve({ data: null, error: null });
    await operation;
  });
  mocks.changeTeam.mockResolvedValue({ data: null, error: null });
  await act(async () => {
    await result.current.assignTeam("a", "Other team");
  });
  expect(mocks.changeTeam).toHaveBeenCalledTimes(2);
});
it.each(["returned", "thrown"])(
  "releases only the failed player's lock for a %s error",
  async (mode) => {
    const a = deferred(),
      b = deferred();
    mocks.changeTeam.mockImplementation((id: string) =>
      id === "a" ? a.promise : b.promise,
    );
    const { result } = management();
    let operationA!: Promise<void>, operationB!: Promise<void>;
    act(() => {
      operationA = result.current.assignTeam("a", "Ducks");
      operationB = result.current.assignTeam("b", "Ducks");
    });
    await act(async () => {
      if (mode === "thrown") a.reject(new Error("Assignment failed"));
      else a.resolve({ data: null, error: { message: "Assignment failed" } });
      await operationA;
    });
    expect(window.alert).toHaveBeenCalledWith(
      "Could not assign team: Assignment failed",
    );
    expect([...result.current.assigningPlayerIds]).toEqual(["b"]);
    expect(mocks.reloadPlayers).not.toHaveBeenCalled();
    await act(async () => {
      b.resolve({ data: null, error: null });
      await operationB;
    });
    expect(result.current.assigningPlayerIds.size).toBe(0);
  },
);
it("keeps both assignment selectors disabled until their own requests finish", async () => {
  const a = deferred(),
    b = deferred();
  mocks.changeTeam.mockImplementation((id: string) =>
    id === "a" ? a.promise : b.promise,
  );
  render(<TeamsTab />);
  const anna = screen.getByRole("combobox", {
    name: "Team for Anna",
  }) as HTMLSelectElement;
  const bob = screen.getByRole("combobox", {
    name: "Team for Bob",
  }) as HTMLSelectElement;
  fireEvent.change(anna, { target: { value: "Ducks" } });
  fireEvent.change(bob, { target: { value: "Ducks" } });
  expect(anna.disabled).toBe(true);
  expect(bob.disabled).toBe(true);
  await act(async () => a.resolve({ data: null, error: null }));
  expect(anna.disabled).toBe(false);
  expect(bob.disabled).toBe(true);
  await act(async () => b.resolve({ data: null, error: null }));
  expect(bob.disabled).toBe(false);
});
