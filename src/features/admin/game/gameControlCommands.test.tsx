import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GameState } from "../../../types/database";
const mocks = vi.hoisted(() => ({
  game: null as GameState | null,
  writes: [] as Record<string, unknown>[],
  error: null as { message: string } | null,
  navigate: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: () => ({
      update: (values: Record<string, unknown>) => {
        mocks.writes.push(values);
        return {
          eq: () => Promise.resolve({ data: null, error: mocks.error }),
        };
      },
    }),
  },
}));
vi.mock("../../../game/hooks/useGameState", () => ({
  useGameState: () => ({
    data: mocks.game,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../../game/hooks/usePubs", () => ({
  usePubs: () => ({
    data: [
      { id: 1, name: "First Pub", sort_order: 1 },
      { id: 2, name: "Next Pub", sort_order: 2 },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../../game/hooks/useChallenges", () => ({
  useChallenges: () => ({
    data: [
      {
        id: 11,
        pub_id: 1,
        title: "Shared title",
        description: "First instructions",
        points: 5,
        reveal_order: 1,
        allow_photo_upload: false,
      },
      {
        id: 22,
        pub_id: 2,
        title: "Shared title",
        description: "Next instructions",
        points: 10,
        reveal_order: 2,
        allow_photo_upload: false,
      },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
import GameControlTabs from "./GameControlTabs";
const now = Date.parse("2026-11-16T12:00:00Z");
beforeEach(() => {
  vi.clearAllMocks();
  mocks.writes = [];
  mocks.error = null;
  mocks.game = {
    id: 1,
    current_pub: "First Pub",
    current_challenge: "Shared title",
    current_challenge_id: 11,
    current_challenge_order: 1,
    challenge_description: "First instructions",
    voting_open: false,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  };
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(cleanup);
async function click(name: string | RegExp) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}
it("publishes the selected pub's challenge when titles repeat in another pub", async () => {
  render(<GameControlTabs activeTab="live" />);
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "Next Pub" },
  });
  await click("Go Live");
  expect(mocks.writes).toHaveLength(1);
  expect(mocks.writes[0]).toMatchObject({
    current_pub: "Next Pub",
    current_challenge_id: 22,
    current_challenge: "Shared title",
    challenge_description: "Next instructions",
    current_challenge_order: 2,
  });
});
it("schedules from the entered minutes and clears the schedule when advancing manually", async () => {
  const view = render(<GameControlTabs activeTab="tonight" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  await click(/Schedule This/);
  expect(mocks.writes[0]).toMatchObject({
    scheduled_challenge_id: 11,
    scheduled_reveal_at: new Date(now + 120_000).toISOString(),
  });
  mocks.game = {
    ...mocks.game!,
    scheduled_challenge_id: 11,
    scheduled_reveal_at: new Date(now + 120_000).toISOString(),
  };
  view.rerender(<GameControlTabs activeTab="tonight" />);
  await click(/Move to Next Pub/);
  expect(mocks.writes[1]).toMatchObject({
    current_pub: "Next Pub",
    current_challenge_id: 22,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
    voting_open: false,
    show_vote_results: false,
    slideshow_open: false,
  });
});
it.each(["0", "-1", "not a number", "Infinity", "1e15"])(
  "rejects invalid or overflowing scheduling input %s before a write",
  async (value) => {
    render(<GameControlTabs activeTab="tonight" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    await click(/Schedule This/);
    expect(mocks.writes).toHaveLength(0);
    expect(window.alert).toHaveBeenCalledWith(
      value === "1e15"
        ? "Enter a reveal time within the supported date range."
        : "Enter a valid number of minutes.",
    );
  },
);
it("explicitly cancels an observed schedule", async () => {
  mocks.game = {
    ...mocks.game!,
    scheduled_challenge_id: 11,
    scheduled_reveal_at: new Date(now + 120_000).toISOString(),
  };
  render(<GameControlTabs activeTab="tonight" />);
  await click("Cancel Scheduled Reveal");
  expect(mocks.writes[0]).toMatchObject({
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  });
});
it("starts and ends the slideshow only after confirmation", async () => {
  const view = render(<GameControlTabs activeTab="screens" />);
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  await click("Start Slideshow");
  expect(mocks.writes).toHaveLength(0);
  await click("Start Slideshow");
  expect(mocks.writes[0]).toMatchObject({
    slideshow_open: true,
    voting_open: false,
    show_vote_results: false,
  });
  expect(mocks.navigate).toHaveBeenCalledWith("/slideshow?host=true");
  mocks.game = { ...mocks.game!, slideshow_open: true };
  view.rerender(<GameControlTabs activeTab="screens" />);
  await click("End Slideshow");
  expect(mocks.writes[1]).toMatchObject({ slideshow_open: false });
});
it("reports a screen transition error without navigating as if it succeeded", async () => {
  mocks.error = { message: "Update denied" };
  render(<GameControlTabs activeTab="screens" />);
  await click("Start Slideshow");
  expect(window.alert).toHaveBeenCalledWith(
    "Could not start slideshow: Update denied",
  );
  expect(mocks.navigate).not.toHaveBeenCalled();
});
