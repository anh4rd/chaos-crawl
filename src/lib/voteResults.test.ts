import { describe, expect, it } from "vitest";
import {
  normalizeTeamVoteId,
  tallyTeamVotes,
  tallyPlayerVotes,
} from "./voteResults";

const teams = [
  { id: "a", name: "Pineapples" },
  { id: "b", name: "Ducks" },
];
const vote = (team: string | null, player: string | null = null) => ({
  voted_for_team_id: team,
  voted_for_player_id: player,
});

describe("vote tallies", () => {
  it("combines canonical team IDs and unambiguous legacy names once", () => {
    expect(
      tallyTeamVotes(
        [vote("a"), vote("Pineapples"), vote("b"), vote("missing"), vote(null)],
        teams,
      ),
    ).toEqual([
      { id: "a", name: "Pineapples", votes: 2 },
      { id: "b", name: "Ducks", votes: 1 },
    ]);
  });
  it("prefers IDs over a colliding legacy name and rejects ambiguous names", () => {
    const collision = [
      { id: "a", name: "Same" },
      { id: "b", name: "a" },
      { id: "c", name: "Same" },
    ];
    expect(normalizeTeamVoteId("a", collision)).toBe("a");
    expect(normalizeTeamVoteId("Same", collision)).toBeNull();
    expect(
      tallyTeamVotes([vote("a")], collision).reduce(
        (sum, result) => sum + result.votes,
        0,
      ),
    ).toBe(1);
  });
  it("ranks players, includes zero-vote candidates, and excludes team-only votes", () => {
    expect(
      tallyPlayerVotes(
        [vote(null, "2"), vote("a")],
        [
          { id: 1, name: "First" },
          { id: 2, name: "Second" },
        ],
      ),
    ).toEqual([
      { id: "2", name: "Second", votes: 1 },
      { id: "1", name: "First", votes: 0 },
    ]);
  });
  it("preserves candidate photos for both player and team results", () => {
    expect(
      tallyPlayerVotes([], [{ id: "p", name: "Pat", avatar_url: "/p.jpg" }])[0]
        .avatarUrl,
    ).toBe("/p.jpg");
    expect(
      tallyTeamVotes([], [{ id: "t", name: "Team", avatar_url: "/t.jpg" }])[0]
        .avatarUrl,
    ).toBe("/t.jpg");
  });
});
