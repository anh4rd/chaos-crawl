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
const state = vi.hoisted(() => ({
  open: true,
  update: vi.fn(),
}));
vi.mock("../../game/hooks/useGameState", () => ({
  useGameState: () => ({
    data: { slideshow_open: state.open },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock("../../game/hooks/useMedia", () => ({
  useMedia: () => ({ data: [], loading: false, error: null, reload: vi.fn() }),
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
    (screen.getByRole("button", { name: "End Slideshow" }) as HTMLButtonElement)
      .disabled,
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
