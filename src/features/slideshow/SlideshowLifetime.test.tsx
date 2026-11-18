import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Slideshow from "../../pages/Slideshow";

const update = vi.hoisted(() => vi.fn());
vi.mock("../../lib/gameApi", () => ({ updateGameState: update }));
vi.mock("../../game/hooks/useGameState", () => ({
  useGameState: () => ({ data: { slideshow_open: true }, error: null }),
}));
vi.mock("../../game/hooks/useMedia", () => ({
  useMedia: () => ({ data: [], loading: false, error: null, reload: vi.fn() }),
}));
vi.mock("./SlideshowPlayer", () => ({
  default: ({
    end,
    ending,
    isHost,
  }: {
    end: () => void;
    ending: boolean;
    isHost: boolean;
  }) => (
    <>
      <p>{ending ? "Pending command" : "Ready command"}</p>
      {isHost && (
        <button
          onClick={() => {
            end();
            end();
          }}
        >
          End twice
        </button>
      )}
    </>
  ),
}));
function Navigation() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/elsewhere")}>Leave slideshow</button>
      <button onClick={() => navigate("/slideshow")}>Viewer role</button>
      <button onClick={() => navigate("/slideshow?host=true")}>
        Host role
      </button>
    </>
  );
}
function route() {
  return (
    <MemoryRouter initialEntries={["/slideshow?host=true"]}>
      <Navigation />
      <Routes>
        <Route path="/slideshow" element={<Slideshow />} />
        <Route path="/admin" element={<p>Admin destination</p>} />
        <Route path="/elsewhere" element={<p>Unrelated destination</p>} />
      </Routes>
    </MemoryRouter>
  );
}
function pending() {
  let finish = (_value: {
    data: null;
    error: { message: string } | null;
  }) => {};
  const promise = new Promise<{
    data: null;
    error: { message: string } | null;
  }>((resolve) => {
    finish = resolve;
  });
  return { promise, finish };
}
beforeEach(() => {
  update.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(cleanup);
it("serializes synchronous end callbacks before React commits disabled state", async () => {
  const request = pending();
  update.mockReturnValue(request.promise);
  render(route());
  fireEvent.click(screen.getByRole("button", { name: "End twice" }));
  expect(update).toHaveBeenCalledTimes(1);
  expect(window.confirm).toHaveBeenCalledTimes(1);
  await act(async () => request.finish({ data: null, error: null }));
  expect(screen.getByText("Admin destination")).toBeDefined();
});
it.each([null, { message: "Obsolete failure" }])(
  "ignores an end completion after unmount (%j)",
  async (error) => {
    const request = pending();
    update.mockReturnValue(request.promise);
    render(route());
    fireEvent.click(screen.getByRole("button", { name: "End twice" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave slideshow" }));
    expect(screen.getByText("Unrelated destination")).toBeDefined();
    await act(async () => request.finish({ data: null, error }));
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByText("Unrelated destination")).toBeDefined();
    expect(screen.queryByText("Admin destination")).toBeNull();
  },
);
it.each([null, { message: "Obsolete failure" }])(
  "ignores an end completion after host role changes (%j)",
  async (error) => {
    const request = pending();
    update.mockReturnValue(request.promise);
    render(route());
    fireEvent.click(screen.getByRole("button", { name: "End twice" }));
    fireEvent.click(screen.getByRole("button", { name: "Viewer role" }));
    await act(async () => request.finish({ data: null, error }));
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.queryByText("Admin destination")).toBeNull();
    expect(screen.getByText("Ready command")).toBeDefined();
  },
);
it("does not let an obsolete role generation release a newer end command", async () => {
  const old = pending(),
    current = pending();
  update.mockReturnValueOnce(old.promise).mockReturnValue(current.promise);
  render(route());
  fireEvent.click(screen.getByRole("button", { name: "End twice" }));
  fireEvent.click(screen.getByRole("button", { name: "Viewer role" }));
  fireEvent.click(screen.getByRole("button", { name: "Host role" }));
  fireEvent.click(screen.getByRole("button", { name: "End twice" }));
  expect(update).toHaveBeenCalledTimes(2);
  await act(async () =>
    old.finish({ data: null, error: { message: "Old failure" } }),
  );
  expect(screen.getByText("Pending command")).toBeDefined();
  expect(window.alert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "End twice" }));
  expect(update).toHaveBeenCalledTimes(2);
  await act(async () => current.finish({ data: null, error: null }));
  expect(screen.getByText("Admin destination")).toBeDefined();
});
