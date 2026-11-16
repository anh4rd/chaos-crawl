import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type {
  Challenge,
  ChallengeCompletion,
  GameState,
  Player,
  ScoreEvent,
  SideChallenge,
} from "../types/database";

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
    challenges: query<Challenge[]>([]),
    side: query<SideChallenge[]>([]),
    completions: query<ChallengeCompletion[]>([]),
    scores: query<ScoreEvent[]>([]),
    playerId: "p1" as string | null,
    navigate: vi.fn(),
    complete: vi.fn(),
    upload: vi.fn(),
  };
});
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../lib/playerSession", () => ({ getPlayerId: () => mocks.playerId }));
vi.mock("../game/hooks/useGameState", () => ({
  useGameState: () => mocks.game,
}));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () => mocks.players,
}));
vi.mock("../game/hooks/useChallenges", () => ({
  useChallenges: () => mocks.challenges,
}));
vi.mock("../game/hooks/useSideChallenges", () => ({
  default: () => mocks.side,
}));
vi.mock("../game/hooks/useChallengeCompletions", () => ({
  default: () => mocks.completions,
}));
vi.mock("../game/hooks/useScoreEvents", () => ({
  useScoreEvents: () => mocks.scores,
}));
vi.mock("../lib/completionApi", () => ({ completeChallenge: mocks.complete }));
vi.mock("../lib/mediaApi", () => ({ uploadMedia: mocks.upload }));
import Game from "./Game";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  for (const query of [
    mocks.game,
    mocks.players,
    mocks.challenges,
    mocks.side,
    mocks.completions,
    mocks.scores,
  ]) {
    query.loading = false;
    query.error = null;
  }
  mocks.game.data = {
    id: 1,
    current_pub: "First Pub",
    current_challenge: "Become Nan",
    challenge_description: "Current task",
    current_challenge_id: 1,
    current_challenge_order: 1,
    voting_open: false,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  };
  mocks.players.data = [{ id: "p1", name: "Anna", team: "Ducks", score: 999 }];
  mocks.challenges.data = [
    {
      id: 1,
      pub_id: 1,
      title: "Become Nan",
      description: "Do your impression",
      points: 10,
      reveal_order: 1,
      allow_photo_upload: false,
    },
  ];
  mocks.side.data = [
    {
      id: 2,
      title: "Hide a pineapple",
      description: "Keep it hidden",
      points: 5,
      active: true,
    },
  ];
  mocks.completions.data = [];
  mocks.scores.data = [
    {
      id: "s1",
      player_id: "p1",
      team_name: null,
      challenge_type: "manual",
      challenge_id: "m1",
      challenge_title: "Manual award",
      points: 25,
      reason: null,
      awarded_at: "2026-11-16T12:00:00Z",
    },
  ];
  mocks.playerId = "p1";
  mocks.complete.mockResolvedValue({ data: { id: "completion" }, error: null });
  mocks.upload.mockResolvedValue({ data: { id: "media" }, error: null });
});

function taskCard() {
  return (
    screen.getByText("Your Task").closest("section") ??
    screen.getByText("Your Task").parentElement!
  );
}
function bingoCard() {
  return (
    screen.getByText("Chaos Bingo").closest("section") ??
    screen.getByText("Chaos Bingo").parentElement!
  );
}

