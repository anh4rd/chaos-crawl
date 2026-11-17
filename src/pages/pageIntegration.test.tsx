import { useEffect } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type {
  GameState,
  Player,
  ScoreEvent,
  Team,
  Vote,
} from "../types/database";

const mock = vi.hoisted(() => ({
  game: null as GameState | null,
  players: [] as Player[],
  teams: [] as Team[],
  votes: [] as Vote[],
  scores: [] as ScoreEvent[],
  playerId: "p1" as string | null,
  sessionError: null as Error | null,
  active: new Map<string, number>(),
  status: Object.fromEntries(
    [
      "game",
      "players",
      "teams",
      "votes",
      "scores",
      "pubs",
      "challenges",
      "side",
      "completions",
    ].map((name) => [
      name,
      {
        loading: false,
        error: null as Error | null,
        reload: vi.fn(async () => {}),
      },
    ]),
  ),
  getMyVote: vi.fn(),
  castVote: vi.fn(),
  from: vi.fn(),
  voteRounds: vi.fn(),
}));
function useDataBoundary<T>(name: string, data: T) {
  useEffect(() => {
    mock.active.set(name, (mock.active.get(name) ?? 0) + 1);
    return () => {
      mock.active.set(name, (mock.active.get(name) ?? 1) - 1);
    };
  }, [name]);
  return { data, ...mock.status[name] };
}
vi.mock("../game/hooks/useGameState", () => ({
  useGameState: () => useDataBoundary("game", mock.game),
}));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () => useDataBoundary("players", mock.players),
}));
vi.mock("../game/hooks/useTeams", () => ({
  useTeams: () => useDataBoundary("teams", mock.teams),
}));
vi.mock("../game/hooks/useVotes", () => ({
  useVotes: (round: string) => {
    mock.voteRounds(round);
    return useDataBoundary("votes", mock.votes);
  },
}));
vi.mock("../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () => useDataBoundary("scores", mock.scores),
}));
vi.mock("../game/hooks/usePubs", () => ({
  usePubs: () =>
    useDataBoundary("pubs", [{ id: 1, name: "First Pub", sort_order: 1 }]),
}));
vi.mock("../game/hooks/useChallenges", () => ({
  useChallenges: () =>
    useDataBoundary("challenges", [
      {
        id: 1,
        pub_id: 1,
        title: "First challenge",
        description: "Dance",
        points: 5,
        reveal_order: 1,
        allow_photo_upload: true,
      },
    ]),
}));
vi.mock("../game/hooks/useSideChallenges", () => ({
  useSideChallenges: function useSideChallenges() {
    return useDataBoundary("side", []);
  },
}));
vi.mock("../game/hooks/useChallengeCompletions", () => ({
  useChallengeCompletions: function useChallengeCompletions() {
    return useDataBoundary("completions", []);
  },
}));
vi.mock("../lib/playerSession", () => ({
  PLAYER_SESSION_CHANGED_EVENT: "chaos-crawl-player-session-changed",
  readPlayerSession: () =>
    mock.sessionError
      ? { status: "unavailable", playerId: null, error: mock.sessionError }
      : mock.playerId
        ? { status: "ready", playerId: mock.playerId }
        : { status: "missing", playerId: null },
  clearPlayerId: vi.fn(),
  setPlayerId: vi.fn(),
}));
vi.mock("../lib/voteApi", () => ({
  getMyVote: mock.getMyVote,
  castVote: mock.castVote,
}));
vi.mock("../lib/supabase", () => ({ supabase: { from: mock.from } }));

import VotePage from "./Vote";
import VoteResults from "./VoteResults";
import Leaderboard from "./Leaderboard";
import Admin from "./Admin-legacy";
import App from "../App";

