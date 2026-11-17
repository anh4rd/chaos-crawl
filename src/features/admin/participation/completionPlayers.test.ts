import { expect, it } from "vitest";
import { sideChallengePlayers } from "./completionPlayers";
import type { Player } from "../../../types/database";
const anna: Player = { id: "a", name: "Anna", team: null, score: 0 };
const bob: Player = { id: "b", name: "Bob", team: null, score: 0 };
const side = (player_id: string, challenge_id: string | number) => ({
  player_id,
  challenge_id,
  challenge_type: "side" as const,
});
it("lists each player once per challenge while preserving first-completion order", () => {
  const result = sideChallengePlayers(
    [
      side("b", "2"),
      side("a", "2"),
      side("b", "2"),
      side("a", "2"),
      side("a", "3"),
    ],
    [anna, bob],
  );
  expect(result.get("2")).toEqual([bob, anna]);
  expect(result.get("3")).toEqual([anna]);
});
it("omits deleted players and other challenge types without creating empty badges", () => {
  const result = sideChallengePlayers(
    [
      side("deleted", "2"),
      { player_id: "a", challenge_id: "2", challenge_type: "main" },
      side("b", "3"),
    ],
    [anna, bob],
  );
  expect(result.has("2")).toBe(false);
  expect(result.get("3")).toEqual([bob]);
});
it("normalizes legacy numeric and string challenge IDs into one deduplicated list", () => {
  const result = sideChallengePlayers(
    [side("a", 2), side("a", "2"), side("b", "2")],
    [anna, bob],
  );
  expect([...result.keys()]).toEqual(["2"]);
  expect(result.get("2")).toEqual([anna, bob]);
});
