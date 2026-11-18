import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  Challenge,
  ChallengeCompletion,
  GameState,
  Pub,
  SideChallenge,
} from "../types/database";
import { updateGameState } from "../lib/gameApi";
import { awardScore } from "../lib/scoreApi";
import type { ApiResult } from "../lib/apiResult";

const mocks = vi.hoisted(() => {
  const data: {
    error: Error | null;
    game: GameState | null;
    challenges: Challenge[] | null;
    pubs: Pub[] | null;
    sideChallenges: SideChallenge[] | null;
    completions: ChallengeCompletion[] | null;
  } = {
    error: null,
    game: null,
    challenges: null,
    pubs: null,
    sideChallenges: null,
    completions: null,
  };
  return {
    ...data,
    reload: vi.fn(),
    from: vi.fn(),
    channel: vi.fn(),
    navigate: vi.fn(),
  };
});
const query = <T,>(data: T) => ({
  data,
  loading: false,
  error: null,
  reload: mocks.reload,
});
vi.mock("../game/hooks/useGameState", () => ({
  useGameState: () => ({
    ...query(
      mocks.game ?? {
        current_pub: "Round One",
        current_challenge_id: 1,
        current_challenge: "Dance",
      },
    ),
    error: mocks.error,
  }),
}));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () =>
    query([{ id: "p1", name: "Pat", team: "Ducks", score: 500 }]),
}));
vi.mock("../game/hooks/usePubs", () => ({
  usePubs: () =>
    query(mocks.pubs ?? [{ id: 1, name: "Round One", sort_order: 1 }]),
}));
vi.mock("../game/hooks/useChallenges", () => ({
  useChallenges: () =>
    query(
      mocks.challenges ?? [
        { id: 1, pub_id: 1, title: "Dance", points: 10, reveal_order: 1 },
      ],
    ),
}));
vi.mock("../game/hooks/useSideChallenges", () => ({
  useSideChallenges: () => query(mocks.sideChallenges ?? []),
}));
vi.mock("../game/hooks/useChallengeCompletions", () => ({
  useChallengeCompletions: () => query(mocks.completions ?? []),
}));
vi.mock("../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () =>
    query([
      {
        id: "personal",
        player_id: "p1",
        team_name: null,
        points: 10,
        challenge_title: "Dance",
      },
      {
        id: "team",
        player_id: null,
        team_name: "Ducks",
        points: 5,
        challenge_title: "Bonus",
      },
    ]),
}));
vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => mocks.navigate,
}));
vi.mock("../lib/gameApi", () => ({ updateGameState: vi.fn() }));
vi.mock("../lib/scoreApi", () => ({ awardScore: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: vi.fn(),
  },
}));
import Admin from "./Admin";

beforeEach(() => {
  mocks.error = null;
  mocks.game = null;
  mocks.challenges = null;
  mocks.pubs = null;
  mocks.sideChallenges = null;
  mocks.completions = null;
  mocks.navigate.mockReset();
  vi.mocked(updateGameState)
    .mockReset()
    .mockResolvedValue({ data: null, error: null });
  vi.mocked(awardScore)
    .mockReset()
    .mockResolvedValue({ data: null, error: null });
  mocks.reload.mockReset();
  mocks.from.mockReturnValue({
    select: () => ({
      order: async () => ({ data: [{ id: "t1", name: "Ducks" }], error: null }),
    }),
  });
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  mocks.channel.mockReturnValue(channel);
});
afterEach(cleanup);
function openAdmin() {
  render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  );
}

it("shows query failures with a retry instead of leaving the V2 host in a loading state", async () => {
  mocks.error = new Error("The game connection failed");
  openAdmin();
  expect(screen.getByRole("alert").textContent).toContain(
    "The game connection failed",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mocks.reload).toHaveBeenCalledOnce();
});

it("uses ledger totals for V2 player scores and includes personal awards in team scores", async () => {
  openAdmin();
  fireEvent.click(screen.getByRole("button", { name: /^Scores$/ }));
  const playerRow = screen
    .getByRole("button", { name: "Player scores" })
    .closest("section");
  if (!playerRow) throw new Error("Leaderboard section missing");
  expect(playerRow.textContent).toContain("Pat");
  expect(playerRow.textContent).toContain("10");
  expect(playerRow.textContent).not.toContain("500");
  fireEvent.click(screen.getByRole("button", { name: "Team scores" }));
  expect(playerRow.textContent).toContain("Ducks");
  expect(playerRow.textContent).toContain("15");
});

