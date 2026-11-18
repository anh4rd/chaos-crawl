import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { GameState } from "../../types/database";
import LiveGameSelection from "./game/LiveGameSelection";
import TonightControls from "./game/TonightControls";
import TeamsView from "./teams/TeamsView";
import VotingView from "./voting/VotingView";
import ParticipationView from "./participation/ParticipationView";
const game: GameState = {
  id: 1,
  current_pub: "First pub",
  current_challenge: "Challenge",
  current_challenge_id: 1,
  current_challenge_order: 1,
  challenge_description: "",
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};
const nothing = async () => {};
afterEach(cleanup);
it("associates existing live labels with unique native selects in each composed instance", () => {
  const props = {
    game,
    selectedPub: "First pub",
    setSelectedPub: vi.fn(),
    pubs: [{ id: 1, name: "First pub", sort_order: 1 }],
    challenges: [],
    setSelectedChallenge: vi.fn(),
    sortedPubs: [{ id: 1, name: "First pub", sort_order: 1 }],
    selectedChallenge: "",
    availableChallenges: [],
    goLive: nothing,
    navigate: vi.fn(),
  };
  render(
    <>
      <LiveGameSelection {...props} />
      <LiveGameSelection {...props} />
    </>,
  );
  const pubs = screen.getAllByLabelText("Pub");
  const challenges = screen.getAllByLabelText("Challenge");
  expect(pubs).toHaveLength(2);
  expect(challenges).toHaveLength(2);
  expect(
    new Set([...pubs, ...challenges].map((control) => control.id)).size,
  ).toBe(4);
  expect(pubs.every((control) => control instanceof HTMLSelectElement)).toBe(
    true,
  );
});
it("names the existing minutes text field without introducing numeric browser coercion", () => {
  const onMinutes = vi.fn();
  render(
    <TonightControls
      game={game}
      openVoting={nothing}
      closeVoting={nothing}
      nextRoundChallenge={undefined}
      revealRoundChallenge={nothing}
      nextPub={undefined}
      moveToNextPub={nothing}
      returnEveryoneToGame={nothing}
      scheduleMinutes="10"
      setScheduleMinutes={onMinutes}
      cancelScheduledReveal={nothing}
      currentRoundChallenges={[]}
      scheduleChallenge={nothing}
      startSlideshow={nothing}
      stopSlideshow={nothing}
    />,
  );
  const input = screen.getByLabelText("Reveal in minutes");
  if (!(input instanceof HTMLInputElement))
    throw new Error("Minutes label must name an input");
  expect(input.type).toBe("text");
  fireEvent.change(input, { target: { value: "005.5" } });
  expect(onMinutes).toHaveBeenCalledExactlyOnceWith("005.5");
});
it("adds a visible team-name label and associates player names without replacing existing accessible names", () => {
  const onName = vi.fn();
  render(
    <TeamsView
      players={[
        { id: "player one", name: "Robin", team: null },
        { id: "player two", name: "Sam", team: null },
      ]}
      teams={[]}
      newTeamName=""
      creatingTeam={false}
      assigningPlayerIds={new Set()}
      onNewTeamName={onName}
      onCreateTeam={nothing}
      onAssignTeam={nothing}
    />,
  );
  const name = screen.getByLabelText("Team name");
  expect(screen.getByText("Team name", { selector: "label" })).toBeTruthy();
  fireEvent.change(name, { target: { value: "  Bears  " } });
  expect(onName).toHaveBeenCalledExactlyOnceWith("  Bears  ");
  const robin = screen.getByRole("combobox", { name: "Team for Robin" });
  const sam = screen.getByRole("combobox", { name: "Team for Sam" });
  if (
    !(robin instanceof HTMLSelectElement) ||
    !(sam instanceof HTMLSelectElement)
  )
    throw new Error("Assignments must remain native selects");
  expect(robin.labels?.[0]?.textContent).toBe("Robin");
  expect(sam.labels?.[0]?.textContent).toBe("Sam");
  expect(new Set([name.id, robin.id, sam.id]).size).toBe(3);
});
it("gives the native voting target a visible label and retains its controlled target callback", () => {
  const onTarget = vi.fn();
  render(
    <VotingView
      game={game}
      liveResults={[]}
      onTarget={onTarget}
      onOpenVoting={nothing}
      onCloseVoting={nothing}
      onCloseResults={nothing}
      onNavigate={vi.fn()}
    />,
  );
  expect(screen.getByText("Vote for", { selector: "label" })).toBeTruthy();
  const control = screen.getByRole("combobox", { name: "Vote for" });
  fireEvent.change(control, { target: { value: "team" } });
  expect(onTarget).toHaveBeenCalledExactlyOnceWith("team");
});
it("uses the existing participation heading as a native visible label while retaining its accessible name", () => {
  render(
    <ParticipationView
      gameAvailable
      players={[]}
      playerId=""
      onPlayer={vi.fn()}
      upload={<input type="file" />}
    >
      <p>Challenge cards</p>
    </ParticipationView>,
  );
  const control = screen.getByRole("combobox", { name: "Play as player" });
  if (!(control instanceof HTMLSelectElement))
    throw new Error("Participation must remain a native select");
  expect(control.labels?.[0]?.textContent).toBe("Play as a Player");
  expect(
    screen.getByRole("heading", { name: "Play as a Player" }),
  ).toBeTruthy();
});
