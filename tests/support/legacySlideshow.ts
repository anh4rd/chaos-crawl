import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page, WebSocketRoute } from "@playwright/test";
import type { Media } from "../../src/types/database";
import { installLegacyHostChallenges } from "./legacyHostChallenges";

export function legacySlideshowMedia(): Media[] {
  return [
    {
      id: "photo-one",
      player_id: "p1",
      image_url: "https://media.chaos-crawl.test/photo-one.png",
      uploaded_at: "2030-01-01T12:00:03Z",
      media_type: "image",
      player_name: "Pat",
      team: "Ducks",
      challenge: "Team portrait",
      pub: "First pub",
      points: 0,
    },
    {
      id: "video-two",
      player_id: "p2",
      image_url: "https://media.chaos-crawl.test/video-two.webm",
      uploaded_at: "2030-01-01T12:00:02Z",
      media_type: "video",
      player_name: "Alex",
      team: null,
      challenge: "Best entrance",
      pub: "Second pub",
      points: 10,
    },
    {
      id: "photo-three",
      player_id: null,
      image_url: "https://media.chaos-crawl.test/photo-three.png",
      uploaded_at: "2030-01-01T12:00:01Z",
      media_type: "image",
      player_name: null,
      team: null,
      challenge: null,
      pub: null,
      points: null,
    },
  ];
}

type Binding = { id: number; table: string };
type Subscription = {
  socket: WebSocketRoute;
  topic: string;
  join: unknown;
  array: boolean;
  bindings: Binding[];
};
function bindings(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("config" in payload))
    return [];
  const config = payload.config;
  if (
    !config ||
    typeof config !== "object" ||
    !("postgres_changes" in config) ||
    !Array.isArray(config.postgres_changes)
  )
    return [];
  const changes: unknown[] = config.postgres_changes;
  return changes.map((change, index) => {
    if (
      !change ||
      typeof change !== "object" ||
      !("table" in change) ||
      typeof change.table !== "string"
    )
      throw new Error("Invalid slideshow Realtime binding");
    return { ...change, id: index + 1, table: change.table };
  });
}

export async function installLegacySlideshow(
  page: Page,
  media = legacySlideshowMedia(),
) {
  const fixture = await installLegacyHostChallenges(page);
  const reads: Array<{
    table: string;
    query: Record<string, string>;
    accept: string;
  }> = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      request.method() === "GET" &&
      ["/rest/v1/photos", "/rest/v1/game_state"].includes(url.pathname)
    )
      reads.push({
        table: url.pathname,
        query: Object.fromEntries(url.searchParams),
        accept: request.headers().accept ?? "",
      });
  });
  const game = fixture.backend.rows.game_state[0];
  if (!game || typeof game !== "object")
    throw new Error("Missing slideshow game fixture");
  Object.assign(game, {
    slideshow_open: true,
    scheduled_challenge_id: null,
    scheduled_reveal_at: null,
  });
  fixture.backend.rows.photos = media;
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-player-id", "p1"),
  );
  await page.route("https://media.chaos-crawl.test/**", async (route) => {
    const movie = route.request().url().endsWith(".webm");
    await route.fulfill({
      contentType: movie ? "video/webm" : "image/png",
      body: readFileSync(
        resolve(
          movie
            ? "tests/support/fixtures/slideshow.webm"
            : "public/chaos-logo.png",
        ),
      ),
    });
  });
  const subscriptions = new Set<Subscription>();
  await page.routeWebSocket("**/realtime/v1/**", (socket) => {
    socket.onMessage((raw) => {
      const message: unknown = JSON.parse(String(raw));
      let join: unknown,
        ref: unknown,
        topic: unknown,
        event: unknown,
        payload: unknown;
      const array = Array.isArray(message);
      if (array) {
        const envelope: unknown[] = message;
        [join, ref, topic, event, payload] = envelope;
      } else if (message && typeof message === "object") {
        join = "join_ref" in message ? message.join_ref : null;
        ref = "ref" in message ? message.ref : null;
        topic = "topic" in message ? message.topic : null;
        event = "event" in message ? message.event : null;
        payload = "payload" in message ? message.payload : null;
      }
      if (typeof topic !== "string" || typeof event !== "string")
        throw new Error("Invalid slideshow Realtime envelope");
      if (!["phx_join", "phx_leave", "heartbeat"].includes(event)) return;
      const changes = event === "phx_join" ? bindings(payload) : [];
      if (event === "phx_join")
        subscriptions.add({ socket, topic, join, array, bindings: changes });
      if (event === "phx_leave")
        for (const subscription of subscriptions)
          if (subscription.socket === socket && subscription.topic === topic)
            subscriptions.delete(subscription);
      const reply = {
        status: "ok",
        response: event === "phx_join" ? { postgres_changes: changes } : {},
      };
      socket.send(
        JSON.stringify(
          array
            ? [join, ref, topic, "phx_reply", reply]
            : {
                join_ref: join,
                ref,
                topic,
                event: "phx_reply",
                payload: reply,
              },
        ),
      );
    });
  });
  function notify(table: "photos" | "game_state") {
    for (const subscription of subscriptions) {
      const ids = subscription.bindings
        .filter((binding) => binding.table === table)
        .map((binding) => binding.id);
      if (!ids.length) continue;
      const payload = {
        ids,
        data: {
          schema: "public",
          table,
          type: "UPDATE",
          commit_timestamp: "2030-01-01T12:00:00Z",
          columns: [],
          record: { id: 1 },
          old_record: {},
        },
      };
      subscription.socket.send(
        JSON.stringify(
          subscription.array
            ? [
                subscription.join,
                null,
                subscription.topic,
                "postgres_changes",
                payload,
              ]
            : {
                join_ref: subscription.join,
                ref: null,
                topic: subscription.topic,
                event: "postgres_changes",
                payload,
              },
        ),
      );
    }
  }
  return {
    ...fixture,
    reads,
    game,
    notify,
    subscribers: (table: "photos" | "game_state") =>
      [...subscriptions].filter((subscription) =>
        subscription.bindings.some((binding) => binding.table === table),
      ).length,
  };
}
