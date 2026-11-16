import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rename: vi.fn(), reload: vi.fn() }));
vi.mock("../../../lib/playerApi", () => ({ renamePlayer: mocks.rename }));
import PlayerNameEditor from "./PlayerNameEditor";
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rename.mockResolvedValue({ data: null, error: null });
  mocks.reload.mockResolvedValue(undefined);
});
function editor() {
  return render(
    <PlayerNameEditor playerId="p1" name="Anna" reload={mocks.reload} />,
  );
}
it("keeps every local keystroke without waiting for a server snapshot and commits once", async () => {
  editor();
  const input = screen.getByRole("textbox", {
    name: "Name for Anna",
  }) as HTMLInputElement;
  for (const value of ["Annab", "Annabe", "Annabel"]) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe(value);
  }
  expect(mocks.rename).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
  await waitFor(() => expect(mocks.reload).toHaveBeenCalledOnce());
  expect(mocks.rename).toHaveBeenCalledExactlyOnceWith("p1", "Annabel");
  expect(input.value).toBe("Annabel");
  expect(
    (screen.getByRole("button", { name: "Save Name" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
it("preserves the draft and offers retry after a failed save", async () => {
  mocks.rename.mockResolvedValueOnce({
    data: null,
    error: { message: "Rename denied" },
  });
  editor();
  const input = screen.getByRole("textbox", {
    name: "Name for Anna",
  }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "New Anna" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe(
      "Could not rename player: Rename denied",
    ),
  );
  expect(input.value).toBe("New Anna");
  expect(mocks.reload).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save Name" }));
  await waitFor(() => expect(mocks.reload).toHaveBeenCalledOnce());
  expect(screen.queryByRole("alert")).toBeNull();
});
it("accepts form submission from Enter and guards duplicate in-flight saves", async () => {
  let resolve!: (value: unknown) => void;
  mocks.rename.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  editor();
  const input = screen.getByRole("textbox", { name: "Name for Anna" });
  fireEvent.change(input, { target: { value: " Annie " } });
  const form = input.closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(mocks.rename).toHaveBeenCalledExactlyOnceWith("p1", "Annie");
  expect(
    (
      screen.getByRole("button", {
        name: "Saving name...",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await act(async () => resolve({ data: null, error: null }));
  expect((input as HTMLInputElement).value).toBe("Annie");
});