describe("player game page", () => {
  it("waits for the score ledger before showing a team total", () => {
    mocks.scores.loading = true;
    const view = render(<Game />);
    expect(screen.getByText("Loading game...")).toBeTruthy();
    expect(screen.queryByText("Team score")).toBeNull();
    mocks.scores.loading = false;
    view.rerender(<Game />);
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.queryByText("999")).toBeNull();
  });
  it("retries the query that failed and recovers the current task", () => {
    mocks.challenges.error = new Error("Challenge load failed");
    const view = render(<Game />);
    expect(screen.getByRole("alert").textContent).toBe("Challenge load failed");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.challenges.reload).toHaveBeenCalledOnce();
    mocks.challenges.error = null;
    view.rerender(<Game />);
    expect(screen.getByText("Become Nan")).toBeTruthy();
  });
  it.each([null, "deleted-player"])(
    "offers a clear rejoin action for missing player %s",
    (id) => {
      mocks.playerId = id;
      render(<Game />);
      expect(
        screen.getByText(/Your player session was not found/),
      ).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
      expect(mocks.navigate).toHaveBeenCalledWith("/join");
      expect(screen.queryByText("Your Task")).toBeNull();
    },
  );
  it("marks the current task complete and replaces its action buttons", async () => {
    render(<Game />);
    fireEvent.click(
      within(taskCard()).getByRole("button", { name: "✓ Mark Done" }),
    );
    await waitFor(() =>
      expect(mocks.complete).toHaveBeenCalledWith({
        playerId: "p1",
        challengeType: "main",
        challengeId: 1,
        points: 10,
        photoId: null,
      }),
    );
    expect(screen.getByText("✓ Challenge completed")).toBeTruthy();
    expect(
      within(taskCard()).queryByRole("button", { name: "✓ Mark Done" }),
    ).toBeNull();
  });
  it("limits main-task media to allowed tasks while keeping side media available", () => {
    const view = render(<Game />);
    expect(
      within(taskCard()).queryByRole("button", {
        name: "📸 Upload Photo / Video",
      }),
    ).toBeNull();
    expect(
      within(bingoCard()).getByRole("button", {
        name: "📸 Upload Photo / Video",
      }),
    ).toBeTruthy();
    mocks.challenges.data = [
      { ...mocks.challenges.data[0], allow_photo_upload: true },
    ];
    view.rerender(<Game />);
    expect(
      within(taskCard()).getByRole("button", {
        name: "📸 Upload Photo / Video",
      }),
    ).toBeTruthy();
  });
  it("uploads media for an allowed main task and links the resulting completion", async () => {
    mocks.challenges.data[0].allow_photo_upload = true;
    const view = render(<Game />);
    fireEvent.click(
      within(taskCard()).getByRole("button", {
        name: "📸 Upload Photo / Video",
      }),
    );
    const file = new File(["image"], "task.jpg", { type: "image/jpeg" });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(mocks.upload).toHaveBeenCalledWith(file, {
        playerId: "p1",
        playerName: "Anna",
        team: "Ducks",
        challenge: "Become Nan",
        pub: "First Pub",
        points: 10,
      }),
    );
    await waitFor(() =>
      expect(mocks.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeType: "main",
          challengeId: 1,
          photoId: "media",
        }),
      ),
    );
    expect(screen.getByText("✓ Challenge completed")).toBeTruthy();
  });
  it("completes a side task and removes it from the available bingo list", async () => {
    render(<Game />);
    fireEvent.click(
      within(bingoCard()).getByRole("button", { name: "✓ Mark Done" }),
    );
    await waitFor(() =>
      expect(mocks.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeType: "side",
          challengeId: 2,
          points: 5,
        }),
      ),
    );
    expect(screen.queryByText("Hide a pineapple")).toBeNull();
    expect(
      screen.getByText("✓ You completed all Chaos Bingo challenges."),
    ).toBeTruthy();
  });
  it.each([
    ["slideshow_open", "/slideshow"],
    ["voting_open", "/vote"],
    ["show_vote_results", "/vote-results"],
  ] as const)("redirects for %s", (flag, path) => {
    mocks.game.data = { ...mocks.game.data!, [flag]: true };
    render(<Game />);
    expect(mocks.navigate).toHaveBeenCalledWith(path, { replace: true });
  });
  it("picks results once if conflicting screen flags arrive together", () => {
    mocks.game.data = {
      ...mocks.game.data!,
      slideshow_open: true,
      voting_open: true,
      show_vote_results: true,
    };
    render(<Game />);
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/vote-results", {
      replace: true,
    });
  });
});
