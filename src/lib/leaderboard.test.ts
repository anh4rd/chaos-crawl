import { expect, it } from "vitest";
import { buildLeaderboards } from "./leaderboard";
import type { Player, ScoreEvent } from "../types/database";
const players: Player[] = [
  { id: "p", name: "Pat", team: "Team", score: 999 },
  { id: "q", name: "Quinn", team: null, score: 999 },
];
function event(
  id: string,
  points: number,
  player_id: string | null,
  team_name: string | null = null,
): ScoreEvent {
  return {
    id,
    points,
    player_id,
    team_name,
    challenge_type: "manual",
    challenge_id: id,
    challenge_title: "Test",
    reason: null,
    awarded_at: "2026-01-01",
  };
}
it("accounts for personal awards, team awards and deductions exactly once", () => {
  const scores = buildLeaderboards(players, [
    event("a", 10, "p"),
    event("b", 20, null, "Team"),
    event("c", -3, "p"),
    event("d", 5, "q"),
  ]);
  expect(scores.players.map((p) => [p.id, p.score])).toEqual([
    ["p", 7],
    ["q", 5],
  ]);
  expect(scores.teams[0].score).toBe(27);
  expect(scores.teams[0].events).toHaveLength(3);
});
it("keeps direct awards for empty teams and ignores malformed points", () => {
  const scores = buildLeaderboards(players, [
    event("a", 8, null, "Empty"),
    event("b", NaN, "p"),
    event("c", 4, "missing"),
  ]);
  expect(scores.teams.map((t) => [t.id, t.score])).toEqual([
    ["Empty", 8],
    ["Team", 0],
  ]);
  expect(scores.players.every((p) => p.score === 0)).toBe(true);
});
it("prefers an explicit team target on legacy rows with both targets", () => {
  const scores = buildLeaderboards(players, [event("a", 6, "p", "Other")]);
  expect(scores.players.find((p) => p.id === "p")?.score).toBe(0);
  expect(scores.teams.find((t) => t.id === "Other")?.score).toBe(6);
});

it("projects player and team photos without changing score totals", () => {
  const scores = buildLeaderboards(
    [{ ...players[0], avatar_url: "/player.jpg" }, players[1]],
    [event("a", 6, "p")],
    [{ name: "Team", avatar_url: "/team.jpg" }],
  );
  expect(scores.players[0]).toMatchObject({
    avatarUrl: "/player.jpg",
    score: 6,
  });
  expect(scores.teams[0]).toMatchObject({ avatarUrl: "/team.jpg", score: 6 });
  expect(scores.players[1].avatarUrl).toBeUndefined();
});
