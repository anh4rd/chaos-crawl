import type { Page } from "@playwright/test";
import { installLegacyHostScores } from "./legacyHostScores";

export async function installLegacyHostOperations(
  page: Page,
  options: { emptyRoster?: boolean; unscheduled?: boolean } = {},
) {
  const fixture = await installLegacyHostScores(page);
  if (options.emptyRoster) {
    fixture.backend.rows.players = [];
    fixture.backend.rows.teams = [];
    fixture.backend.rows.score_events = [];
  }
  if (options.unscheduled) {
    const game = fixture.backend.rows.game_state[0];
    if (!game || typeof game !== "object")
      throw new Error("Missing legacy game fixture");
    Object.assign(game, {
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
    });
  }
  const rosterWrites: Array<{
    table: string;
    method: string;
    query: Record<string, string>;
    body: unknown;
  }> = [];
  await page.route(
    (url) => ["/rest/v1/players", "/rest/v1/teams"].includes(url.pathname),
    async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fallback();
        return;
      }
      const url = new URL(request.url());
      const table = url.pathname.endsWith("/players") ? "players" : "teams";
      const body: unknown = request.postData() ? request.postDataJSON() : null;
      rosterWrites.push({
        table,
        method: request.method(),
        query: Object.fromEntries(url.searchParams),
        body,
      });
      if (fixture.backend.failures.has(table)) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Fixture legacy write failed",
            code: "FIXTURE",
          }),
        });
        return;
      }
      if (request.method() === "POST" && body && typeof body === "object") {
        const expected = table === "teams" ? "name" : "name,score,team";
        if (Object.keys(body).sort().join(",") !== expected)
          throw new Error("Unexpected legacy creation body");
        fixture.backend.rows[table] = [
          ...fixture.backend.rows[table],
          { id: `${table}-${fixture.backend.rows[table].length + 1}`, ...body },
        ];
      } else if (
        table === "players" &&
        request.method() === "PATCH" &&
        body &&
        typeof body === "object"
      ) {
        const id = url.searchParams.get("id")?.slice(3);
        const player = fixture.backend.rows.players.find(
          (row) =>
            row && typeof row === "object" && "id" in row && row.id === id,
        );
        if (!player || typeof player !== "object")
          throw new Error("Missing legacy player fixture");
        Object.assign(player, body);
      } else if (table === "players" && request.method() === "DELETE") {
        const id = url.searchParams.get("id")?.slice(3);
        fixture.backend.rows.players = fixture.backend.rows.players.filter(
          (row) =>
            !(row && typeof row === "object" && "id" in row && row.id === id),
        );
      } else throw new Error("Unexpected legacy roster fixture write");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  return { ...fixture, rosterWrites };
}
