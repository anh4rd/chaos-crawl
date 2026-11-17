import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  error: null as Error | null,
  from: vi.fn(),
  channel: vi.fn(),
}));
const query = <T,>(data: T) => ({
  data,
  loading: false,
  error: null,
  reload: mocks.reload,
});
vi.mock("../game/hooks/useGameState", () => ({
  useGameState: () => ({
    ...query({
      current_pub: "Round One",
      current_challenge_id: 1,
      current_challenge: "Dance",
    }),
    error: mocks.error,
  }),
}));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () =>
    query([{ id: "p1", name: "Pat", team: "Ducks", score: 500 }]),
}));
vi.mock("../game/hooks/usePubs", () => ({
  usePubs: () => query([{ id: 1, name: "Round One", sort_order: 1 }]),
}));
vi.mock("../game/hooks/useChallenges", () => ({
  useChallenges: () =>
    query([{ id: 1, pub_id: 1, title: "Dance", points: 10, reveal_order: 1 }]),
}));
vi.mock("../game/hooks/useSideChallenges", () => ({
  useSideChallenges: () => query([]),
}));
vi.mock("../game/hooks/useChallengeCompletions", () => ({
  useChallengeCompletions: () => query([]),
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
  const playerRow = screen.getByRole("button", { name: "Player scores" })
    .parentElement!.parentElement!;
  expect(playerRow.textContent).toContain("Pat");
  expect(playerRow.textContent).toContain("10");
  expect(playerRow.textContent).not.toContain("500");
  fireEvent.click(screen.getByRole("button", { name: "Team scores" }));
  expect(playerRow.textContent).toContain("Ducks");
  expect(playerRow.textContent).toContain("15");
});
