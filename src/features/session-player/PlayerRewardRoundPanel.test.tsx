import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PlayerRewardRoundPanel from "./PlayerRewardRoundPanel";
import type { PlayerRewardRound, SessionPlayerInfo } from "./types";

afterEach(cleanup);
it("uses player or team photos for reward candidates", () => {
  const player: SessionPlayerInfo = {
    id: "player",
    name: "Pat",
    avatar_url: null,
    score: 0,
    team_id: null,
    team_name: null,
  };
  const round: PlayerRewardRound = {
    id: "round",
    challenge_id: "challenge",
    challenge_title: "Challenge",
    method: "voting",
    target_kind: "player",
    points: 10,
    status: "open",
    votes_cast: 0,
    my_vote_player_id: null,
    my_vote_team_id: null,
    candidates: [
      {
        id: "player",
        name: "Pat",
        team_name: null,
        score: 0,
        member_count: null,
      },
    ],
    winners: [],
    leaderboard: [],
  };
  const portraits = {
    players: { player: "/pat.png" },
    teams: { team: "/team.png" },
  };
  const { rerender } = render(
    <PlayerRewardRoundPanel
      rewardRound={round}
      busyKey={null}
      voteInRewardRound={vi.fn()}
      player={player}
      portraits={portraits}
    />,
  );
  expect(
    screen
      .getByRole("button", { name: "Vote Pat" })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/pat.png");
  rerender(
    <PlayerRewardRoundPanel
      rewardRound={{
        ...round,
        target_kind: "team",
        candidates: [
          { ...round.candidates[0], id: "team", name: "Team Chaos" },
        ],
      }}
      busyKey={null}
      voteInRewardRound={vi.fn()}
      player={player}
      portraits={portraits}
    />,
  );
  expect(
    screen
      .getByRole("button", { name: "Vote Team Chaos" })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/team.png");
});
