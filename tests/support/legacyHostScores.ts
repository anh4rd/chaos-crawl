import type { Page } from "@playwright/test";
import { installLegacyHostChallenges } from "./legacyHostChallenges";

export async function installLegacyHostScores(
  page: Page,
  options: { results?: boolean; empty?: boolean } = {},
) {
  const fixture = await installLegacyHostChallenges(page);
  if (options.empty) {
    fixture.backend.rows.players = [];
    fixture.backend.rows.teams = [];
    fixture.backend.rows.score_events = [];
  }
  if (options.results) {
    const game = fixture.backend.rows.game_state[0];
    if (!game || typeof game !== "object")
      throw new Error("Missing legacy game fixture");
    Object.assign(game, { show_vote_results: true });
  }
  const awards: Array<{ query: Record<string, string>; body: unknown }> = [];
  await page.route(
    (url) => url.pathname === "/rest/v1/score_events",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const body: unknown = route.request().postDataJSON();
      awards.push({
        query: Object.fromEntries(new URL(route.request().url()).searchParams),
        body,
      });
      if (
        !body ||
        typeof body !== "object" ||
        Object.keys(body).sort().join(",") !==
          "challenge_id,challenge_title,challenge_type,player_id,points,reason,team_name"
      )
        throw new Error("Unexpected legacy score insert fixture contract");
      if (fixture.backend.failures.has("score_events")) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Fixture score write failed",
            code: "FIXTURE",
          }),
        });
        return;
      }
      const saved = {
        id: `manual-score-${awards.length}`,
        awarded_at: "2026-11-17T12:00:00Z",
        ...body,
      };
      fixture.backend.rows.score_events = [
        ...fixture.backend.rows.score_events,
        saved,
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(saved),
      });
    },
  );
  return { ...fixture, awards };
}