function Location() {
  const location = useLocation();
  return <output aria-label="Location">{location.pathname}</output>;
}
function pageTree(element: React.ReactNode, search = "") {
  return (
    <MemoryRouter initialEntries={[`/view${search}`]}>
      <Routes>
        <Route path="/view" element={element} />
        <Route path="*" element={<Location />} />
      </Routes>
    </MemoryRouter>
  );
}
function score(
  id: string,
  points: number,
  player: string | null,
  team: string | null,
  title: string,
): ScoreEvent {
  return {
    id,
    player_id: player,
    team_name: team,
    challenge_type: "manual",
    challenge_id: id,
    challenge_title: title,
    points,
    reason: `${title} reason`,
    awarded_at: "2026-11-16T12:00:00Z",
  };
}
function vote(id: string, player: string | null, team: string | null): Vote {
  return {
    id,
    voter_id: `voter-${id}`,
    voted_for_player_id: player,
    voted_for_team_id: team,
    challenge_name: "First challenge",
  };
}
function activeQueries() {
  expect(
    [...mock.active.values()].every((count) => count === 0 || count === 1),
  ).toBe(true);
  return [...mock.active.entries()]
    .filter(([, count]) => count > 0)
    .map(([name]) => name)
    .sort();
}
function resultCard(name: string) {
  const item = screen.getByText(name, { selector: "strong" }).closest("li");
  if (!item)
    throw new Error(
      `Vote result ${name} must be rendered as a ranked list item.`,
    );
  return item;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.active.clear();
  mock.playerId = "p1";
  mock.sessionError = null;
  mock.game = {
    id: 1,
    current_pub: "First Pub",
    current_challenge: "First challenge",
    challenge_description: "Dance",
    current_challenge_id: 1,
    current_challenge_order: 1,
    voting_open: true,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  };
  mock.players = [
    { id: "p1", name: "Anna", team: "Ducks", score: 999 },
    { id: "p2", name: "Ben", team: "Ducks", score: 999 },
    { id: "p3", name: "Cara", team: "Pineapples", score: 999 },
  ];
  mock.teams = [
    { id: "t1", name: "Ducks" },
    { id: "t2", name: "Pineapples" },
  ];
  mock.votes = [];
  mock.scores = [];
  for (const status of Object.values(mock.status)) {
    status.loading = false;
    status.error = null;
  }
  mock.getMyVote.mockResolvedValue({ data: null, error: null });
  mock.castVote.mockResolvedValue({ data: { status: "voted" }, error: null });
  mock.from.mockImplementation(() => {
    throw new Error("Unexpected transport access");
  });
});
afterEach(cleanup);

