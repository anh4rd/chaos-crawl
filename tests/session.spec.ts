import { expect, test } from "@playwright/test";
import {
  installSessionBackend,
  sessionCode,
  sessionId,
} from "./support/sessionBackend";

test("V2 player retains credentials and can move between game sections", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Scores", exact: true }).first().click();
  await expect(page).toHaveURL(/\/leaderboard$/);
  await expect(page.getByText("Pat", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("link", { name: "Challenges", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-session-player:123456"),
    ),
  ).toBe("test-player-token");
  expect(
    backend.requests.find((r) => r.name === "cc_get_game_session_view")?.body,
  ).toEqual({ p_join_code: sessionCode, p_player_token: "test-player-token" });
  expect(errors).toEqual([]);
  backend.verify();
});

test("missing V2 credentials lead to recovery without a player lookup", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Rejoin the chaos" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Rejoin game", exact: true }).click();
  await expect(page).toHaveURL(/join\?code=123456&returning=1$/);
  expect(
    backend.requests.some((r) => r.name === "cc_get_game_session_view"),
  ).toBe(false);
  backend.verify();
});

test("authenticated host can open a lobby and navigate setup", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Share the invite", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(sessionCode, { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Next/i }).first().click();
  await expect(
    page.getByRole("heading", { name: "Join your game", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.some(
      (r) => r.name === "cc_host_dispatch_due_secret_missions",
    ),
  ).toBe(true);
  backend.verify();
});

test("host planning saves its existing payload and launches a saved game", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/games/new");
  await page.getByLabel("Game name", { exact: true }).fill("Regression draft");
  const next = page.getByRole("button", { name: /Next: Players/i }).first();
  await next.click();
  await page
    .getByRole("button", { name: /Save draft/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/test-plan\/edit$/);
  const save = backend.requests.find(
    (r) => r.name === "host_games" && r.method === "POST",
  );
  expect(save?.body).toMatchObject({
    name: "Regression draft",
    status: "draft",
    plan_data: {
      version: 3,
      locationMode: "single-venue",
      noVenueChanges: true,
    },
  });
  await page.goto("#/host");
  await page
    .getByRole("button", { name: /Play game|Launch game|Open game/i })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/host/live/${sessionId}$`));
  expect(
    backend.requests.find((r) => r.name === "cc_host_create_game_session")
      ?.body,
  ).toEqual({ p_host_game_id: "test-plan" });
  backend.verify();
});

test("game inspector opens by keyboard, contains focus, and returns it on Escape", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/super-admin");
  const inspect = page.getByRole("button", { name: /Inspect|View/i }).first();
  await inspect.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Game inspector" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Regression party" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(inspect).toBeFocused();
  backend.verify();
});

test("a failed session lookup offers recovery instead of a permanent loading screen", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.failures.add("cc_get_game_session_view");
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "We lost your place." }),
  ).toBeVisible();
  await expect(
    page.getByText("Fixture connection failed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Rejoin with mobile number" }),
  ).toBeVisible();
  backend.verify();
});

test("a failed draft save leaves the editable plan and reports the failure", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.failures.add("host_games");
  await page.goto("#/host/games/new");
  await page.getByLabel("Game name", { exact: true }).fill("Unsaved draft");
  const next = page.getByRole("button", { name: /Next: Players/i }).first();
  await next.click();
  await page.getByRole("button", { name: /Save draft/i }).click();
  await expect(page.getByRole("alert")).toHaveText("Fixture connection failed");
  await expect(page).toHaveURL(/\/games\/new$/);
  await expect(page.getByRole("button", { name: /Save draft/i })).toBeEnabled();
  backend.verify();
});

test("a failed host session read reports an error and preserves the way back to the hub", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.failures.add("cc_game_sessions");
  await page.goto(`#/host/live/${sessionId}`);
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(
    page.getByRole("link", { name: "Back to Host Hub" }),
  ).toBeVisible();
  backend.verify();
});

test("host and player use the shared session frame with role-specific navigation", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/play/${sessionCode}`);
  await expect(page.locator('main[data-session-role="player"]')).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Game pages" })
      .getByRole("link", { name: "Scores", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation").getByText("Host", { exact: true }),
  ).toHaveCount(0);
  await page.goto(`#/host/live/${sessionId}`);
  await expect(page.locator('main[data-session-role="host"]')).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Game pages" })
      .getByRole("button", { name: "Host", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.some(
      (request) => request.name === "cc_host_join_as_player",
    ),
  ).toBe(false);
  backend.verify();
});

test("host joins explicitly and uploads and submits inline using the host player token", async ({
  page,
  context,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await expect(page.locator(".session-profile h1")).toHaveText("Test Host");
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Challenges", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Upload evidence for Find a pineapple", { exact: true })
    .setInputFiles({
      name: "pineapple.png",
      mimeType: "image/png",
      buffer: Buffer.from("fixture image"),
    });
  await expect(page.locator(".evidence-gallery img")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Mark challenge complete", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Approved · +5 points" }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/host/live/${sessionId}$`));
  expect(context.pages()).toHaveLength(1);
  const register = backend.requests.find(
    (request) => request.name === "cc_player_add_session_evidence",
  );
  expect(register?.body).toMatchObject({
    p_player_token: "host-player-token",
    p_challenge_id: "test-side-challenge",
    p_secret_assignment_id: null,
  });
  expect(
    (register?.body as { p_storage_path: string }).p_storage_path,
  ).toContain(`${sessionId}/host-player/`);
  expect(
    backend.requests.find(
      (request) => request.name === "cc_player_submit_session_challenge",
    )?.body,
  ).toEqual({
    p_join_code: sessionCode,
    p_player_token: "host-player-token",
    p_challenge_id: "test-side-challenge",
  });
  backend.verify();
});

const rewardFixture = {
  id: "reward-1",
  challenge_id: "test-challenge",
  challenge_title: "Entrance reward",
  method: "voting",
  target_kind: "player",
  points: 20,
  status: "open",
  votes_cast: 2,
  my_vote_player_id: null,
  my_vote_team_id: null,
  candidates: [
    {
      id: "test-player",
      name: "Pat",
      team_name: null,
      score: 20,
      member_count: null,
    },
  ],
  winners: [
    { id: "test-player", kind: "player", name: "Pat", points: 20, votes: 2 },
    {
      id: "host-player",
      kind: "player",
      name: "Test Host",
      points: 20,
      votes: 2,
    },
  ],
  leaderboard: [],
};

test("inline host reward voting uses its player credential and leaves host controls reachable", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_player_get_session_reward_round = rewardFixture;
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vote for the winner" }),
  ).toBeVisible();
  await expect(page.getByText("Points awarded!", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Vote Pat", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) => request.name === "cc_player_cast_session_reward_vote",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (request) => request.name === "cc_player_cast_session_reward_vote",
    )?.body,
  ).toEqual({
    p_join_code: sessionCode,
    p_player_token: "host-player-token",
    p_reward_round_id: "reward-1",
    p_target_player_id: "test-player",
    p_target_team_id: null,
  });
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Secret missions", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("player reward results expose both tied winners only after the round closes", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.responses.cc_player_get_session_reward_round = rewardFixture;
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Vote for the winner" }),
  ).toBeVisible();
  await expect(page.getByText(/\+20 pts/)).toHaveCount(0);
  backend.responses.cc_player_get_session_reward_round = {
    ...rewardFixture,
    status: "completed",
  };
  await expect(
    page.getByRole("heading", { name: "Points awarded!" }),
  ).toBeVisible();
  await expect(page.locator(".session-reward-round__winner")).toHaveCount(2);
  backend.verify();
});

const finalFixture = {
  gallery_open: true,
  voting_open: true,
  voting_completed: false,
  sequence_completed: false,
  challenge_id: "test-side-challenge",
  challenge_title: "Find a pineapple",
  challenge_description: "Capture it.",
  challenge_points: 20,
  challenge_status: "voting",
  votes_cast: 3,
  my_vote_id: null,
  items: [
    {
      id: "photo",
      player_id: "test-player",
      player_name: "Pat",
      player_avatar_url: null,
      challenge_title: "Find a pineapple",
      challenge_kind: "side",
      media_type: "image",
      storage_path: `${sessionId}/test-player/photo.png`,
      vote_count: 3,
      is_my_vote: false,
      is_winner: true,
      voters: [{ id: "private", name: "Private voter", avatar_url: null }],
    },
  ],
  leaderboard: [],
};

test("final voting keeps result details private and sends the participant token", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.session.final_gallery_open = true;
  backend.session.final_voting_open = true;
  backend.responses.cc_player_get_session_final_round_gallery = finalFixture;
  await page.goto(`#/play/${sessionCode}/final`);
  await expect(
    page.getByRole("heading", { name: "Side challenge voting" }),
  ).toBeVisible();
  await expect(page.getByText("Top submission", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("3 votes", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Private voter", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Vote for this", exact: true })
    .click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) =>
            request.name === "cc_player_cast_session_final_round_vote",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (request) => request.name === "cc_player_cast_session_final_round_vote",
    )?.body,
  ).toEqual({
    p_join_code: sessionCode,
    p_player_token: "test-player-token",
    p_evidence_id: "photo",
  });
  backend.verify();
});

