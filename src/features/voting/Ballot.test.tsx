import {
  cleanup,
  act,
  renderHook,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Ballot from "./Ballot";
import { useBallot } from "./useBallot";
import { getMyVote, castVote } from "../../lib/voteApi";
import { clearPlayerId } from "../../lib/playerSession";
import type { Vote } from "../../types/database";
vi.mock("../../lib/voteApi", () => ({
  getMyVote: vi.fn(),
  castVote: vi.fn(),
}));
vi.mock("../../lib/playerSession", () => ({ clearPlayerId: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const players = [{ id: "p", name: "Pat", team: "Team", score: 0 }];
const teams = [{ id: "team-id", name: "Team" }];
function ui(challenge: string, target: "player" | "team" = "player") {
  return (
    <MemoryRouter>
      <Ballot
        key={challenge + target}
        playerId="p"
        challenge={challenge}
        target={target}
        players={players}
        teams={teams}
        fromAdmin={false}
      />
    </MemoryRouter>
  );
}
it("resets a completed ballot and selection when a new challenge starts", async () => {
  vi.mocked(getMyVote)
    .mockResolvedValueOnce({ data: { id: 1 } as Vote, error: null })
    .mockResolvedValueOnce({ data: null, error: null });
  const { rerender } = render(ui("Old"));
  await screen.findByRole("heading", { name: "Vote Cast!" });
  rerender(ui("New"));
  await screen.findByRole("button", { name: "Pat Team" });
  expect(screen.queryByRole("heading", { name: "Vote Cast!" })).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Pat Team" })
      .getAttribute("aria-pressed"),
  ).toBe("false");
});
it("ignores the previous challenge lookup after the new ballot is mounted", async () => {
  let oldResolve!: (value: never) => void;
  vi.mocked(getMyVote)
    .mockReturnValueOnce(
      new Promise((resolve) => {
        oldResolve = resolve;
      }),
    )
    .mockResolvedValueOnce({ data: null, error: null });
  const { rerender } = render(ui("Old"));
  rerender(ui("New"));
  await screen.findByRole("button", { name: "Pat Team" });
  oldResolve({ data: { id: 1 }, error: null } as never);
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Vote Cast!" })).toBeNull(),
  );
});
it("submits canonical team identity and reports success", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  vi.mocked(castVote).mockResolvedValue({
    data: { status: "voted" },
    error: null,
  });
  render(ui("Team challenge", "team"));
  fireEvent.click(await screen.findByRole("button", { name: "Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
  await screen.findByRole("heading", { name: "Vote Cast!" });
  expect(castVote).toHaveBeenCalledWith(
    "p",
    "Team challenge",
    {
      teamId: "team-id",
    },
    expect.any(AbortSignal),
  );
});
it("allows a retry after lookup failure instead of offering an unchecked ballot", async () => {
  vi.mocked(getMyVote)
    .mockResolvedValueOnce({ data: null, error: { message: "offline" } })
    .mockResolvedValueOnce({ data: null, error: null });
  render(ui("Round"));
  expect((await screen.findByRole("alert")).textContent).toBe("offline");
  expect(screen.queryByRole("button", { name: "Cast Vote" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("button", { name: "Cast Vote" });
});
it("recovers from a thrown submission and lets the user retry", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  vi.mocked(castVote).mockRejectedValue(new Error("connection lost"));
  render(ui("Round"));
  fireEvent.click(await screen.findByRole("button", { name: "Pat Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "connection lost",
  );
  expect(
    screen.getByRole("button", { name: "Cast Vote" }).hasAttribute("disabled"),
  ).toBe(false);
});

it("keeps a valid session and ballot open when the API reports a removed target", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  vi.mocked(castVote).mockResolvedValue({
    data: null,
    error: {
      code: "VOTE_TARGET_UNAVAILABLE",
      message: "Choose again and retry.",
    },
  });
  render(ui("Round"));
  fireEvent.click(await screen.findByRole("button", { name: "Pat Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Choose again and retry.",
  );
  expect(clearPlayerId).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Cast Vote" }).hasAttribute("disabled"),
  ).toBe(false);
});

it("clears the saved player only for a verified missing-voter outcome", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  vi.mocked(castVote).mockResolvedValue({
    data: { status: "voter-missing" },
    error: null,
  });
  render(ui("Round"));
  fireEvent.click(await screen.findByRole("button", { name: "Pat Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
  await waitFor(() => expect(clearPlayerId).toHaveBeenCalledOnce());
});

it("ignores a stale missing-voter result after switching ballot rounds", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  let finish!: (value: Awaited<ReturnType<typeof castVote>>) => void;
  vi.mocked(castVote).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { rerender } = render(ui("Old"));
  fireEvent.click(await screen.findByRole("button", { name: "Pat Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
  const signal = vi.mocked(castVote).mock.calls[0][3]!;
  rerender(ui("New"));
  expect(signal.aborted).toBe(true);
  await screen.findByRole("button", { name: "Cast Vote" });
  finish({ data: { status: "voter-missing" }, error: null });
  await waitFor(() => expect(clearPlayerId).not.toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Cast Vote" })).toBeDefined();
});

it("locks duplicate submissions immediately before React rerenders", async () => {
  vi.mocked(getMyVote).mockResolvedValue({ data: null, error: null });
  let finish!: (value: Awaited<ReturnType<typeof castVote>>) => void;
  vi.mocked(castVote).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result } = renderHook(() => useBallot("p", "Round", "player"));
  await waitFor(() => expect(result.current.hasVoted).toBe(false));
  let saving!: Promise<void>;
  act(() => {
    saving = result.current.cast("target");
    void result.current.cast("target");
  });
  expect(castVote).toHaveBeenCalledOnce();
  await act(async () => {
    finish({ data: { status: "voted" }, error: null });
    await saving;
  });
  expect(result.current.hasVoted).toBe(true);
  expect(result.current.submitting).toBe(false);
});