function challenge(
  id: number,
  pub_id: number | null,
  title: string,
  reveal_order: number,
): Challenge {
  return {
    id,
    pub_id,
    title,
    description: null,
    points: 10,
    reveal_order,
    allow_photo_upload: false,
  };
}
function challengeGame(): GameState {
  return {
    id: 1,
    current_pub: "First pub",
    current_challenge: "Current challenge",
    challenge_description: "",
    current_challenge_id: 2,
    current_challenge_order: 2,
    voting_open: true,
    voting_target: "player",
    show_vote_results: true,
    slideshow_open: true,
    scheduled_challenge_id: 6,
    scheduled_reveal_at: "2030-01-01T19:00:00.000Z",
  };
}
function configureChallenges() {
  mocks.game = challengeGame();
  mocks.pubs = [
    { id: 2, name: "Second pub", sort_order: 2 },
    { id: 3, name: "Empty pub", sort_order: 3 },
    { id: 1, name: "First pub", sort_order: 1 },
  ];
  mocks.challenges = [
    challenge(4, null, "Unassigned finale", 1),
    challenge(6, 2, "Scheduled challenge", 2),
    challenge(2, 1, "Current challenge", 2),
    challenge(1, 1, "Past challenge", 1),
    { ...challenge(3, 2, "Later challenge", 1), description: "Make a scene." },
    challenge(5, 404, "Orphan challenge", 2),
  ];
  mocks.sideChallenges = [
    {
      id: 11,
      title: "Side & photo?",
      description: "Find something small.",
      points: 3,
      active: true,
    },
    {
      id: 12,
      title: "Another side task",
      description: "Find a friend.",
      points: 5,
      active: true,
    },
  ];
  mocks.completions = ["side", "side", "main"].map((challenge_type, index) => ({
    id: `completion-${index}`,
    player_id: "p1",
    challenge_type: challenge_type === "main" ? "main" : "side",
    challenge_id: "11",
    points: 3,
    photo_id: null,
    completed_at: null,
  }));
}
function row(title: string) {
  const element = screen
    .getByRole("heading", { name: title })
    .closest("article");
  if (!element) throw new Error(`Challenge row missing: ${title}`);
  return within(element);
}
function openChallenges() {
  openAdmin();
  fireEvent.click(screen.getByRole("button", { name: "Challenges" }));
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Pending write not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { resolve, promise };
}

