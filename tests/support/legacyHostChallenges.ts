import type { Page } from "@playwright/test";
import { installSessionBackend } from "./sessionBackend";
import type { Challenge, GameState } from "../../src/types/database";

function challenge(
  id: number,
  pub_id: number | null,
  title: string,
  reveal_order: number,
): Challenge {
  return {
    id,
    pub_id,
    title,
    description: null,
    points: 10,
    reveal_order,
    allow_photo_upload: false,
  };
}

function subscriptionBindings(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("config" in payload))
    return [];
  const config = payload.config;
  if (!config || typeof config !== "object" || !("postgres_changes" in config))
    return [];
  const changes: unknown = config.postgres_changes;
  if (!Array.isArray(changes)) return [];
  return changes.map((binding: unknown, index) => {
    if (!binding || typeof binding !== "object")
      throw new Error("Invalid Realtime fixture binding");
    return { ...binding, id: index + 1 };
  });
}

export async function installLegacyHostChallenges(page: Page, empty = false) {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.routeWebSocket("**/realtime/v1/**", (socket) => {
    socket.onMessage((raw) => {
      const message: unknown = JSON.parse(String(raw));
      if (Array.isArray(message)) {
        const envelope: unknown[] = message;
        const [join, ref, topic, event, payload] = envelope;
        if (
          event === "phx_join" ||
          event === "heartbeat" ||
          event === "phx_leave"
        ) {
          socket.send(
            JSON.stringify([
              join,
              ref,
              topic,
              "phx_reply",
              {
                status: "ok",
                response:
                  event === "phx_join"
                    ? { postgres_changes: subscriptionBindings(payload) }
                    : {},
              },
            ]),
          );
        }
      } else if (message && typeof message === "object" && "event" in message) {
        if (
          message.event === "phx_join" ||
          message.event === "heartbeat" ||
          message.event === "phx_leave"
        ) {
          socket.send(
            JSON.stringify({
              ...message,
              event: "phx_reply",
              payload: {
                status: "ok",
                response:
                  message.event === "phx_join" && "payload" in message
                    ? {
                        postgres_changes: subscriptionBindings(message.payload),
                      }
                    : {},
              },
            }),
          );
        }
      }
    });
  });
  const game: GameState = {
    id: 1,
    current_pub: "First pub",
    current_challenge: "Current challenge",
    challenge_description: "",
    current_challenge_id: empty ? null : 2,
    current_challenge_order: 2,
    voting_open: false,
    voting_target: "player",
    show_vote_results: false,
    slideshow_open: false,
    scheduled_challenge_id: empty ? null : 6,
    scheduled_reveal_at: empty ? null : "2030-01-01T19:00:00.000Z",
  };
  Object.assign(backend.rows, {
    game_state: [game],
    players: [{ id: "p1", name: "Pat", team: "Ducks", score: 500 }],
    teams: [{ id: "t1", name: "Ducks" }],
    pubs: [
      { id: 2, name: "Second pub", sort_order: 2 },
      { id: 3, name: "Empty pub", sort_order: 3 },
      { id: 1, name: "First pub", sort_order: 1 },
    ],
    challenges: empty
      ? []
      : [
          challenge(4, null, "Unassigned finale", 1),
          challenge(6, 2, "Scheduled challenge", 2),
          challenge(2, 1, "Current challenge", 2),
          challenge(1, 1, "Past challenge", 1),
          {
            ...challenge(3, 2, "Later challenge", 1),
            description: "Make a scene.",
          },
          challenge(5, 404, "Orphan challenge", 2),
        ],
    side_challenges: empty
      ? []
      : [
          {
            id: 11,
            title: "Side & photo?",
            description: "Find something small.",
            points: 3,
            active: true,
          },
          {
            id: 12,
            title: "Another side task",
            description: "Find a friend.",
            points: 5,
            active: true,
          },
        ],
    challenge_completions: [
      {
        id: "side-1",
        player_id: "p1",
        challenge_type: "side",
        challenge_id: "11",
        points: 3,
        photo_id: null,
        completed_at: null,
      },
      {
        id: "side-2",
        player_id: "p1",
        challenge_type: "side",
        challenge_id: "11",
        points: 3,
        photo_id: null,
        completed_at: null,
      },
      {
        id: "main-1",
        player_id: "p1",
        challenge_type: "main",
        challenge_id: "11",
        points: 3,
        photo_id: null,
        completed_at: null,
      },
    ],
    score_events: [
      {
        id: "personal",
        player_id: "p1",
        team_name: null,
        points: 10,
        challenge_type: "main",
        challenge_id: "1",
        challenge_title: "Past challenge",
        reason: null,
        awarded_at: "2030-01-01T11:00:00Z",
      },
      {
        id: "team",
        player_id: null,
        team_name: "Ducks",
        points: 5,
        challenge_type: "manual",
        challenge_id: "bonus",
        challenge_title: "Bonus",
        reason: null,
        awarded_at: "2030-01-01T11:00:00Z",
      },
    ],
    photos: [],
  });
  const writes: Array<{ query: Record<string, string>; body: unknown }> = [];
  await page.route(
    (url) => url.pathname === "/rest/v1/game_state",
    async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      const body: unknown = route.request().postDataJSON();
      writes.push({
        query: Object.fromEntries(new URL(route.request().url()).searchParams),
        body,
      });
      if (!body || typeof body !== "object")
        throw new Error("Invalid legacy game-state fixture write");
      Object.assign(game, body);
      await route.fulfill({ status: 204, body: "" });
    },
  );
  return { backend, writes };
}
