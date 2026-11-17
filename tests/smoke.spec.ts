import { test, expect } from "@playwright/test";

const players = [{ id: "player-1", name: "Pat", team: "Team", score: 0 }];
const defaultGame = {
  id: 1,
  current_pub: "Test Pub",
  current_challenge: "Dance",
  challenge_description: "Dance together",
  current_challenge_id: 1,
  current_challenge_order: 1,
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};

// These route checks use a deterministic backend, so opening host controls never
// reads or changes an actual event. Live multiplayer checks remain separate.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-player-id", "player-1"),
  );
  await page.routeWebSocket("**/realtime/v1/**", (socket) => {
    socket.onMessage((raw) => {
      const message = JSON.parse(String(raw));
      if (Array.isArray(message)) {
        const [join, ref, topic, event, payload] = message;
        if (event === "phx_join" || event === "heartbeat")
          socket.send(
            JSON.stringify([
              join,
              ref,
              topic,
              "phx_reply",
              {
                status: "ok",
                response: {
                  postgres_changes: (
                    payload?.config?.postgres_changes ?? []
                  ).map((filter: Record<string, unknown>, index: number) => ({
                    ...filter,
                    id: index,
                  })),
                },
              },
            ]),
          );
      } else if (
        message.event === "phx_join" ||
        message.event === "heartbeat"
      ) {
        socket.send(
          JSON.stringify({
            ...message,
            event: "phx_reply",
            payload: {
              status: "ok",
              response: {
                postgres_changes: (
                  message.payload?.config?.postgres_changes ?? []
                ).map((filter: Record<string, unknown>, index: number) => ({
                  ...filter,
                  id: index,
                })),
              },
            },
          }),
        );
      }
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname.includes("/rpc/")) {
      // These RPCs only read the public TV state. All other RPCs are forbidden
      // in this deterministic suite, including votes and host commands.
      expect([
        "/rest/v1/rpc/cc_get_session_final_slideshow",
        "/rest/v1/rpc/cc_get_session_secret_review_slideshow",
      ]).toContain(pathname);
      expect(request.method()).toBe("POST");
      expect(request.postDataJSON()).toEqual({ p_session_id: "test-session" });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ open: false, items: [] }),
      });
      return;
    }
    expect(request.method(), "Smoke tests must never mutate the database").toBe(
      "GET",
    );
    const table = new URL(request.url()).pathname.split("/").pop();
    const hash = new URL(page.url()).hash;
    const game = {
      ...defaultGame,
      voting_open:
        hash.startsWith("#/vote") && !hash.startsWith("#/vote-results"),
      show_vote_results: hash.startsWith("#/vote-results"),
      slideshow_open: hash.startsWith("#/slideshow"),
    };
    const rows: Record<string, unknown[]> = {
      game_state: [game],
      players,
      teams: [{ id: "team-1", name: "Team" }],
      pubs: [{ id: 1, name: "Test Pub", sort_order: 1 }],
      challenges: [
        {
          id: 1,
          pub_id: 1,
          title: "Dance",
          description: "Dance together",
          points: 10,
          reveal_order: 1,
          allow_photo_upload: true,
        },
      ],
      side_challenges: [],
      challenge_completions: [],
      score_events: [],
      photos: [],
      votes: [],
    };
    const data = rows[table ?? ""] ?? [];
    const object = request.headers().accept?.includes("vnd.pgrst.object");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(object ? (data[0] ?? null) : data),
    });
  });
});

for (const [path, heading] of [
  ["/", "Join the chaos"],
  ["/join", "Join the chaos"],
  ["/game", "Dance"],
  ["/legacy/join", "Join the Chaos"],
  ["/host/login", "Welcome back."],
  ["/admin", "Welcome back."],
  ["/admin-legacy", "Welcome back."],
  ["/leaderboard", "Leaderboard"],
  ["/vote", "Vote!"],
  ["/vote-results", "Voting Results"],
  ["/final-slideshow/test-session", "Slideshow is waiting"],
  ["/secret-slideshow/test-session", "Slideshow is waiting"],
  ["/slideshow?host=true", "Anna's Chaos Crawl"],
  ["/challenge-review?type=main&id=1&title=Dance", "Dance"],
] as const) {
  test(`renders ${path} through HashRouter`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`./#${path}`);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    if (path.startsWith("/slideshow"))
      await expect(
        page.getByRole("button", { name: "End Slideshow" }),
      ).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("styleguide is public, searchable and uses local demo state", async ({
  page,
}) => {
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/rest\/v1\/|\/auth\/v1\/|\/storage\/v1\//.test(request.url())) {
      backendRequests.push(request.url());
    }
  });
  await page.goto("#/styleguide");
  await expect(
    page.getByRole("heading", { name: "Build on the good stuff." }),
  ).toBeVisible();
  const catalogSize = await page.locator(".sg-catalog article").count();
  expect(catalogSize).toBeGreaterThan(0);
  await page.getByLabel("Team name", { exact: true }).fill("The Trailblazers");
  await expect(page.locator(".cc-player-profile-copy")).toContainText(
    "The Trailblazers",
  );

  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Demo recovered successfully." }),
  ).toBeVisible();

  await page.getByLabel("Search component catalog").fill("SessionGameChrome");
  await expect(page.locator(".sg-catalog article")).toHaveCount(1);
  await expect(page.locator(".sg-catalog")).toContainText(
    "SessionPlayerProfile",
  );
  await page.getByLabel("Search component catalog").fill("no-such-component");
  await expect(
    page.getByText("No components match", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator(".sg-catalog article")).toHaveCount(catalogSize);

  await page.getByRole("button", { name: "Preview guided tour" }).click();
  await expect(
    page.getByRole("dialog", { name: /STYLEGUIDE TOUR/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close tour" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(backendRequests).toEqual([]);
});