test("secret review takes precedence over reward UI for an inline host while host navigation stays available", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_player_get_session_reward_round = rewardFixture;
  backend.responses.cc_player_get_session_secret_review = {
    open: true,
    voting_open: true,
    assignment_id: "assignment-1",
    current_evidence_id: null,
    mission: {
      assignment_id: "assignment-1",
      player_id: "test-player",
      player_name: "Pat",
      player_avatar_url: null,
      title: "Secret entrance",
      description: "Did Pat succeed?",
      points: 20,
      status: "voting",
    },
    media: [],
    votes_cast: 2,
    success_votes: 9,
    fail_votes: 8,
    my_vote: null,
    outcome: null,
    voters: [],
    leaderboard: [],
    my_final_reviews: [],
  };
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Secret entrance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vote for the winner" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "SUCCESS", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) => request.name === "cc_player_cast_secret_review_vote",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (request) => request.name === "cc_player_cast_secret_review_vote",
    )?.body,
  ).toEqual({
    p_join_code: sessionCode,
    p_player_token: "host-player-token",
    p_assignment_id: "assignment-1",
    p_vote: "success",
  });
  backend.failures.add("cc_player_cast_secret_review_vote");
  await page.getByRole("button", { name: "FAIL", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  const hostNavigation = page.getByRole("button", {
    name: "Host",
    exact: true,
  });
  await hostNavigation.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Secret missions", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("shared participant states cover breaks, completion and host-assigned teams", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.timer.is_on_break = true;
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Take a breather" }),
  ).toBeVisible();
  backend.timer.is_on_break = false;
  backend.session.teams_enabled = true;
  backend.session.host_chooses_teams = true;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "The host is sorting teams." }),
  ).toBeVisible();
  backend.session.status = "completed";
  await expect(
    page.getByRole("heading", { name: "Game over. Chaos achieved." }),
  ).toBeVisible();
  backend.verify();
});

