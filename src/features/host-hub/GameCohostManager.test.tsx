import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import GameCohostManager from "./GameCohostManager";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("../../lib/hostHubQueries", () => ({ readGameCohosts: mocks.list }));
vi.mock("../../lib/hostCohostCommands", () => ({
  addGameCohost: mocks.add,
  removeGameCohost: mocks.remove,
}));
vi.mock("../../components/ui/Dialog", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <dialog open>{children}</dialog>
  ),
}));

const game = {
  id: "game",
  name: "Test game",
  event_date: null,
  start_time: null,
  end_time: null,
  player_count: 8,
  venue_name: null,
  status: "planned" as const,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.add.mockResolvedValue({ data: null, error: null });
  mocks.remove.mockResolvedValue({ data: null, error: null });
});
afterEach(cleanup);

it("adds and removes a co-host and reloads the current list", async () => {
  mocks.list
    .mockResolvedValueOnce({ data: [], error: null })
    .mockResolvedValueOnce({
      data: [{ user_id: "member", email: "host@example.test" }],
      error: null,
    })
    .mockResolvedValueOnce({ data: [], error: null });
  render(<GameCohostManager game={game} onClose={vi.fn()} />);
  await screen.findByText("No co-hosts have been added.");
  fireEvent.change(screen.getByLabelText("Host email"), {
    target: { value: "host@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add co-host" }));
  await screen.findByText("host@example.test");
  expect(mocks.add).toHaveBeenCalledWith("game", "host@example.test");
  fireEvent.click(
    screen.getByRole("button", { name: "Remove host@example.test" }),
  );
  await screen.findByText("No co-hosts have been added.");
  expect(mocks.remove).toHaveBeenCalledWith("game", "member");
});

it("shows a failed operation without treating it as success", async () => {
  mocks.add.mockResolvedValue({
    data: null,
    error: { message: "No verified account." },
  });
  render(<GameCohostManager game={game} onClose={vi.fn()} />);
  await screen.findByText("No co-hosts have been added.");
  fireEvent.change(screen.getByLabelText("Host email"), {
    target: { value: "host@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add co-host" }));
  expect(await screen.findByText("No verified account.")).toBeTruthy();
  expect(mocks.list).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Host email")).toHaveProperty(
    "value",
    "host@example.test",
  );
});

it("lets the owner retry a failed list read", async () => {
  mocks.list
    .mockResolvedValueOnce({ data: null, error: { message: "Offline" } })
    .mockResolvedValueOnce({ data: [], error: null });
  render(<GameCohostManager game={game} onClose={vi.fn()} />);
  expect(await screen.findByText("Offline")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Retry loading co-hosts" }),
  );
  await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("No co-hosts have been added.")).toBeTruthy();
});
