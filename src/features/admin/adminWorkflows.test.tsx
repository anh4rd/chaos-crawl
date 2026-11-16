import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  status: Object.fromEntries(
    [
      "game",
      "players",
      "scores",
      "pubs",
      "challenges",
      "teams",
      "side",
      "completions",
    ].map((name) => [
      name,
      {
        loading: false,
        error: null as Error | null,
        reload: vi.fn().mockResolvedValue(undefined),
      },
    ]),
  ),
  update: vi.fn(),
  add: vi.fn(),
  subtract: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  changeTeam: vi.fn(),
  reloadPlayers: vi.fn(),
  reloadScores: vi.fn(),
  reloadTeams: vi.fn(),
  insertTeam: vi.fn(),
  game: {
    id: 1,
    current_pub: "First Pub",
    current_challenge: "First challenge",
    current_challenge_id: 1,
    current_challenge_order: 1,
    challenge_description: "",
    voting_open: false,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../lib/gameApi", () => ({ updateGameState: mocks.update }));
vi.mock("../../lib/playerApi", () => ({
  addPoints: mocks.add,
  removePoints: mocks.subtract,
  renamePlayer: mocks.rename,
  deletePlayer: mocks.remove,
  changeTeam: mocks.changeTeam,
}));
vi.mock("../../lib/supabase", () => ({
  supabase: { from: () => ({ insert: mocks.insertTeam }) },
}));
vi.mock("../../game/hooks/useGameState", () => ({
  useGameState: () => ({ data: mocks.game, ...mocks.status.game }),
}));
vi.mock("../../game/hooks/usePlayers", () => ({
  usePlayers: () => ({
    data: [{ id: "p1", name: "Anna", team: null, score: 900 }],
    ...mocks.status.players,
    reload: mocks.reloadPlayers,
  }),
}));
vi.mock("../../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () => ({
    data: [{ player_id: "p1", points: 7 }],
    ...mocks.status.scores,
    reload: mocks.reloadScores,
  }),
}));
vi.mock("../../game/hooks/usePubs", () => ({
  usePubs: () => ({
    data: [
      { id: 1, name: "First Pub", sort_order: 1 },
      { id: 2, name: "Next Pub", sort_order: 2 },
    ],
    ...mocks.status.pubs,
  }),
}));
vi.mock("../../game/hooks/useChallenges", () => ({
  useChallenges: () => ({
    data: [
      {
        id: 1,
        pub_id: 1,
        title: "First challenge",
        points: 5,
        reveal_order: 1,
      },
      {
        id: 2,
        pub_id: 2,
        title: "Next challenge",
        points: 10,
        reveal_order: 1,
      },
    ],
    ...mocks.status.challenges,
  }),
}));
vi.mock("../../game/hooks/useTeams", () => ({
  useTeams: () => ({
    data: [{ id: "a", name: "Ducks" }],
    ...mocks.status.teams,
    reload: mocks.reloadTeams,
  }),
}));

vi.mock("../../game/hooks/useSideChallenges", () => ({
  useSideChallenges: () => ({ data: [], ...mocks.status.side }),
}));
vi.mock("../../game/hooks/useChallengeCompletions", () => ({
  useChallengeCompletions: () => ({ data: [], ...mocks.status.completions }),
}));

import PlayersTab from "./players/PlayersTab";
import TeamsTab from "./teams/TeamsTab";
import GameControlTabs from "./game/GameControlTabs";
import CompletionReviewTab from "./participation/CompletionReviewTab";
import ParticipationTab from "./participation/ParticipationTab";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.status.players.reload = mocks.reloadPlayers;
  mocks.status.scores.reload = mocks.reloadScores;
  mocks.status.teams.reload = mocks.reloadTeams;
  for (const status of Object.values(mocks.status)) {
    status.loading = false;
    status.error = null;
  }
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
  for (const command of [
    mocks.update,
    mocks.add,
    mocks.subtract,
    mocks.rename,
    mocks.remove,
    mocks.changeTeam,
    mocks.insertTeam,
  ])
    command.mockResolvedValue({ data: null, error: null });
});

