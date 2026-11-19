import type { Page } from "@playwright/test";
import type {
  ChallengeCompletion,
  ChallengeType,
  Media,
  Player,
  ScoreEvent,
} from "../../src/types/database";
import { installLegacyPlayer } from "./legacyPlayer";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected fixture text");
  return value;
}
function nullableText(value: unknown) {
  return value === null ? null : text(value);
}
function number(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("Expected finite fixture number");
  return value;
}
function challengeType(value: unknown): ChallengeType {
  if (value !== "main" && value !== "side" && value !== "bonus")
    throw new Error("Unexpected fixture challenge type");
  return value;
}

export async function installLegacyWorkspace(page: Page) {
  const fixture = await installLegacyPlayer(page);
  const commands: { table: string; body: Record<string, unknown> }[] = [];
  const failNext = new Set<string>();
  const completions: ChallengeCompletion[] = [];
  const photos: Media[] = [];
  fixture.backend.rows.challenge_completions = completions;
  fixture.backend.rows.photos = photos;
  const timestamp = "2020-01-01T12:00:00Z";
  await page.route(
    (url) =>
      [
        "/rest/v1/players",
        "/rest/v1/votes",
        "/rest/v1/challenge_completions",
        "/rest/v1/score_events",
      ].includes(url.pathname),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const table = url.pathname.split("/").at(-1);
      if (!table) throw new Error("Missing fixture table");
      if (request.method() === "GET" && table === "challenge_completions") {
        const rows = completions.filter((row) =>
          (["player_id", "challenge_type", "challenge_id"] as const).every(
            (key) =>
              !url.searchParams.has(key) ||
              url.searchParams.get(key) === `eq.${row[key]}`,
          ),
        );
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            request.headers().accept?.includes("vnd.pgrst.object")
              ? (rows[0] ?? null)
              : rows,
          ),
        });
        return;
      }
      if (request.method() !== "POST") {
        await route.fallback();
        return;
      }
      const body: unknown = request.postDataJSON();
      if (!record(body)) throw new Error("Unexpected legacy fixture body");
      commands.push({ table, body });
      if (failNext.delete(table)) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: `Fixture ${table} write failed` }),
        });
        return;
      }
      let response: Player | ChallengeCompletion | ScoreEvent | null = null;
      if (table === "players") {
        const player: Player = {
          id: "new-player",
          name: text(body.name),
          team: nullableText(body.team),
          score: number(body.score),
        };
        fixture.backend.rows.players.push(player);
        response = player;
      } else if (table === "challenge_completions") {
        const photoId = body.photo_id;
        if (
          photoId !== null &&
          typeof photoId !== "number" &&
          typeof photoId !== "string"
        )
          throw new Error("Unexpected fixture photo ID");
        const completion: ChallengeCompletion = {
          id: `completion-${completions.length}`,
          player_id: text(body.player_id),
          challenge_type: challengeType(body.challenge_type),
          challenge_id: text(body.challenge_id),
          points: number(body.points),
          photo_id: photoId,
          completed_at: timestamp,
        };
        completions.push(completion);
        response = completion;
      } else if (table === "votes") {
        fixture.votes.push({
          id: `vote-${fixture.votes.length}`,
          voter_id: text(body.voter_id),
          voted_for_player_id: nullableText(body.voted_for_player_id),
          voted_for_team_id: nullableText(body.voted_for_team_id),
          challenge_name: text(body.challenge_name),
        });
      } else if (table === "score_events") {
        const score: ScoreEvent = {
          id: "review-award",
          player_id: nullableText(body.player_id),
          team_name: nullableText(body.team_name),
          challenge_type: challengeType(body.challenge_type),
          challenge_id: text(body.challenge_id),
          challenge_title: text(body.challenge_title),
          points: number(body.points),
          reason: nullableText(body.reason),
          awarded_at: timestamp,
        };
        fixture.backend.rows.score_events.push(score);
        response = score;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    },
  );
  return {
    ...fixture,
    commands,
    failNext,
    completions,
    photos,
    review(media: boolean) {
      completions.push({
        id: "review-completion",
        player_id: "p1",
        challenge_type: "side",
        challenge_id: "11",
        points: 3,
        photo_id: media ? "review-photo" : null,
        completed_at: timestamp,
      });
      if (media)
        photos.push({
          id: "review-photo",
          player_id: "p1",
          image_url: "/chaos-crawl/chaos-logo.png",
          uploaded_at: timestamp,
          media_type: "image",
          player_name: "Pat",
          team: "Ducks",
          challenge: "Side task",
          pub: "First pub",
          points: 3,
        });
    },
  };
}
