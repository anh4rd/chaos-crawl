import type { Page } from "@playwright/test";
import type { GameState, Vote } from "../../src/types/database";
import { installLegacyHostChallenges } from "./legacyHostChallenges";

export async function installLegacyPlayer(page: Page) {
  const fixture = await installLegacyHostChallenges(page);
  const game = fixture.backend.rows.game_state?.[0];
  if (!game || typeof game !== "object")
    throw new Error("Missing legacy game fixture");
  const votes: Vote[] = [
    {
      id: "fixture-vote",
      voter_id: "another-player",
      voted_for_player_id: "p1",
      voted_for_team_id: null,
      challenge_name: "Current challenge",
    },
  ];
  fixture.backend.rows.votes = votes;
  await page.clock.setFixedTime(new Date("2020-01-01T12:00:00Z"));
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-player-id", "p1"),
  );
  await page.route(
    (url) => url.pathname === "/rest/v1/votes",
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const url = new URL(route.request().url());
      const voter = url.searchParams.get("voter_id")?.replace(/^eq\./, "");
      const rows = votes.filter((vote) => !voter || vote.voter_id === voter);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          route.request().headers().accept?.includes("vnd.pgrst.object")
            ? (rows[0] ?? null)
            : rows,
        ),
      });
    },
  );
  return {
    ...fixture,
    setGame: (patch: Partial<GameState>) => Object.assign(game, patch),
    votes,
  };
}