describe("host workflows", () => {
  it("reports failed score edits and renders the event ledger total", async () => {
    mocks.add.mockResolvedValue({
      data: null,
      error: { message: "Write denied" },
    });
    render(<PlayersTab />);
    expect(screen.getByText("Score: 7")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "+5" }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Could not update score: Write denied",
      ),
    );
    expect(mocks.reloadScores).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("button", { name: "+5" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
  it("refreshes the ledger after a successful manual deduction", async () => {
    render(<PlayersTab />);
    fireEvent.click(screen.getByRole("button", { name: "-5" }));
    await waitFor(() => expect(mocks.reloadScores).toHaveBeenCalled());
    expect(mocks.subtract).toHaveBeenCalledWith("p1", 5);
  });
  it("creates teams and refreshes options without dropping a failed draft", async () => {
    mocks.insertTeam.mockResolvedValueOnce({
      error: { message: "Duplicate name" },
    });
    render(<TeamsTab />);
    const input = screen.getByPlaceholderText(
      "Team name...",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "New team" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Team" }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Could not create team: Duplicate name",
      ),
    );
    expect(input.value).toBe("New team");
    fireEvent.click(screen.getByRole("button", { name: "Create Team" }));
    await waitFor(() => expect(mocks.reloadTeams).toHaveBeenCalled());
    expect(input.value).toBe("");
  });
  it("reports team assignment failures", async () => {
    mocks.changeTeam.mockResolvedValue({ error: { message: "Not allowed" } });
    render(<TeamsTab />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Ducks" },
    });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Could not assign team: Not allowed",
      ),
    );
    expect(mocks.reloadPlayers).not.toHaveBeenCalled();
  });
  it("recovers assignment controls after a thrown transport failure", async () => {
    mocks.changeTeam.mockRejectedValueOnce(new Error("Transport offline"));
    render(<TeamsTab />);
    const assignment = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(assignment, { target: { value: "Ducks" } });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Could not assign team: Transport offline",
      ),
    );
    expect(assignment.disabled).toBe(false);
    fireEvent.change(assignment, { target: { value: "Ducks" } });
    await waitFor(() => expect(mocks.reloadPlayers).toHaveBeenCalledOnce());
  });
  it("moves rounds using pub sort order and resets shared screen state", async () => {
    render(<GameControlTabs activeTab="live" />);
    fireEvent.click(screen.getByRole("button", { name: "Move to Next Pub" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_pub: "Next Pub",
          current_challenge_id: 2,
          voting_open: false,
          show_vote_results: false,
          slideshow_open: false,
        }),
      ),
    );
  });
});

describe("admin query contracts", () => {
  const cases = [
    ["game", () => <GameControlTabs activeTab="live" />],
    ["pubs", () => <GameControlTabs activeTab="live" />],
    ["challenges", () => <GameControlTabs activeTab="live" />],
    ["players", () => <TeamsTab />],
    ["teams", () => <TeamsTab />],
    ["players", () => <PlayersTab />],
    ["scores", () => <PlayersTab />],
    ["players", () => <ParticipationTab />],
    ["game", () => <ParticipationTab />],
    ["side", () => <ParticipationTab />],
    ["completions", () => <ParticipationTab />],
    ["players", () => <CompletionReviewTab />],
    ["challenges", () => <CompletionReviewTab />],
    ["side", () => <CompletionReviewTab />],
    ["completions", () => <CompletionReviewTab />],
  ] as const;
  it.each(cases)("shows and retries an initial %s failure", (query, view) => {
    mocks.status[query].error = new Error(`${query} failed`);
    render(view());
    expect(screen.getByRole("alert").textContent).toBe(`${query} failed`);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.status[query].reload).toHaveBeenCalledOnce();
  });
  it.each(["pubs", "challenges"])(
    "waits for initial %s before offering round writes",
    (query) => {
      mocks.status[query].loading = true;
      const view = render(<GameControlTabs activeTab="live" />);
      expect(screen.getByText("Loading host control...")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Go Live" })).toBeNull();
      mocks.status[query].loading = false;
      view.rerender(<GameControlTabs activeTab="live" />);
      expect(screen.getByRole("button", { name: "Go Live" })).toBeTruthy();
    },
  );
  it("keeps existing player totals visible when a score refresh fails", () => {
    const view = render(<PlayersTab />);
    mocks.status.scores.error = new Error("Ledger refresh failed");
    view.rerender(<PlayersTab />);
    expect(screen.getByText("Score: 7")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.reloadScores).toHaveBeenCalledOnce();
  });
});
