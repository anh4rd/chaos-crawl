import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ChallengeCompletion } from "../../../types/database";
const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
  completions: [] as ChallengeCompletion[],
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../../lib/completionApi", () => ({
  completeChallenge: mocks.complete,
}));
vi.mock("../../../lib/mediaApi", () => ({ uploadMedia: vi.fn() }));
vi.mock("../../../game/hooks/usePlayers", () => ({
  usePlayers: () => ({
    data: [
      { id: "a", name: "Anna", team: "Ducks", score: 0 },
      { id: "b", name: "Bob", team: null, score: 0 },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../../game/hooks/useGameState", () => ({
  useGameState: () => ({
    data: { current_pub: "First Pub" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../../game/hooks/useSideChallenges", () => ({
  default: () => ({
    data: [
      {
        id: 2,
        title: "Hide a pineapple",
        description: "Keep it hidden",
        points: 5,
        active: true,
      },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../../game/hooks/useChallengeCompletions", () => ({
  default: () => ({
    data: mocks.completions,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
import ParticipationTab from "./ParticipationTab";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.complete.mockResolvedValue({ data: { id: "new" }, error: null });
  mocks.completions = [
    {
      id: "c1",
      player_id: "b",
      challenge_type: "side",
      challenge_id: "2",
      points: 5,
      photo_id: null,
      completed_at: null,
    },
    {
      id: "c2",
      player_id: "a",
      challenge_type: "main",
      challenge_id: "2",
      points: 5,
      photo_id: null,
      completed_at: null,
    },
    {
      id: "c3",
      player_id: "removed",
      challenge_type: "side",
      challenge_id: "2",
      points: 5,
      photo_id: null,
      completed_at: null,
    },
    {
      id: "c4",
      player_id: "a",
      challenge_type: "side",
      challenge_id: "3",
      points: 5,
      photo_id: null,
      completed_at: null,
    },
  ];
});
afterEach(cleanup);
function selectAnna() {
  fireEvent.change(screen.getByRole("combobox", { name: "Play as player" }), {
    target: { value: "a" },
  });
}
it("shows only live players who completed this side challenge", () => {
  render(<ParticipationTab />);
  selectAnna();
  const challenge = within(
    screen.getByRole("region", { name: "Hide a pineapple" }),
  );
  expect(challenge.getByText("✓ Bob")).toBeTruthy();
  expect(challenge.queryByText("✓ Anna")).toBeNull();
  expect(challenge.getByRole("button", { name: "✓ Mark Done" })).toBeTruthy();
});
it("uses shared completion actions for the host-selected participant", async () => {
  render(<ParticipationTab />);
  selectAnna();
  fireEvent.click(screen.getByRole("button", { name: "✓ Mark Done" }));
  await waitFor(() =>
    expect(mocks.complete).toHaveBeenCalledWith({
      playerId: "a",
      challengeType: "side",
      challengeId: 2,
      points: 5,
      photoId: null,
    }),
  );
  expect(screen.getByText("✓ Completed")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "✓ Mark Done" })).toBeNull();
  expect(screen.getByText("✓ Bob")).toBeTruthy();
});
it("keeps the host action retryable after completion fails", async () => {
  mocks.complete.mockResolvedValueOnce({
    data: null,
    error: { message: "Completion denied", code: "DENIED" },
  });
  render(<ParticipationTab />);
  selectAnna();
  fireEvent.click(screen.getByRole("button", { name: "✓ Mark Done" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Completion denied"),
  );
  expect(screen.queryByText("✓ Completed")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "✓ Mark Done" }));
  await screen.findByText("✓ Completed");
  expect(mocks.complete).toHaveBeenCalledTimes(2);
});
