import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostChallenges from "./HostChallenges";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../../lib/hostHubQueries", () => ({
  readHostChallengeOverview: mocks.read,
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it("shows failures, retries and renders both categories", async () => {
  mocks.read
    .mockResolvedValueOnce({ data: null, error: { message: "Offline" } })
    .mockResolvedValueOnce({
      error: null,
      data: {
        liked: [
          {
            id: "1",
            title: "Liked",
            description: null,
            source: "Saved challenge",
            status: null,
            details: { points: 0, tags: ["team", 9] },
          },
        ],
        created: [
          {
            id: "2",
            title: "Created",
            description: "Description",
            source: "Community submission",
            status: "pending",
            details: null,
          },
        ],
      },
    });
  render(<HostChallenges hostId="one" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Retry challenges" }),
  );
  expect(await screen.findByText("Liked")).toBeTruthy();
  expect(screen.getByText("points: 0")).toBeTruthy();
  expect(screen.getByText("Tags: team")).toBeTruthy();
  expect(screen.getByText("Community submission · pending")).toBeTruthy();
});

it("ignores obsolete host results and shows empty categories", async () => {
  let resolveFirst: (value: object) => void = () => {};
  mocks.read
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    )
    .mockResolvedValueOnce({ error: null, data: { liked: [], created: [] } });
  const { rerender } = render(<HostChallenges hostId="one" />);
  rerender(<HostChallenges hostId="two" />);
  expect(await screen.findAllByText("No challenges found.")).toHaveLength(2);
  await act(async () =>
    resolveFirst({
      error: null,
      data: { liked: [{ id: "old", title: "Old host" }], created: [] },
    }),
  );
  expect(screen.queryByText("Old host")).toBeNull();
});