test("shared challenge DOM and computed styles match between roles", async ({
  page,
}, testInfo) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/play/${sessionCode}`);
  const card = page.locator(".main-challenge");
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const snapshot = () =>
    card.evaluate((element) => ({
      dom: element.querySelector(".main-challenge__heading-row")?.outerHTML,
      styles: [
        element,
        element.querySelector("h2"),
        element.querySelector(".main-challenge__summary"),
      ].map((node) => {
        if (!node) throw new Error("Shared challenge structure is incomplete");
        const style = getComputedStyle(node);
        return {
          font: style.fontFamily,
          fontSize: style.fontSize,
          color: style.color,
          background: style.backgroundColor,
          border: style.border,
          padding: style.padding,
          width: style.width,
        };
      }),
    }));
  const player = await snapshot();
  await page.screenshot({
    path: testInfo.outputPath("player-session.png"),
    fullPage: true,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await snapshot()).toEqual(player);
  await expect(page.locator("main")).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath("host-session.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  backend.verify();
});

test("inline host final voting uses the host token and keeps one page landmark", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.final_gallery_open = true;
  backend.session.final_voting_open = true;
  backend.responses.cc_player_get_session_final_round_gallery = finalFixture;
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Side challenge voting" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vote for this", exact: true })
    .click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) =>
            request.name === "cc_player_cast_session_final_round_vote",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (request) => request.name === "cc_player_cast_session_final_round_vote",
    )?.body,
  ).toEqual({
    p_join_code: sessionCode,
    p_player_token: "host-player-token",
    p_evidence_id: "photo",
  });
  await expect(page.locator("main")).toHaveCount(1);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Secret missions", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("nonparticipating host sees reward candidates without player voting actions", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.rows.cc_game_session_reward_rounds = [
    {
      id: "reward-1",
      session_id: sessionId,
      challenge_id: "test-challenge",
      reward_method: "voting",
      target_kind: "player",
      points: 20,
      status: "open",
      created_at: "2030-01-01T12:00:00Z",
      started_at: "2030-01-01T12:00:00Z",
      completed_at: null,
      released_at: null,
    },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Vote for the winner" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Vote Pat", exact: true }),
  ).toHaveCount(0);
  expect(
    backend.requests.some(
      (request) => request.name === "cc_host_join_as_player",
    ),
  ).toBe(false);
  backend.verify();
});

test("host and player scores use the same team totals", async ({ page }) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  const team = { id: "team-1", name: "Team Chaos", member_count: 2 };
  const pat = { ...backend.player, team_id: team.id, team_name: team.name };
  const sam = { ...pat, id: "sam", name: "Sam", score: 30 };
  backend.responses.cc_get_game_session_view = {
    ...backend.view,
    player: pat,
    teams: [team],
  };
  backend.responses.cc_get_player_session_leaderboard = [
    { ...sam, player_id: sam.id },
    { ...pat, player_id: pat.id },
  ];
  backend.rows.cc_game_session_players = [pat, sam];
  backend.rows.cc_game_session_teams = [{ ...team, session_id: sessionId }];
  await page.goto(`#/play/${sessionCode}/leaderboard`);
  const teamRow = () =>
    page
      .locator(".session-rank-row")
      .filter({ has: page.getByText(/^Team Chaos(?: · YOU)?$/) })
      .filter({ has: page.getByText("50 pts", { exact: true }) });
  await expect(teamRow()).toHaveCount(1);
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  await expect(teamRow()).toHaveCount(1);
  backend.verify();
});
