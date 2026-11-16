import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { GameState, Player, Team, Vote } from "../../../types/database";
const mocks = vi.hoisted(() => {
  const query = <T,>(data: T) => ({
    data,
    loading: false,
    error: null as Error | null,
    reload: vi.fn().mockResolvedValue(undefined),
  });
  return {
    game: query<GameState | null>(null),
    players: query<Player[]>([]),
    teams: query<Team[]>([]),
    votes: query<Vote[]>([]),
    useVotes: vi.fn(),
    update: vi.fn(),
  };
});
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../../lib/gameApi", () => ({ updateGameState: mocks.update }));
vi.mock("../../../game/hooks/useGameState", () => ({
  useGameState: () => mocks.game,
}));
vi.mock("../../../game/hooks/usePlayers", () => ({
  usePlayers: () => mocks.players,
}));
vi.mock("../../../game/hooks/useTeams", () => ({
  useTeams: () => mocks.teams,
}));
vi.mock("../../../game/hooks/useVotes", () => ({ useVotes: mocks.useVotes }));
import VotingTab from "./VotingTab";
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.mockResolvedValue({ data: null, error: null });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "alert").mockImplementation(() => {});
  for (const query of [mocks.game, mocks.players, mocks.teams, mocks.votes]) {
    query.loading = false;
    query.error = null;
  }
  mocks.game.data = {
    id: 1,
    current_pub: "Pub",
    current_challenge: "Round A",
    challenge_description: "",
    current_challenge_id: 1,
    current_challenge_order: 1,
    voting_target: "team",
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  };
  mocks.teams.data = [{ id: "a", name: "Ducks" }];
  mocks.players.data = [];
  mocks.votes.data = ["a", "Ducks"].map((value, index) => ({
    id: index,
    voter_id: `p${index}`,
    voted_for_team_id: value,
    voted_for_player_id: null,
    challenge_name: "Round A",
  }));
  mocks.useVotes.mockReturnValue(mocks.votes);
});
it("uses the shared challenge query and counts IDs with legacy names", () => {
  render(<VotingTab />);
  expect(mocks.useVotes).toHaveBeenCalledWith("Round A");
  expect(screen.getByText("2")).toBeTruthy();
});
it.each(["game", "players", "teams", "votes"] as const)(
  "retries initial %s failures without showing empty success",
  (name) => {
    mocks[name].error = new Error(`${name} read denied`);
    render(<VotingTab />);
    expect(screen.getByRole("alert").textContent).toBe(`${name} read denied`);
    expect(screen.queryByText("Live Voting Results")).toBeNull();
    expect(screen.queryByRole("button", { name: "Open Voting" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks[name].reload).toHaveBeenCalledOnce();
  },
);
it("gates initial controls until required player data loads", () => {
  mocks.players.loading = true;
  const view = render(<VotingTab />);
  expect(screen.getByText("Loading voting controls...")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Open Voting" })).toBeNull();
  mocks.players.loading = false;
  view.rerender(<VotingTab />);
  expect(screen.getByRole("button", { name: "Open Voting" })).toBeTruthy();
});
it("keeps the last tally visible while refreshing and on refresh errors", () => {
  const view = render(<VotingTab />);
  mocks.votes.loading = true;
  view.rerender(<VotingTab />);
  expect(screen.getByText("2")).toBeTruthy();
  mocks.votes.loading = false;
  mocks.votes.error = new Error("Refresh failed");
  view.rerender(<VotingTab />);
  expect(screen.getByText("2")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Refresh failed");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mocks.votes.reload).toHaveBeenCalledOnce();
});

const transitions = [
  [
    false,
    false,
    "Open Voting",
    { voting_open: true, show_vote_results: false, slideshow_open: false },
  ],
  [
    true,
    false,
    "Close Voting & Show Results",
    { voting_open: false, show_vote_results: true, slideshow_open: false },
  ],
  [
    false,
    true,
    "Close Results & Return Everyone",
    { voting_open: false, show_vote_results: false, slideshow_open: false },
  ],
] as const;
it.each(transitions)(
  "confirms transition %s/%s using %s",
  async (voting, results, label, payload) => {
    mocks.game.data = {
      ...mocks.game.data!,
      voting_open: voting,
      show_vote_results: results,
    };
    render(<VotingTab />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledExactlyOnceWith(payload),
    );
    expect(window.confirm).toHaveBeenCalledOnce();
  },
);
it.each(transitions)(
  "honors cancellation for transition %s/%s",
  (voting, results, label) => {
    mocks.game.data = {
      ...mocks.game.data!,
      voting_open: voting,
      show_vote_results: results,
    };
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<VotingTab />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(mocks.update).not.toHaveBeenCalled();
  },
);
it("reports voting state write failures and leaves controls usable", async () => {
  mocks.update.mockResolvedValue({
    data: null,
    error: { message: "Voting denied" },
  });
  render(<VotingTab />);
  fireEvent.click(screen.getByRole("button", { name: "Open Voting" }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      "Could not open voting: Voting denied",
    ),
  );
  expect(screen.getByRole("button", { name: "Open Voting" })).toBeTruthy();
});