describe("Vote route", () => {
  it.each([
    [true, false, "", "/vote-results"],
    [false, false, "", "/game"],
    [false, false, "?from=admin", "/admin"],
  ] as const)(
    "follows host state results=%s open=%s origin=%s",
    (results, open, search, expected) => {
      mock.game = {
        ...mock.game!,
        show_vote_results: results,
        voting_open: open,
      };
      render(pageTree(<VotePage />, search));
      expect(screen.getByLabelText("Location").textContent).toBe(expected);
    },
  );
  it("renders query failure and retries the failed boundary instead of showing an empty ballot", () => {
    mock.status.teams.error = new Error("Teams offline");
    render(pageTree(<VotePage />));
    expect(screen.getByRole("alert").textContent).toBe("Teams offline");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mock.status.teams.reload).toHaveBeenCalledOnce();
    expect(mock.getMyVote).not.toHaveBeenCalled();
  });
  it("shows loading until candidate data is ready", () => {
    mock.status.players.loading = true;
    render(pageTree(<VotePage />));
    expect(screen.getByText("Loading voting...")).toBeTruthy();
    expect(mock.getMyVote).not.toHaveBeenCalled();
  });
  it("resets a previous cast vote when a new challenge replaces the mounted ballot", async () => {
    mock.getMyVote.mockResolvedValueOnce({ data: { id: "old" }, error: null });
    const view = render(pageTree(<VotePage />));
    await screen.findByRole("heading", { name: "Vote Cast!" });
    mock.game = { ...mock.game!, current_challenge: "Second challenge" };
    view.rerender(pageTree(<VotePage />));
    await screen.findByRole("button", { name: "Anna Ducks" });
    expect(screen.queryByRole("heading", { name: "Vote Cast!" })).toBeNull();
    expect(mock.getMyVote).toHaveBeenLastCalledWith("p1", "Second challenge");
  });
  it("clears candidate selection when target mode changes and offers canonical team options", async () => {
    const view = render(pageTree(<VotePage />));
    fireEvent.click(await screen.findByRole("button", { name: "Anna Ducks" }));
    expect(
      screen
        .getByRole("button", { name: "Anna Ducks" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    mock.game = { ...mock.game!, voting_target: "team" };
    view.rerender(pageTree(<VotePage />));
    expect(
      (await screen.findByRole("button", { name: "Ducks" })).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Cast Vote" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Choose a team first.",
    );
    expect(mock.castVote).not.toHaveBeenCalled();
  });
  it("discards the previous session ballot when the saved player changes", async () => {
    mock.getMyVote.mockResolvedValueOnce({
      data: { id: "old-vote" },
      error: null,
    });
    const view = render(pageTree(<VotePage />));
    await screen.findByRole("heading", { name: "Vote Cast!" });
    mock.playerId = "p2";
    fireEvent(window, new Event("storage"));
    view.rerender(pageTree(<VotePage />));
    await screen.findByRole("button", { name: "Cast Vote" });
    expect(mock.getMyVote).toHaveBeenLastCalledWith("p2", "First challenge");
  });
});

describe("VoteResults page", () => {
  beforeEach(() => {
    mock.game = { ...mock.game!, show_vote_results: true, voting_open: false };
  });
  it("counts and orders personal votes without counting team-only votes", () => {
    mock.votes = [
      vote("1", "p2", null),
      vote("2", "p1", null),
      vote("3", "p2", null),
      vote("4", null, "t1"),
    ];
    render(pageTree(<VoteResults />));
    expect(mock.voteRounds).toHaveBeenCalledWith("First challenge");
    const names = screen
      .getAllByText(/^(Anna|Ben|Cara)$/, { selector: "strong" })
      .map((node) => node.textContent);
    expect(names).toEqual(["Ben", "Anna", "Cara"]);
    expect(
      within(resultCard("Ben") as HTMLElement).getByText("2"),
    ).toBeTruthy();
    expect(
      within(resultCard("Anna") as HTMLElement).getByText("1"),
    ).toBeTruthy();
  });
  it("combines canonical team IDs and legacy names into the same result", () => {
    mock.game = { ...mock.game!, voting_target: "team" };
    mock.votes = [
      vote("1", null, "t1"),
      vote("2", null, "Ducks"),
      vote("3", null, "t2"),
      vote("4", null, "missing"),
    ];
    render(pageTree(<VoteResults />));
    expect(
      within(resultCard("Ducks") as HTMLElement).getByText("2"),
    ).toBeTruthy();
    expect(
      within(resultCard("Pineapples") as HTMLElement).getByText("1"),
    ).toBeTruthy();
  });
  it("returns to the game when the host closes results", () => {
    const view = render(pageTree(<VoteResults />));
    expect(
      screen.getByRole("heading", { name: "Voting Results" }),
    ).toBeTruthy();
    mock.game = { ...mock.game!, show_vote_results: false };
    view.rerender(pageTree(<VoteResults />));
    expect(screen.getByLabelText("Location").textContent).toBe("/game");
  });
  it("shows loading and failed vote loads with the matching retry", () => {
    mock.status.votes.loading = true;
    const view = render(pageTree(<VoteResults />));
    expect(screen.getByText("Loading results...")).toBeTruthy();
    mock.status.votes.loading = false;
    mock.status.votes.error = new Error("Results offline");
    view.rerender(pageTree(<VoteResults />));
    expect(screen.getByRole("alert").textContent).toBe("Results offline");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mock.status.votes.reload).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("heading", { name: "Voting Results" }),
    ).toBeNull();
  });
});