it("preserves grouped challenge ordering, current/scheduled controls, fallback copy and side-only completion counts", () => {
  configureChallenges();
  openChallenges();
  expect(
    [...document.querySelectorAll(".host-v2__challenge-list-item h3")].map(
      (heading) => heading.textContent,
    ),
  ).toEqual([
    "Past challenge",
    "Current challenge",
    "Later challenge",
    "Scheduled challenge",
    "Unassigned finale",
    "Orphan challenge",
  ]);
  expect(screen.getByText("ROUND 3")).toBeTruthy();
  expect(screen.queryByText("ROUND 4")).toBeNull();
  expect(
    row("Current challenge")
      .getByRole("button", { name: "Live" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(
    row("Current challenge").queryByRole("button", {
      name: "Schedule",
    }),
  ).toBeNull();
  expect(row("Scheduled challenge").getByText("Scheduled")).toBeTruthy();
  expect(
    row("Scheduled challenge").queryByRole("button", {
      name: "Schedule",
    }),
  ).toBeNull();
  expect(row("Later challenge").getByText("Make a scene.")).toBeTruthy();
  expect(
    row("Unassigned finale").getByText("No description added."),
  ).toBeTruthy();
  expect(row("Side & photo?").getByText("2 completions recorded")).toBeTruthy();
  expect(
    row("Another side task").getByText("0 completions recorded"),
  ).toBeTruthy();
});

it("reveal stays busy until its write settles and preserves the full legacy game-state reset payload", async () => {
  configureChallenges();
  const write = deferred<ApiResult<null>>();
  vi.mocked(updateGameState).mockReturnValueOnce(write.promise);
  openChallenges();
  fireEvent.click(
    row("Later challenge").getByRole("button", { name: "Reveal" }),
  );
  expect(updateGameState).toHaveBeenCalledExactlyOnceWith({
    current_pub: "Second pub",
    current_challenge_id: 3,
    current_challenge: "Later challenge",
    challenge_description: "Make a scene.",
    current_challenge_order: 1,
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  });
  for (const button of screen.getAllByRole("button", {
    name: /^(Reveal|Schedule)$/,
  }))
    expect(button.hasAttribute("disabled")).toBe(true);
  await act(async () => {
    write.resolve({ data: null, error: null });
    await write.promise;
  });
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Challenges" })).toBeNull(),
  );
  expect(
    screen.getByRole("button", { name: "Live" }).getAttribute("aria-current"),
  ).toBe("page");
});

it("schedule uses the existing 15-minute draft and returns to live after the same pending-write contract", async () => {
  configureChallenges();
  const write = deferred<ApiResult<null>>();
  vi.mocked(updateGameState).mockReturnValueOnce(write.promise);
  vi.spyOn(Date, "now").mockReturnValue(
    new Date("2030-01-01T12:00:00Z").getTime(),
  );
  openChallenges();
  fireEvent.click(
    row("Later challenge").getByRole("button", {
      name: "Schedule",
    }),
  );
  expect(updateGameState).toHaveBeenCalledExactlyOnceWith({
    scheduled_challenge_id: 3,
    scheduled_reveal_at: "2030-01-01T12:15:00.000Z",
  });
  expect(
    row("Later challenge")
      .getByRole("button", {
        name: "Schedule",
      })
      .hasAttribute("disabled"),
  ).toBe(true);
  await act(async () => {
    write.resolve({ data: null, error: null });
    await write.promise;
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Live" }).getAttribute("aria-current"),
    ).toBe("page"),
  );
});

it("side challenge review keeps escaped title/id and admin-v2 return parameters", () => {
  configureChallenges();
  openChallenges();
  fireEvent.click(row("Side & photo?").getByRole("button", { name: "Review" }));
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(
    "/challenge-review?type=side&id=11&title=Side%20%26%20photo%3F&from=admin-v2",
  );
  expect(updateGameState).not.toHaveBeenCalled();
});

it("empty legacy challenge collections retain the side-task empty message", () => {
  configureChallenges();
  mocks.challenges = [];
  mocks.sideChallenges = [];
  openChallenges();
  expect(screen.getByText("No active side challenges found.")).toBeTruthy();
  expect(screen.queryByText("ROUND 1")).toBeNull();
  expect(screen.queryByRole("button", { name: "Review" })).toBeNull();
});

function openScores() {
  openAdmin();
  fireEvent.click(screen.getByRole("button", { name: "Scores" }));
}

it("score adjustments validate finite positive amounts and explicit player/team selection before issuing an award", () => {
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  openScores();
  fireEvent.click(screen.getByRole("button", { name: "Award points" }));
  expect(alert).toHaveBeenLastCalledWith("Choose a player first.");
  for (const value of ["0", "-2", ""]) {
    fireEvent.change(screen.getByLabelText("Points"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Award points" }));
    expect(alert).toHaveBeenLastCalledWith(
      "Enter a points amount greater than zero.",
    );
  }
  fireEvent.change(screen.getByLabelText("Points"), { target: { value: "5" } });
  fireEvent.click(
    within(screen.getByRole("group", { name: "Score target" })).getByRole(
      "button",
      { name: "Team" },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Award points" }));
  expect(alert).toHaveBeenLastCalledWith("Choose a team first.");
  expect(awardScore).not.toHaveBeenCalled();
  expect(updateGameState).not.toHaveBeenCalled();
});

it("a player award preserves the manual ledger payload and clears only the successful reason", async () => {
  vi.spyOn(Date, "now").mockReturnValue(123456789);
  vi.spyOn(Math, "random").mockReturnValue(0.125);
  openScores();
  fireEvent.change(screen.getByRole("combobox", { name: "Player" }), {
    target: { value: "p1" },
  });
  fireEvent.change(screen.getByLabelText("Points"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Reason (optional)"), {
    target: { value: "  Best costume  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Award points" }));
  await waitFor(() =>
    expect(awardScore).toHaveBeenCalledExactlyOnceWith({
      playerId: "p1",
      teamName: null,
      challengeType: "manual",
      challengeId: `manual-123456789-${(0.125).toString(36).slice(2, 7)}`,
      challengeTitle: "Best costume",
      points: 7,
      reason: "Best costume",
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByLabelText("Reason (optional)").getAttribute("value"),
    ).toBe(""),
  );
  expect(screen.getByLabelText("Points").getAttribute("value")).toBe("7");
  expect(
    screen
      .getByRole("combobox", { name: "Player" })
      .querySelector("option:checked")
      ?.getAttribute("value"),
  ).toBe("p1");
});

it("team deductions retain negative manual points and the original default reason", async () => {
  openScores();
  fireEvent.click(
    within(screen.getByRole("group", { name: "Score target" })).getByRole(
      "button",
      { name: "Team" },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Dock" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Team" }), {
    target: { value: "Ducks" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Dock points" }));
  await waitFor(() =>
    expect(awardScore).toHaveBeenCalledExactlyOnceWith({
      playerId: null,
      teamName: "Ducks",
      challengeType: "manual",
      challengeId: expect.stringMatching(/^manual-\d+-[a-z0-9]+$/),
      challengeTitle: "Host points deduction",
      points: -5,
      reason: "Host points deduction",
    }),
  );
});

it("a failed score award retains editable drafts and allows the same explicit retry", async () => {
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.mocked(awardScore).mockResolvedValueOnce({
    data: null,
    error: { message: "Score connection failed" },
  });
  openScores();
  fireEvent.change(screen.getByRole("combobox", { name: "Player" }), {
    target: { value: "p1" },
  });
  fireEvent.change(screen.getByLabelText("Reason (optional)"), {
    target: { value: "Keep this reason" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Award points" }));
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith(
      "Could not update score: Score connection failed",
    ),
  );
  expect(screen.getByLabelText("Reason (optional)").getAttribute("value")).toBe(
    "Keep this reason",
  );
  expect(
    screen
      .getByRole("button", { name: "Award points" })
      .hasAttribute("disabled"),
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Award points" }));
  await waitFor(() => expect(awardScore).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(
      screen.getByLabelText("Reason (optional)").getAttribute("value"),
    ).toBe(""),
  );
});

it("score target, action, selected team, drafts and leaderboard view survive leaving the tab", () => {
  openScores();
  fireEvent.click(
    within(screen.getByRole("group", { name: "Score target" })).getByRole(
      "button",
      { name: "Team" },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Dock" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Team" }), {
    target: { value: "Ducks" },
  });
  fireEvent.change(screen.getByLabelText("Points"), { target: { value: "9" } });
  fireEvent.change(screen.getByLabelText("Reason (optional)"), {
    target: { value: "Keep across tabs" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Team scores" }));
  fireEvent.click(screen.getByRole("button", { name: "Live" }));
  fireEvent.click(screen.getByRole("button", { name: "Scores" }));
  expect(screen.getByRole("button", { name: "Dock points" })).toBeTruthy();
  expect(
    screen
      .getByRole("combobox", { name: "Team" })
      .querySelector("option:checked")
      ?.getAttribute("value"),
  ).toBe("Ducks");
  expect(screen.getByLabelText("Points").getAttribute("value")).toBe("9");
  expect(screen.getByLabelText("Reason (optional)").getAttribute("value")).toBe(
    "Keep across tabs",
  );
  expect(
    screen
      .getByRole("button", { name: "Team scores" })
      .classList.contains("is-selected"),
  ).toBe(true);
  expect(awardScore).not.toHaveBeenCalled();
});

it("score display controls preserve slideshow and return-to-game reset commands", async () => {
  configureChallenges();
  openScores();
  fireEvent.click(screen.getByRole("button", { name: "Open slideshow" }));
  await waitFor(() =>
    expect(updateGameState).toHaveBeenNthCalledWith(1, {
      slideshow_open: true,
      voting_open: false,
      show_vote_results: false,
    }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Return everyone to game" }),
  );
  await waitFor(() =>
    expect(updateGameState).toHaveBeenNthCalledWith(2, {
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
    }),
  );
  expect(awardScore).not.toHaveBeenCalled();
});
