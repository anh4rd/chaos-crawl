import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Player } from "../../types/database";
const mock = vi.hoisted(() => ({ award: vi.fn() }));
vi.mock("../../lib/scoreApi", () => ({ awardScore: mock.award }));
import { useSubmissionAward } from "./useSubmissionAward";
const player: Player = { id: "p", name: "Anna", team: "Ducks", score: 0 };
beforeEach(() => {
  vi.resetAllMocks();
  mock.award.mockResolvedValue({ data: { id: "award" }, error: null });
});
afterEach(cleanup);

it("does not submit twice while one award request is pending", async () => {
  let resolve!: (value: unknown) => void;
  mock.award.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { result } = renderHook(() =>
    useSubmissionAward(player, "main", "1", "Challenge"),
  );
  act(() => result.current.setPoints("5"));
  let first!: Promise<void>;
  act(() => {
    first = result.current.award();
    void result.current.award();
  });
  expect(mock.award).toHaveBeenCalledOnce();
  expect(result.current.awarding).toBe(true);
  await act(async () => {
    resolve({ data: { id: "award" }, error: null });
    await first;
  });
  expect(result.current.awarding).toBe(false);
  expect(result.current.notice).toBe("Awarded 5 points!");
  expect(result.current.points).toBe("");
});
it("revalidates a team recipient when live player membership changes", async () => {
  const { result, rerender } = renderHook(
    ({ actor }) => useSubmissionAward(actor, "main", "1", "Challenge"),
    { initialProps: { actor: player } },
  );
  act(() => {
    result.current.setPoints("5");
    result.current.setRecipient("team");
  });
  rerender({ actor: { ...player, team: null } });
  await act(async () => result.current.award());
  expect(result.current.error).toBe("This player is not assigned to a team.");
  expect(mock.award).not.toHaveBeenCalled();
});
it.each(["", "0", "NaN", "Infinity"])(
  "rejects invalid points %s without writing",
  async (points) => {
    const { result } = renderHook(() =>
      useSubmissionAward(player, "main", "1", "Challenge"),
    );
    act(() => result.current.setPoints(points));
    await act(async () => result.current.award());
    expect(result.current.error).toContain("finite, nonzero");
    expect(mock.award).not.toHaveBeenCalled();
  },
);
