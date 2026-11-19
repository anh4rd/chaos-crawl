import SessionFinalRound from "./SessionFinalRound";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import SessionChallengeCard from "./SessionChallengeCard";
import SessionNavigation from "./SessionNavigation";
import SessionRewardRound from "./SessionRewardRound";
import SessionVotingCard from "./SessionVotingCard";
import type { RewardPresentation, VotingEntry } from "./types";

afterEach(cleanup);

it("preserves the reward presentation for secret mission cards", () => {
  const { container } = render(
    <SessionChallengeCard
      id="mission-1"
      kind="secret"
      title="Find the clue"
      description="Look under the red table."
      points={15}
    >
      <strong>SECRET MISSION</strong>
    </SessionChallengeCard>,
  );
  expect(
    container.querySelector("article.session-challenge-card--secret"),
  ).not.toBeNull();
  expect(screen.getByText("Mission reward: +15 pts")).toBeTruthy();
  expect(screen.getByText("SECRET MISSION")).toBeTruthy();
});

it("exposes host navigation only when requested and preserves link navigation", () => {
  const { rerender } = render(
    <MemoryRouter>
      <SessionNavigation
        active="game"
        hrefFor={(section) => `/play/123456/${section}`}
        challengeCount={2}
      />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("link", { name: "Host" })).toBeNull();
  expect(
    screen.getByRole("link", { name: "Challenges" }).getAttribute("href"),
  ).toBe("/play/123456/side-challenges");
  const onSelect = vi.fn();
  rerender(
    <SessionNavigation active="game" showHost showFinal onSelect={onSelect} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Host" }));
  expect(onSelect).toHaveBeenCalledWith("host-controls");
});

const entry: VotingEntry = {
  id: "evidence",
  participant: { name: "Alex" },
  challengeTitle: "Entrance",
  media: {
    id: "evidence",
    url: "/fixture.png",
    mediaType: "image",
    description: "Entrance photo",
  },
  selected: false,
  winner: true,
  voteCount: 7,
  voters: [{ id: "sam", name: "Private voter" }],
};
it("keeps counts, winners and voter identities hidden while voting is open, including read-only views", () => {
  const { rerender } = render(<SessionVotingCard entry={entry} open />);
  expect(screen.queryByText("7 votes")).toBeNull();
  expect(screen.queryByText("Top submission")).toBeNull();
  expect(screen.queryByText("Private voter")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  const vote = vi.fn();
  rerender(<SessionVotingCard entry={entry} open onVote={vote} />);
  fireEvent.click(screen.getByRole("button", { name: "Vote for this" }));
  expect(vote).toHaveBeenCalledOnce();
  rerender(<SessionVotingCard entry={entry} open={false} />);
  expect(screen.getByText("7 votes")).toBeTruthy();
  expect(screen.getByText("Top submission")).toBeTruthy();
  expect(screen.getByText("Private voter")).toBeTruthy();
});
const round: RewardPresentation = {
  title: "Entrance",
  method: "voting",
  target: "player",
  points: 20,
  completed: false,
  votesCast: 2,
  candidates: [{ id: "alex", name: "Alex", detail: "Solo" }],
  winners: [
    { id: "alex", name: "Alex", points: 20, votes: 2 },
    { id: "sam", name: "Sam", points: 20, votes: 2 },
  ],
  leaderboard: [],
};
it("renders the same reward round read-only or interactive and releases tied results only after completion", () => {
  const { rerender } = render(<SessionRewardRound round={round} />);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByText("Points awarded!")).toBeNull();
  const vote = vi.fn();
  rerender(<SessionRewardRound round={round} onVote={vote} />);
  fireEvent.click(screen.getByRole("button", { name: "Vote Alex" }));
  expect(vote).toHaveBeenCalledWith("alex");
  rerender(<SessionRewardRound round={{ ...round, completed: true }} />);
  expect(screen.getAllByText(/\+20 pts/)).toHaveLength(2);
  expect(screen.queryByRole("button")).toBeNull();
});

it("does not publish a final leaderboard from a stale completion flag while voting remains open", () => {
  const { rerender } = render(
    <SessionFinalRound
      title="Final"
      points={20}
      galleryOpen
      votingOpen
      completed
      entries={[entry]}
      leaderboard={[
        { id: "private-leader", name: "Unpublished leader", score: 777 },
      ]}
    />,
  );
  expect(
    screen.queryByRole("heading", { name: "Updated leaderboard" }),
  ).toBeNull();
  expect(screen.queryByText("Unpublished leader")).toBeNull();
  expect(screen.queryByText("7 votes")).toBeNull();
  rerender(
    <SessionFinalRound
      title="Final"
      points={20}
      galleryOpen
      votingOpen={false}
      completed
      entries={[entry]}
      leaderboard={[
        { id: "private-leader", name: "Unpublished leader", score: 777 },
      ]}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Updated leaderboard" }),
  ).toBeTruthy();
  expect(screen.getByText("Unpublished leader")).toBeTruthy();
  expect(screen.getByText("7 votes")).toBeTruthy();
});
