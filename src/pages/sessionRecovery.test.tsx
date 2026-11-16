import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ voting: false, getMyVote: vi.fn() }));
const query = <T,>(data: T) => ({
  data,
  loading: false,
  error: null,
  reload: async () => {},
});
vi.mock("../game/hooks/useGameState", () => ({
  useGameState: () =>
    query({
      id: 1,
      current_pub: "First Pub",
      current_challenge: "Dance",
      current_challenge_id: 1,
      current_challenge_order: 1,
      challenge_description: "Dance together",
      voting_open: mock.voting,
      voting_target: "player",
      show_vote_results: false,
      slideshow_open: false,
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
    }),
}));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () => query([{ id: "p", name: "Pat", team: null, score: 0 }]),
}));
vi.mock("../game/hooks/useTeams", () => ({ useTeams: () => query([]) }));
vi.mock("../game/hooks/useChallenges", () => ({
  useChallenges: () => query([]),
}));
vi.mock("../game/hooks/useSideChallenges", () => ({
  useSideChallenges: () => query([]),
}));
vi.mock("../game/hooks/useChallengeCompletions", () => ({
  useChallengeCompletions: () => query([]),
}));
vi.mock("../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () => query([]),
}));
vi.mock("../lib/voteApi", () => ({
  getMyVote: mock.getMyVote,
  castVote: vi.fn(),
}));
import Game from "./Game";
import Vote from "./Vote";
beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("chaos-crawl-player-id", "p");
  mock.voting = false;
  mock.getMyVote.mockResolvedValue({ data: null, error: null });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each(["Game", "Vote"])(
  "%s retries a real blocked storage read without losing the saved session",
  async (page) => {
    mock.voting = page === "Vote";
    const blocked = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
    render(
      <MemoryRouter>{page === "Game" ? <Game /> : <Vote />}</MemoryRouter>,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Allow site storage",
    );
    expect(screen.queryByRole("button", { name: "Join Game" })).toBeNull();
    expect(mock.getMyVote).not.toHaveBeenCalled();
    blocked.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    if (page === "Game")
      await screen.findByRole("heading", { name: "First Pub" });
    else {
      await screen.findByRole("button", { name: "Cast Vote" });
      expect(mock.getMyVote).toHaveBeenCalledWith("p", "Dance");
    }
    expect(screen.queryByRole("alert")).toBeNull();
    expect(window.localStorage.getItem("chaos-crawl-player-id")).toBe("p");
  },
);