describe("Leaderboard page", () => {
  beforeEach(() => {
    mock.scores = [
      score("a", 5, "p1", null, "Personal award"),
      score("b", -2, "p1", null, "Correction"),
      score("c", 10, null, "Ducks", "Team award"),
    ];
  });
  it("shows team totals, switches to personal totals, and clears expanded history on mode change", () => {
    render(pageTree(<Leaderboard />));
    const team = screen.getByRole("button", { name: /Ducks.*13 points/ });
    fireEvent.click(team);
    expect(
      screen.getByRole("heading", { name: "Personal award" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Team award" })).toBeTruthy();
    expect(screen.getByText("Correction reason")).toBeTruthy();
    expect(screen.getByText("-2", { selector: "strong" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Players" }));
    expect(screen.queryByRole("heading", { name: "Team award" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Anna.*3 points/ }));
    expect(
      screen.getByRole("heading", { name: "Personal award" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Team award" })).toBeNull();
    expect(screen.getByText("+5", { selector: "strong" })).toBeTruthy();
  });
  it("explains a zero-score player history and supports returning to the game", () => {
    render(pageTree(<Leaderboard />));
    fireEvent.click(screen.getByRole("button", { name: "Players" }));
    fireEvent.click(screen.getByRole("button", { name: /Cara.*0 points/ }));
    expect(screen.getByText("No points awarded yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to Game" }));
    expect(screen.getByLabelText("Location").textContent).toBe("/game");
  });
  it.each(["players", "scores"])(
    "waits for %s before presenting a result or empty state",
    (boundary) => {
      mock.status[boundary].loading = true;
      mock.players = [];
      mock.scores = [];
      render(pageTree(<Leaderboard />));
      expect(screen.getByText("Loading scores...")).toBeTruthy();
      expect(screen.queryByText("No players or teams yet.")).toBeNull();
    },
  );
  it.each(["players", "scores"])(
    "surfaces %s errors and retries that boundary",
    (boundary) => {
      mock.status[boundary].error = new Error(`${boundary} offline`);
      render(pageTree(<Leaderboard />));
      expect(screen.getByRole("alert").textContent).toBe(`${boundary} offline`);
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(mock.status[boundary].reload).toHaveBeenCalledOnce();
      expect(screen.queryByRole("heading", { name: "Leaderboard" })).toBeNull();
    },
  );
});

describe("Admin tab ownership", () => {
  it("mounts only the active feature's query boundaries and releases them when switching tabs", () => {
    render(pageTree(<Admin />));
    expect(activeQueries()).toEqual(["challenges", "game", "pubs"]);
    fireEvent.click(screen.getByRole("button", { name: "👥 Players" }));
    expect(activeQueries()).toEqual(["players", "scores"]);
    expect(
      screen
        .getByRole("button", { name: "👥 Players" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "🏁 Teams" }));
    expect(activeQueries()).toEqual(["players", "teams"]);
    expect(screen.getByRole("heading", { name: "Create Teams" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "✅ Review" }));
    expect(activeQueries()).toEqual([
      "challenges",
      "completions",
      "players",
      "side",
    ]);
    expect(screen.getByText("No completions yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "🔴 Live" }));
    expect(activeQueries()).toEqual(["challenges", "game", "pubs"]);
    expect(
      screen
        .getByRole("button", { name: "👥 Players" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
});

describe("App route registration", () => {
  it("loads the actual challenge review route and its query parameters", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      abortSignal: vi.fn(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    };
    for (const name of ["select", "eq", "order", "abortSignal"] as const)
      query[name].mockReturnValue(query);
    mock.from.mockReturnValue(query);
    render(
      <MemoryRouter
        initialEntries={[
          "/challenge-review?type=side&id=42&title=Route%20challenge",
        ]}
      >
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Route challenge" }),
    ).toBeTruthy();
    expect(
      await screen.findByText("Nobody has completed this challenge yet."),
    ).toBeTruthy();
    expect(query.eq).toHaveBeenCalledWith("challenge_type", "side");
    expect(query.eq).toHaveBeenCalledWith("challenge_id", "42");
  });
  it("gives unmatched routes a usable joining form", async () => {
    render(
      <MemoryRouter initialEntries={["/missing-route"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: /Join.*the chaos/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Enter six digit game code" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Next/ })).toBeTruthy();
    expect(mock.from).not.toHaveBeenCalled();
  });
});

it("recovers the Vote route from blocked session storage through an explicit retry", async () => {
  mock.sessionError = new Error(
    "Browser storage is blocked. Allow site storage, then try again.",
  );
  render(pageTree(<VotePage />));
  expect(screen.getByRole("alert").textContent).toContain("storage is blocked");
  expect(mock.getMyVote).not.toHaveBeenCalled();
  expect(screen.queryByText("Player session not found")).toBeNull();
  mock.sessionError = null;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("button", { name: "Cast Vote" });
  expect(mock.getMyVote).toHaveBeenCalledWith("p1", "First challenge");
});
