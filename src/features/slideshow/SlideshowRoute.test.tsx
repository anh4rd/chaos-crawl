import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Slideshow from "../../pages/Slideshow";
const state = vi.hoisted(() => {
  const state: {
    open: boolean;
    gameMissing: boolean;
    mediaLoading: boolean;
    gameError: Error | null;
    mediaError: Error | null;
    update: ReturnType<typeof vi.fn>;
    reloadGame: ReturnType<typeof vi.fn>;
    reloadMedia: ReturnType<typeof vi.fn>;
  } = {
    open: true,
    gameMissing: false,
    mediaLoading: false,
    gameError: null,
    mediaError: null,
    update: vi.fn(),
    reloadGame: vi.fn(),
    reloadMedia: vi.fn(),
  };
  return state;
});
vi.mock("../../game/hooks/useGameState", () => ({
  useGameState: () => ({
    data: state.gameMissing ? null : { slideshow_open: state.open },
    loading: false,
    error: state.gameError,
    reload: state.reloadGame,
  }),
}));
vi.mock("../../game/hooks/useMedia", () => ({
  useMedia: () => ({
    data: [],
    loading: state.mediaLoading,
    error: state.mediaError,
    reload: state.reloadMedia,
  }),
}));
vi.mock("../../lib/gameApi", () => ({ updateGameState: state.update }));
function route(host = true) {
  return (
    <MemoryRouter initialEntries={[`/slideshow${host ? "?host=true" : ""}`]}>
      <Routes>
        <Route path="/slideshow" element={<Slideshow />} />
        <Route path="/admin" element={<p>Admin destination</p>} />
        <Route path="/game" element={<p>Game destination</p>} />
      </Routes>
    </MemoryRouter>
  );
}
beforeEach(() => {
  state.open = true;
  state.gameMissing = false;
  state.mediaLoading = false;
  state.gameError = null;
  state.mediaError = null;
  state.reloadGame.mockResolvedValue(undefined);
  state.reloadMedia.mockResolvedValue(undefined);
  state.update.mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);
it("ends the slideshow for everyone and immediately returns the host to admin", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(route());
  fireEvent.click(screen.getByRole("button", { name: "End Slideshow" }));
  expect(state.update).toHaveBeenCalledWith({ slideshow_open: false });
  await screen.findByText("Admin destination");
});
it("does not submit when the host cancels the confirmation", () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  render(route());
  fireEvent.click(screen.getByRole("button", { name: "End Slideshow" }));
  expect(state.update).not.toHaveBeenCalled();
});
it("keeps host controls usable after a failed end request", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  state.update.mockResolvedValue({ data: null, error: { message: "offline" } });
  render(route());
  fireEvent.click(screen.getByRole("button", { name: "End Slideshow" }));
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith("Could not end slideshow: offline"),
  );
  expect(
    screen
      .getByRole("button", { name: "End Slideshow" })
      .hasAttribute("disabled"),
  ).toBe(false);
  expect(screen.queryByText("Admin destination")).toBeNull();
});
it.each([true, false])(
  "returns the viewer when realtime closes the slideshow (host=%s)",
  async (host) => {
    state.open = false;
    render(route(host));
    await screen.findByText(host ? "Admin destination" : "Game destination");
  },
);

it("waits for the initial game record and initial empty media read", () => {
  state.gameMissing = true;
  const { rerender } = render(route());
  expect(screen.getByText("Loading slideshow...")).toBeDefined();
  state.gameMissing = false;
  state.mediaLoading = true;
  rerender(route());
  expect(screen.getByText("Loading slideshow...")).toBeDefined();
  state.mediaLoading = false;
  rerender(route());
  expect(
    screen.getByRole("heading", { name: "Anna's Chaos Crawl" }),
  ).toBeDefined();
});

it("prioritizes game-read feedback and retries the matching collection", async () => {
  state.gameError = new Error("Game read unavailable");
  state.mediaError = new Error("Photos unavailable");
  const { rerender } = render(route());
  expect(screen.getByRole("alert").textContent).toBe("Game read unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.reloadGame).toHaveBeenCalledOnce();
  expect(state.reloadMedia).not.toHaveBeenCalled();
  state.gameError = null;
  rerender(route());
  expect(screen.getByRole("alert").textContent).toBe("Photos unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.reloadMedia).toHaveBeenCalledOnce();
});
