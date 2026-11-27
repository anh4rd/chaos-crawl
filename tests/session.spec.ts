/// <reference types="node" />

import { Buffer } from "node:buffer";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { createInvitationFixture } from "./support/invitation";
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
  backend.responses.cc_player_get_session_final_round_gallery = null;
  const challengeArtUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Ccircle cx='4' cy='4' r='4'/%3E%3C/svg%3E";
  backend.responses.cc_get_public_main_challenge_art = challengeArtUrl;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".main-challenge__art img")).toHaveAttribute(
    "src",
    challengeArtUrl,
  );
  const gameNavigation = page.getByRole("navigation", { name: "Game pages" });
  await expect(gameNavigation.getByRole("link", { name: "Final" })).toHaveCount(
    0,
  );
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

test("completed players can download their submissions and create a photo reel", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.session.status = "completed";
  backend.responses.cc_get_player_session_evidence = [
    {
      id: "submitted-photo",
      session_id: sessionId,
      player_id: "test-player",
      challenge_id: "test-side-challenge",
      secret_assignment_id: null,
      storage_path: `${sessionId}/test-player/entrance.png`,
      media_type: "image",
      saved_for_final: false,
      created_at: "2030-01-01T12:05:00Z",
    },
    {
      id: "submitted-video",
      session_id: sessionId,
      player_id: "test-player",
      challenge_id: "test-challenge",
      secret_assignment_id: null,
      storage_path: `${sessionId}/test-player/celebration.webm`,
      media_type: "video",
      saved_for_final: false,
      created_at: "2030-01-01T12:06:00Z",
    },
  ];

  await page.goto(`#/play/${sessionCode}/recap`);
  await expect(
    page.getByRole("heading", { name: "Keep your chaos.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Game pages" }).getByRole("link", {
      name: "Memories",
    }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page
      .getByRole("navigation", { name: "Game pages" })
      .locator(".session-navigation__item")
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute("aria-label")),
      ),
  ).toEqual(["Game", "Scores", "Challenges", "Memories"]);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("link", { name: "Game", exact: true })
    .click();
  await page.getByRole("link", { name: "Save your game memories →" }).click();
  await expect(page).toHaveURL(/\/recap$/);
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Video submission", { exact: true }),
  ).toBeVisible();

  const originalDownload = page.waitForEvent("download");
  await page
    .locator(".session-memories__asset")
    .first()
    .getByRole("button", { name: "Download Find a pineapple", exact: true })
    .click();
  expect((await originalDownload).suggestedFilename()).toBe(
    "chaos-crawl-01-find-a-pineapple.png",
  );

  const videoDownload = page.waitForEvent("download");
  await page
    .locator(".session-memories__asset")
    .nth(1)
    .getByRole("button", { name: "Download Make an entrance", exact: true })
    .click();
  expect((await videoDownload).suggestedFilename()).toBe(
    "chaos-crawl-02-make-an-entrance.webm",
  );

  const reelDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Create and download reel", exact: true })
    .click();
  expect((await reelDownload).suggestedFilename()).toMatch(
    /^chaos-crawl-123456-photo-reel\.(mp4|webm)$/,
  );
  await expect(page.getByText("Your photo reel is ready.")).toBeVisible();
  backend.verify();
});

test("completed host controls provide the full session memories archive", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.status = "completed";
  backend.uploadedEvidence.push({
    id: "host-archive-photo",
    session_id: sessionId,
    player_id: "test-player",
    challenge_id: "test-side-challenge",
    secret_assignment_id: null,
    storage_path: `${sessionId}/test-player/entrance.png`,
    media_type: "image",
    saved_for_final: false,
    created_at: "2030-01-01T12:05:00Z",
  });

  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Host", exact: true })
    .click();
  const tabs = page.getByRole("tablist", {
    name: "Host management sections",
  });
  await expect(tabs.getByRole("tab", { name: "Memories" })).toBeVisible();
  await tabs.getByRole("tab", { name: "Memories", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Memories from the game.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Pat", { exact: true }).last()).toBeVisible();

  const download = page.waitForEvent("download");
  await page
    .locator(".session-memories__asset")
    .getByRole("button", { name: "Download Find a pineapple", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "chaos-crawl-01-find-a-pineapple.png",
  );

  const reelDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Create and download reel", exact: true })
    .click();
  expect((await reelDownload).suggestedFilename()).toMatch(
    /^chaos-crawl-123456-photo-reel\.(mp4|webm)$/,
  );
  await expect(page.getByText("Your photo reel is ready.")).toBeVisible();
  backend.verify();
});

test("players cannot open the memories page before the game is complete", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  await page.goto(`#/play/${sessionCode}/recap`);
  await expect(page).toHaveURL(/\/game$/);
  await expect(
    page.getByRole("heading", { name: "Keep your chaos.", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Game pages" }).getByRole("link", {
      name: "Memories",
    }),
  ).toHaveCount(0);
  backend.verify();
});

test("player and host challenge pages render cards in a two-column grid", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  const expectTwoColumns = async () => {
    const grid = page.locator(
      '[data-tour="player-side-challenges"] .challenge-list',
    );
    await expect(grid).toBeVisible();
    const columns = await grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(2);
    await expect(grid.locator(".session-challenge-card")).toHaveCSS(
      "min-height",
      "174px",
    );
    await expect(grid.locator(".session-challenge-card__team-mode")).toHaveText(
      "Compete in teams",
    );
  };

  await page.goto(`#/play/${sessionCode}`);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("link", { name: "Challenges", exact: true })
    .click();
  await expectTwoColumns();
  await expect(
    page.getByRole("button", { name: "Add side challenge", exact: true }),
  ).toHaveCount(0);
  const playerCardStyle = await page
    .locator(".session-challenge-card")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderRadius: style.borderRadius,
        width: style.width,
      };
    });

  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Challenges", exact: true })
    .click();
  await expectTwoColumns();
  await expect(
    page.getByRole("button", { name: "Add side challenge", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".session-challenge-card").first()).toHaveCSS(
    "background-color",
    playerCardStyle.background,
  );
  await expect(page.locator(".session-challenge-card").first()).toHaveCSS(
    "border-radius",
    playerCardStyle.borderRadius,
  );
  await expect(page.locator(".session-challenge-card").first()).toHaveCSS(
    "width",
    playerCardStyle.width,
  );
  backend.verify();
});

test("host can add a side challenge from the challenges grid", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Challenges", exact: true })
    .click();

  const grid = page.locator(
    '[data-tour="player-side-challenges"] .challenge-list',
  );
  await expect(
    grid.getByRole("button", { name: "Add side challenge", exact: true }),
  ).toBeVisible();
  await grid
    .getByRole("button", { name: "Add side challenge", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Add a side challenge",
    exact: true,
  });
  await dialog.getByLabel("Challenge title", { exact: true }).fill("Blue hunt");
  await dialog
    .getByLabel("Side task description", { exact: true })
    .fill("Find and photograph something blue.");
  await dialog.getByLabel("Final vote bonus", { exact: true }).fill("25");
  await dialog
    .getByRole("button", { name: "Add side challenge", exact: true })
    .click();

  await expect(dialog).toHaveCount(0);
  expect(
    backend.requests.find(
      (request) =>
        request.name === "cc_game_session_challenges" &&
        request.method === "POST",
    )?.body,
  ).toEqual({
    session_id: sessionId,
    kind: "side",
    round_number: null,
    title: "Blue hunt",
    description: "Find and photograph something blue.",
    points: 25,
    duration_minutes: 10,
    sort_order: 3,
    allow_photo_upload: true,
  });
  await expect(
    grid.getByRole("heading", { name: "Blue hunt", exact: true }),
  ).toBeVisible();
  await expect(
    grid.locator(".session-challenge-card__team-mode").last(),
  ).toHaveText("Compete in teams");
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
    page.getByRole("heading", { name: "Enter your details", exact: true }),
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
    .getByRole("button", {
      name: /Open lobby & invite|Play game|Launch game|Open game/i,
    })
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
  backend.session.round_count = 2;
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    round_number: 2,
    sort_order: 3,
  });
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
  await expect(
    page
      .locator(".main-challenge + .session-preview")
      .getByRole("region", { name: "Host controls", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".main-challenge + .session-preview .stage-preview__title"),
  ).toHaveText("Second entrance");
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
  backend.session.round_count = 2;
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    round_number: 2,
    sort_order: 3,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await expect(page.locator(".session-profile h1")).toHaveText("Test Host");
  await expect(
    page
      .locator(".main-challenge + .session-preview")
      .getByRole("region", { name: "Host controls", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".main-challenge + .session-preview .stage-preview__title"),
  ).toHaveText("Second entrance");
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Challenges", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add side challenge", exact: true }),
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
  await page
    .getByRole("tab", { name: "Secret mission schedule", exact: true })
    .click();
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

test("host management tabs expose schedule editing and active-session settings", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    round_number: 2,
    sort_order: 3,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("navigation", { name: "Game pages" })
    .getByRole("button", { name: "Host", exact: true })
    .click();

  const tabs = page.getByRole("tablist", {
    name: "Host management sections",
  });
  await expect(tabs.getByRole("tab")).toHaveCount(5);
  await tabs.getByRole("tab", { name: "Game schedule", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Game schedule", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Make an entrance", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Make an entrance", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Update challenge",
    exact: true,
  });
  await editor
    .getByRole("textbox", { name: "Challenge title" })
    .fill("Updated entrance");
  await editor.getByRole("button", { name: "Save challenge" }).click();
  await expect(editor).toHaveCount(0);

  await tabs.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.getByLabel("Game name").fill("Updated session name");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save session settings", exact: true }),
  );
  await expect(page.getByRole("status")).toContainText(
    "Session settings updated.",
  );
  expect(
    backend.requests.find(
      (request) =>
        request.name === "cc_game_sessions" &&
        request.method === "PATCH" &&
        typeof request.body === "object" &&
        request.body !== null &&
        "name" in request.body,
    )?.body,
  ).toMatchObject({
    name: "Updated session name",
    player_limit: 12,
    teams_enabled: false,
  });
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
  await page.goto(`#/play/${sessionCode}`);
  await expect(page).toHaveURL(/\/final$/);
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
  await page
    .getByRole("tab", { name: "Secret mission schedule", exact: true })
    .click();
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
  await expect(page.getByText("Edit break", { exact: true })).toHaveCount(0);
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

test("host roster tab edits player names, moves players and creates teams", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [
    { id: "team-original", name: "Team Chaos", created_at: "2030-01-01" },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  const tabs = page.getByRole("tablist", { name: "Host management sections" });
  const first = tabs.getByRole("tab", { name: "Control overrides" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const tab = tabs.getByRole("tab", { name: "Manage teams and players" });
  await expect(tab).toBeFocused();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel", {
    name: "Manage teams and players",
  });
  await expect(
    panel.getByText(
      "Adding players directly and deleting players or teams are not available in this game yet.",
    ),
  ).toBeVisible();
  await panel.getByLabel("Name for Pat").fill("  Alex  ");
  await panel.getByRole("button", { name: "Save name" }).click();
  await expect(panel.getByLabel("Name for Alex")).toHaveValue("Alex");
  expect(
    backend.requests.find(
      (request) =>
        request.name === "cc_game_session_players" &&
        request.method === "PATCH" &&
        typeof request.body === "object" &&
        request.body !== null &&
        "name" in request.body,
    )?.body,
  ).toEqual({ name: "Alex" });
  await panel.getByLabel("Team for Alex").selectOption("team-original");
  await expect(panel.getByLabel("Team for Alex")).toHaveValue("team-original");
  await panel.getByLabel("Players per team").selectOption("3");
  await expect(panel.getByLabel("Players per team")).toHaveValue("3");
  await panel.getByLabel("New team name").fill("Team Spark");
  await panel.getByRole("button", { name: "+ Add team" }).click();
  await expect(panel.getByLabel("Name for Team Spark")).toBeVisible();
  await expect(
    panel.getByRole("link", { name: /Open join screen/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  backend.verify();
});

test("roster player rename reports a missing update and can be retried", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  let first = true;
  await page.route("**/rest/v1/cc_game_session_players*", async (route) => {
    if (first && route.request().method() === "PATCH") {
      first = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
      return;
    }
    await route.fallback();
  });
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Manage teams and players" }).click();
  const panel = page.getByRole("tabpanel", {
    name: "Manage teams and players",
  });
  const name = panel.getByLabel("Name for Pat");
  await name.fill("Alex");
  await panel.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "The player could not be updated",
  );
  await expect(name).toHaveValue("Alex");
  await panel.getByRole("button", { name: "Save name" }).click();
  await expect(panel.getByLabel("Name for Alex")).toHaveValue("Alex");
  backend.verify();
});

test("host roster reference changes only local data", async ({ page }) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page.locator("article.component-example").filter({
    has: page.getByRole("heading", {
      name: "Host roster management",
      exact: true,
    }),
  });
  await example.getByLabel("Name for Pat").fill("Alex");
  await example.getByRole("button", { name: "Save name" }).click();
  await expect(example.getByLabel("Name for Alex")).toHaveValue("Alex");
  await example.getByLabel("Team for Alex").selectOption("team");
  await expect(example.getByLabel("Team for Alex")).toHaveValue("team");
  await example.getByLabel("New team name").fill("Team Spark");
  await example.getByRole("button", { name: "+ Add team" }).click();
  await expect(example.getByLabel("Name for Team Spark")).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("live host and player pages use the join page background", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  const readBackground = async (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        beforeBackgroundImage: getComputedStyle(element, "::before")
          .backgroundImage,
        afterBackgroundImage: getComputedStyle(element, "::after")
          .backgroundImage,
      };
    });

  await page.goto("#/join");
  const joinBackground = await readBackground(".player-access");
  const joinHeaderSurface = await page
    .locator(".access-header")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
  await page.goto(`#/play/${sessionCode}`);
  const playerBackground = await readBackground(".session-page");
  const playerProfileSurface = await page
    .locator(".session-profile")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
  await page.goto(`#/host/live/${sessionId}`);
  const hostBackground = await readBackground(".session-page");
  const hostProfileSurface = await page
    .locator(".session-profile")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });

  expect(playerBackground.backgroundColor).toBe(joinBackground.backgroundColor);
  expect(playerBackground.backgroundImage).toBe(
    [
      joinBackground.afterBackgroundImage,
      joinBackground.beforeBackgroundImage,
      joinBackground.backgroundImage,
    ].join(", "),
  );
  expect(hostBackground).toEqual(playerBackground);
  expect(playerProfileSurface).toEqual(joinHeaderSurface);
  expect(hostProfileSurface).toEqual(joinHeaderSurface);
  backend.verify();
});

test("shared challenge DOM and computed styles match between roles", async ({
  page,
}, testInfo) => {
  const backend = await installSessionBackend(page, { host: true });
  const challengeArtUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Ccircle cx='4' cy='4' r='4'/%3E%3C/svg%3E";
  backend.responses.cc_get_public_main_challenge_art = challengeArtUrl;
  backend.rows.host_games = [
    {
      id: "test-plan",
      plan_data: {
        selectedTasks: [
          { id: "main-task", title: "Make an entrance", kind: "main" },
        ],
        challengeArtUrls: { "main-task": challengeArtUrl },
      },
    },
  ];
  await page.goto(`#/play/${sessionCode}`);
  const card = page.locator(".main-challenge");
  await expect(card).toBeVisible();
  await expect(card.locator(".main-challenge__art img")).toHaveAttribute(
    "src",
    challengeArtUrl,
  );
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
  const expectSummaryLayout = async () => {
    const layout = await card.evaluate((element) => {
      const bounds = (selector: string) => {
        const node = element.querySelector(selector);
        if (!node) throw new Error(`Missing ${selector} in main challenge`);
        const { top, right, bottom, left } = node.getBoundingClientRect();
        return { top, right, bottom, left };
      };
      const art = element.querySelector(".main-challenge__art");
      if (!art) throw new Error("Missing challenge art frame");
      const artwork = art.querySelector("img, span");
      if (!artwork) throw new Error("Missing challenge artwork");
      const cardRect = element.getBoundingClientRect();
      const frameStyle = getComputedStyle(art);
      const transform = new DOMMatrixReadOnly(
        getComputedStyle(artwork).transform,
      );
      const cardStyle = getComputedStyle(element);
      return {
        summary: bounds(".main-challenge__summary"),
        round: bounds(".main-challenge__round"),
        award: bounds(".main-challenge__award"),
        art: bounds(".main-challenge__art"),
        card: {
          right: cardRect.right,
          bottom: cardRect.bottom,
          borderRight: Number.parseFloat(cardStyle.borderRightWidth),
          borderBottom: Number.parseFloat(cardStyle.borderBottomWidth),
          borderBottomRightRadius: Number.parseFloat(
            cardStyle.borderBottomRightRadius,
          ),
        },
        frame: {
          position: frameStyle.position,
          width: Number.parseFloat(frameStyle.width),
          height: Number.parseFloat(frameStyle.height),
          borderBottomRightRadius: Number.parseFloat(
            frameStyle.borderBottomRightRadius,
          ),
          backgroundImage: frameStyle.backgroundImage,
          artworkRotation:
            (Math.atan2(transform.b, transform.a) * 180) / Math.PI,
          artworkScale: Math.hypot(transform.a, transform.b),
        },
      };
    });
    expect(layout.round.top).toBe(layout.summary.top);
    expect(layout.award.top).toBeGreaterThan(layout.round.top);
    expect(layout.art.right).toBeCloseTo(
      layout.card.right - layout.card.borderRight,
      1,
    );
    expect(layout.art.bottom).toBeCloseTo(
      layout.card.bottom - layout.card.borderBottom,
      1,
    );
    expect(layout.frame.position).toBe("absolute");
    expect(layout.frame.width).toBe(116);
    expect(layout.frame.height).toBeCloseTo(102.976, 1);
    expect(layout.frame.borderBottomRightRadius).toBeCloseTo(
      layout.card.borderBottomRightRadius - layout.card.borderBottom,
      1,
    );
    expect(layout.frame.backgroundImage).toContain("DED6FE");
    expect(layout.frame.artworkRotation).toBeCloseTo(-7, 1);
    expect(layout.frame.artworkScale).toBeCloseTo(1.2, 1);
  };
  const player = await snapshot();
  await expectSummaryLayout();
  await page.screenshot({
    path: testInfo.outputPath("player-session.png"),
    fullPage: true,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await expect(card).toBeVisible();
  await expect(card.locator(".main-challenge__art img")).toHaveAttribute(
    "src",
    challengeArtUrl,
  );
  await page.evaluate(() => document.fonts.ready);
  expect(await snapshot()).toEqual(player);
  await expectSummaryLayout();
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
    page.getByRole("heading", { name: "Final round", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Side challenge voting", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("tab", { name: "Secret mission schedule", exact: true })
    .click();
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
  const playerPhoto = "/chaos-crawl/openmoji/1F600.svg";
  const teamPhoto = "/chaos-crawl/chaos-logo.png";
  const sam = {
    ...pat,
    id: "sam",
    name: "Sam",
    score: 30,
    avatar_url: playerPhoto,
  };
  backend.responses.cc_get_session_portraits = {
    players: { sam: playerPhoto },
    teams: { [team.id]: teamPhoto },
  };
  backend.rows.host_games = [
    {
      id: "test-plan",
      host_id: "00000000-0000-4000-8000-000000000001",
      plan_data: { teamPhotoUrls: { [team.id]: teamPhoto } },
    },
  ];
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
  const leaderboardTabs = () =>
    page.getByRole("tablist", { name: "Leaderboard", exact: true });

  const playerTabs = leaderboardTabs();
  const playersTab = playerTabs.getByRole("tab", {
    name: "Player Scores",
    exact: true,
  });
  const teamsTab = playerTabs.getByRole("tab", {
    name: "Team Scores",
    exact: true,
  });
  await expect(playersTab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.locator(".session-rank-row").filter({ hasText: "Sam" }).locator("img"),
  ).toHaveAttribute("src", playerPhoto);
  await playersTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(teamsTab).toBeFocused();
  await expect(teamsTab).toHaveAttribute("aria-selected", "true");
  await expect(teamRow()).toBeVisible();
  await expect(teamRow().locator("img")).toHaveAttribute("src", teamPhoto);
  await expect(
    page.getByRole("tabpanel", { name: "Player Scores", exact: true }),
  ).toBeHidden();
  await teamsTab.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(playersTab).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Player Scores", exact: true }),
  ).toBeVisible();

  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  const hostTabs = leaderboardTabs();
  await hostTabs.getByRole("tab", { name: "Team Scores", exact: true }).click();
  await expect(teamRow()).toHaveCount(1);
  await expect(teamRow()).toBeVisible();
  await expect(teamRow().locator("img")).toHaveAttribute("src", teamPhoto);
  backend.verify();
});

test("host and player score pages show the ranked podium and cards", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  const team = { id: "team-1", name: "Team Chaos", member_count: 3 };
  const pat = { ...backend.player, team_id: team.id, team_name: team.name };
  const players = [
    { ...pat, id: "alex", name: "Alex", score: 65 },
    { ...pat, id: "sam", name: "Sam", score: 55 },
    { ...pat, score: 35 },
  ];
  backend.responses.cc_get_game_session_view = {
    ...backend.view,
    player: pat,
    teams: [team],
  };
  backend.responses.cc_get_player_session_leaderboard = players.map(
    (player) => ({ ...player, player_id: player.id }),
  );
  backend.rows.cc_game_session_players = players;
  backend.rows.cc_game_session_teams = [{ ...team, session_id: sessionId }];
  await page.goto(`#/play/${sessionCode}/leaderboard`);
  const playerPodium = page.getByRole("list", { name: "Top players" });
  await expect(playerPodium.locator("li")).toHaveCount(3);
  await expect(playerPodium.locator("li").first()).toContainText("Alex");
  await expect(page.locator(".session-rank-row--page")).toHaveCount(3);
  await page.screenshot({ path: test.info().outputPath("player-scores.png") });

  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  const hostPodium = page.getByRole("list", { name: "Top players" });
  await expect(hostPodium.locator("li")).toHaveCount(3);
  await expect(hostPodium.locator("li").first()).toContainText("Alex");
  await expect(page.locator(".session-rank-row--page")).toHaveCount(3);
  await page.screenshot({ path: test.info().outputPath("host-scores.png") });
  backend.verify();
});

test("score cards remain readable on a narrow screen with long names", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const backend = await installSessionBackend(page);
  backend.responses.cc_get_player_session_leaderboard = [
    {
      ...backend.player,
      player_id: backend.player.id,
      name: "AVeryLongPlayerNameWithoutSpaces",
      score: 10000,
    },
  ];
  await page.goto(`#/play/${sessionCode}/leaderboard`);
  const row = page.locator(".session-rank-row--page");
  await expect(row).toContainText("AVeryLongPlayerNameWithoutSpaces");
  await expect(row).toContainText("10000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: test.info().outputPath("narrow-scores.png") });
  backend.verify();
});

test("host adjusts player and team scores and players see team adjustments", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  const team = { id: "team-1", name: "Team Chaos", member_count: 1 };
  const player = { ...backend.player, team_id: team.id, team_name: team.name };
  backend.rows.cc_game_session_players = [player];
  backend.rows.cc_game_session_teams = [
    { ...team, manual_score_adjustment: 0 },
  ];
  backend.responses.cc_get_game_session_view = {
    ...backend.view,
    player,
    teams: [team],
  };
  backend.responses.cc_get_player_session_leaderboard = [
    { ...player, player_id: player.id, score: 25 },
  ];

  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  const controls = page.locator(".score-adjustment");
  const previousScore = await page
    .locator(".session-rank-row__score-value")
    .first()
    .elementHandle();
  await controls.getByLabel("Name").selectOption(player.id);
  await controls.getByLabel("Points").fill("5");
  await controls
    .getByRole("button", { name: "Apply score adjustment" })
    .click();
  await expect(page.locator("output.u-visually-hidden")).toHaveText(
    "Score updated.",
  );
  await expect(page.locator(".session-feedback--success")).toHaveCount(0);
  await expect(controls.locator(".score-adjustment__success")).toHaveCount(1);
  await expect(controls.locator(".score-adjustment__success")).toHaveCSS(
    "animation-name",
    "score-adjustment-confirm",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(controls.locator(".score-adjustment__success")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".session-rank-row--page").first()).toContainText(
    "25",
  );
  expect(await previousScore?.evaluate((element) => element.isConnected)).toBe(
    false,
  );
  const scoreValue = page.locator(".session-rank-row__score-value").first();
  await expect(scoreValue).toHaveCSS("animation-name", "session-score-change");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scoreValue).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await controls.getByLabel("Action").selectOption("remove");
  await controls.getByLabel("Target").selectOption("team");
  await controls.getByLabel("Name").selectOption(team.id);
  await controls.getByLabel("Points").fill("3");
  await controls
    .getByRole("button", { name: "Apply score adjustment" })
    .click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_adjust_session_score",
        ).length,
    )
    .toBe(2);
  expect(
    backend.requests
      .filter((r) => r.name === "cc_host_adjust_session_score")
      .map((r) => r.body),
  ).toEqual([
    {
      p_session_id: sessionId,
      p_target_kind: "player",
      p_target_id: player.id,
      p_delta: 5,
    },
    {
      p_session_id: sessionId,
      p_target_kind: "team",
      p_target_id: team.id,
      p_delta: -3,
    },
  ]);
  await page.getByRole("tab", { name: "Team Scores" }).click();
  await expect(page.locator(".session-rank-row--page").first()).toContainText(
    "22",
  );

  await page.goto(`#/play/${sessionCode}/leaderboard`);
  await page.getByRole("tab", { name: "Team Scores" }).click();
  await expect(page.locator(".session-rank-row--page").first()).toContainText(
    "22",
  );
  await expect(page.locator(".score-adjustment")).toHaveCount(0);
  backend.verify();
});

test("score adjustment failures are visible and retryable", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.failures.add("cc_host_adjust_session_score");
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  const controls = page.locator(".score-adjustment");
  await controls.getByLabel("Name").selectOption(backend.player.id);
  await controls
    .getByRole("button", { name: "Apply score adjustment" })
    .click();
  await expect(
    page.getByText("Couldn't adjust score: Fixture connection failed"),
  ).toBeVisible();
  await expect(controls.locator(".score-adjustment__success")).toHaveCount(0);
  backend.failures.delete("cc_host_adjust_session_score");
  await controls
    .getByRole("button", { name: "Apply score adjustment" })
    .click();
  await expect(page.locator("output.u-visually-hidden")).toHaveText(
    "Score updated.",
  );
  await expect(page.locator(".session-feedback--success")).toHaveCount(0);
  backend.verify();
});

test("host can adjust a score using only the keyboard", async ({ page }) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Scores", exact: true }).click();
  const controls = page.locator(".score-adjustment");
  await controls.getByLabel("Action").focus();
  await page.keyboard.press("r");
  await expect(controls.getByLabel("Action")).toHaveValue("remove");
  await page.keyboard.press("Tab");
  await expect(controls.getByLabel("Name")).toBeFocused();
  await page.keyboard.press("p");
  await expect(controls.getByLabel("Name")).toHaveValue(backend.player.id);
  await page.keyboard.press("Tab");
  await expect(controls.getByLabel("Points")).toBeFocused();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("3");
  await page.keyboard.press("Tab");
  await expect(
    controls.getByRole("button", { name: "Apply score adjustment" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      backend.requests.find((r) => r.name === "cc_host_adjust_session_score"),
    )
    .toMatchObject({
      body: {
        p_target_kind: "player",
        p_target_id: backend.player.id,
        p_delta: -3,
      },
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  backend.verify();
});

test("player team scores do not show incomplete totals when adjustments fail", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.session.teams_enabled = true;
  const team = { id: "team-1", name: "Team Chaos", member_count: 1 };
  backend.responses.cc_get_game_session_view = {
    ...backend.view,
    teams: [team],
  };
  backend.failures.add("cc_get_session_team_adjustments");
  await page.goto(`#/play/${sessionCode}/leaderboard`);
  await page.getByRole("tab", { name: "Team Scores" }).click();
  await expect(
    page.getByText("Team scores are unavailable. Please try again."),
  ).toBeVisible();
  await expect(page.locator(".session-rank-row--page")).toHaveCount(0);
  backend.verify();
});

test("host timer start and pause publish the existing shared timer fields", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  const stageIcon = page.locator(".host-round-controls__stage-icon");
  const before = await stageIcon.elementHandle();
  await page.getByRole("button", { name: "Start Timer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  expect(await before?.evaluate((element) => element.isConnected)).toBe(false);
  await expect(stageIcon).toHaveCSS("animation-name", "host-stage-change");
  await expect(page.locator(".session-feedback--success")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stageIcon).toHaveCSS("animation-name", "none");
  await expect
    .poll(() =>
      backend.requests
        .filter(
          (r) => r.name === "cc_game_session_timers" && r.method === "POST",
        )
        .some((r) => (r.body as { is_running: boolean }).is_running),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start Timer", exact: true }),
  ).toBeVisible();
  const writes = backend.requests.filter(
    (r) => r.name === "cc_game_session_timers" && r.method === "POST",
  );
  expect(writes.at(-1)?.body).toMatchObject({
    session_id: sessionId,
    round_number: 1,
    is_running: false,
    is_on_break: false,
    resume_round_number: null,
    break_ends_at: null,
  });
  backend.verify();
});

test("host moderation preserves approval payload and failure feedback", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.rows.cc_game_session_submissions = [
    {
      id: "submission-1",
      player_id: "test-player",
      challenge_id: "test-challenge",
      status: "submitted",
      awarded_points: 0,
      submitted_at: "2030-01-01",
    },
  ];
  backend.responses.cc_host_review_session_submission = null;
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Review", exact: true }).click();
  page.on("dialog", (dialog) => void dialog.accept("15"));
  await page
    .getByRole("button", { name: /Approve/ })
    .first()
    .click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_review_session_submission",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_review_session_submission")
      ?.body,
  ).toEqual({ p_submission_id: "submission-1", p_approve: true, p_points: 15 });
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Approved submission for 15 points." }),
  ).toBeVisible();
  backend.failures.add("cc_host_review_session_submission");
  await page
    .getByRole("button", { name: /Reject/ })
    .first()
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  backend.verify();
});

test("host reward cancellation preserves confirmation and command payload", async ({
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
      created_at: "2030-01-01",
      started_at: "2030-01-01",
      completed_at: null,
      released_at: null,
    },
  ];
  backend.responses.cc_host_cancel_session_reward_round = null;
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue reward flow", exact: true })
    .click();
  page.on("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Cancel flow", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_cancel_session_reward_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_host_cancel_session_reward_round",
    )?.body,
  ).toEqual({ p_reward_round_id: "reward-1" });
  backend.verify();
});

test("host round progression runs the planned break before starting the next round", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    round_number: 2,
    sort_order: 3,
  });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { breakMinutes: 1 } },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("region", { name: "Host controls", exact: true })
    .getByRole("button", { name: "Next", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start Now", exact: true }),
  ).toBeVisible();
  const writes = backend.requests.filter(
    (r) => r.name === "cc_game_session_timers" && r.method === "POST",
  );
  expect(
    writes.some(
      (r) =>
        (r.body as { is_on_break: boolean; resume_round_number: number })
          .is_on_break &&
        (r.body as { resume_round_number: number }).resume_round_number === 2,
    ),
  ).toBe(true);
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Start Now", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_set_game_session_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
      ?.body,
  ).toEqual({ p_session_id: sessionId, p_round_number: 2 });
  await expect(
    page.getByRole("heading", { name: "Second entrance", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("host can assign an unassigned player from the extracted lobby step", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  backend.session.teams_enabled = true;
  backend.session.host_chooses_teams = true;
  backend.rows.cc_game_session_teams = [
    { id: "team-1", name: "Team Chaos", created_at: "2030-01-01" },
  ];
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-host-flow:test-session", "4"),
  );
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Add Pat", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_session_players" && r.method === "PATCH",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_game_session_players" && r.method === "PATCH",
    )?.body,
  ).toEqual({ team_id: "team-1" });
  await expect(page.getByText("Pat · Unassigned", { exact: true })).toHaveCount(
    0,
  );
  backend.verify();
});

test("host avatar upload failure keeps participation and survives the next data refresh", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  backend.failures.add("storage:game-assets");
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-host-flow:test-session", "2"),
  );
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByLabel(/Upload a profile picture/).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixture"),
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "You joined, but your profile photo couldn't upload",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-host-player:test-session"),
    ),
  ).toBe("host-player-token");
  const reads = backend.requests.filter(
    (r) => r.name === "cc_game_sessions" && r.method === "GET",
  ).length;
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_sessions" && r.method === "GET",
        ).length,
    )
    .toBeGreaterThan(reads);
  await expect(page.getByRole("alert")).toContainText("Fixture storage failed");
  backend.verify();
});

test("switching host sessions resets the selected section and never reuses the previous host token", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/host/live/${sessionId}`);
  await page
    .getByRole("button", { name: "Join and play", exact: true })
    .click();
  await page.getByRole("button", { name: "Challenges", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find a pineapple", exact: true }),
  ).toBeVisible();
  backend.session.id = "second-session";
  const reads = backend.requests.filter(
    (r) => r.name === "cc_get_game_session_view",
  ).length;
  await page.goto("#/host/live/second-session");
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Join and play", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Game", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    backend.requests.filter((r) => r.name === "cc_get_game_session_view"),
  ).toHaveLength(reads);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-host-player:second-session"),
    ),
  ).toBeNull();
  backend.verify();
});

test("public invitation keeps its details, optional sections and join navigation", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses.cc_get_public_game_invite = createInvitationFixture();
  await page.goto(`#/invite/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Friday Night Chaos", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("The Test Venue", { exact: true })).toBeVisible();
  await expect(page.getByText("4 / 12 joined", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bring a bold hat", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What to prepare", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Be kind. Play fair.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Join the chaos", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/join\?code=123456$/);
  expect(
    backend.requests
      .filter((r) => r.name === "cc_get_public_game_invite")
      .every(
        (r) => (r.body as { p_join_code: string }).p_join_code === sessionCode,
      ),
  ).toBe(true);
  backend.verify();
});

test("unavailable public invitation retains its recovery navigation", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.failures.add("cc_get_public_game_invite");
  await page.goto(`#/invite/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Invitation unavailable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fixture connection failed", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to Chaos Crawl", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/$/);
  backend.verify();
});

test("public invitation hides disabled optional content", async ({ page }) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses.cc_get_public_game_invite = {
    ...createInvitationFixture(),
    demo_enabled: false,
    pre_game_enabled: false,
    preparation: [],
    rules: null,
  };
  await page.goto(`#/invite/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Friday Night Chaos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take the interactive game tour" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Bring a bold hat", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "What to prepare", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "The rules", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("host login failure remains recoverable when changing account action", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.route("**/auth/v1/token**", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject({
      email: "host@example.test",
      password: "secret-pass",
    });
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        code: "invalid_credentials",
        msg: "Invalid login credentials",
      }),
    });
  });
  await page.goto("#/host/login");
  await page.getByLabel("Email address").fill("host@example.test");
  await page.getByLabel("Password", { exact: true }).fill("secret-pass");
  await page.getByRole("button", { name: "Log in to Host Hub" }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  await expect(
    page.getByRole("button", { name: "Log in to Host Hub" }),
  ).toBeEnabled();
  await page.getByRole("tab", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Your name")).toBeVisible();
  backend.verify();
});
test("host signup sends display metadata and keeps email confirmation on the form", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.route("**/auth/v1/signup**", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject({
      email: "host@example.test",
      password: "secret-pass",
      data: { display_name: "Alex Chaos" },
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        email: "host@example.test",
        identities: [],
        created_at: "2030-01-01T12:00:00Z",
      }),
    });
  });
  await page.goto("#/host/login");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Your name").fill("  Alex Chaos  ");
  await page.getByLabel("Email address").fill("host@example.test");
  await page.getByLabel(/^Password/).fill("secret-pass");
  await page.getByRole("button", { name: "Create host account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await expect(page).toHaveURL(/#\/host\/login$/);
  await page.getByRole("tab", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  backend.verify();
});
test("host password login opens the authenticated shell", async ({ page }) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.route("**/auth/v1/token**", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      email: "host@example.test",
      password: "secret-pass",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-host-access-token",
        refresh_token: "test-host-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email: "host@example.test",
          user_metadata: { display_name: "Test Host" },
          app_metadata: { provider: "email" },
          created_at: "2030-01-01T12:00:00Z",
        },
      }),
    });
  });
  await page.goto("#/host/login");
  await page.getByLabel("Email address").fill("host@example.test");
  await page.getByLabel("Password", { exact: true }).fill("secret-pass");
  await page.getByRole("button", { name: "Log in to Host Hub" }).click();
  await expect(page).toHaveURL(/#\/host$/);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  backend.verify();
});
test("an existing host session redirects away from login", async ({ page }) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host/login");
  await expect(page).toHaveURL(/#\/host$/);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  backend.verify();
});

test("host shell styleguide composes local identity and callbacks without authentication reads", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page
    .getByRole("heading", { name: "HostShell + host navigation", exact: true })
    .locator("xpath=ancestor::article[1]");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(example.locator(".account-chip__name")).toHaveText("Alex");
  await example.getByRole("button", { name: "Create new game" }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Create game selected locally.",
  );
  await example.getByRole("button", { name: "Sign out" }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Sign out selected locally.",
  );
  await example.getByRole("button", { name: "Show read-only preview" }).click();
  await expect(example.getByText("PREVIEW", { exact: true })).toBeVisible();
  await expect(example.getByRole("button", { name: "Sign out" })).toHaveCount(
    0,
  );
  await expect(
    example.getByRole("navigation", { name: "Host navigation" }),
  ).toHaveCount(0);
  await example
    .getByRole("button", { name: "Show interactive preview" })
    .click();
  await example.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Navigation selected locally: #/host/explore",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  await example.getByRole("link", { name: "CHAOSCRAWL", exact: true }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Navigation selected locally: #/host",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("shared comic control demos preserve native links and local keyboard actions", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page
    .getByRole("heading", { name: "Shared comic controls", exact: true })
    .locator("xpath=ancestor::article[1]");
  await expect(
    example.getByRole("button", { name: "Working…" }),
  ).toBeDisabled();
  const link = example.getByRole("link", { name: "Open invite" });
  await expect(link).toHaveAttribute("href", "#/styleguide");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(example.getByRole("status")).toHaveText(
    "Invite link selected locally.",
  );
  await example.getByRole("button", { name: "Delete example" }).focus();
  await page.keyboard.press("Space");
  await expect(example.getByRole("status")).toHaveText(
    "Delete selected locally.",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  const shell = page
    .getByRole("heading", { name: "HostShell + host navigation", exact: true })
    .locator("xpath=ancestor::article[1]");
  await shell.getByRole("button", { name: "Show sidebar preview" }).click();
  await expect(
    shell.getByText("Sidebar content supplied by the route."),
  ).toHaveCount(1);
  await shell.getByRole("button", { name: "Hide sidebar preview" }).click();
  await expect(
    shell.getByText("Sidebar content supplied by the route."),
  ).toHaveCount(0);
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("host workspace navigation keeps default routing and active links", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host");
  await page.getByRole("link", { name: "Saved", exact: true }).click();
  await expect(page).toHaveURL(/#\/host\/saved$/);
  await expect(
    page.getByRole("heading", { name: "Your saved stuff", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Saved", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: /^(My games|Games)$/ }).click();
  await expect(page).toHaveURL(/#\/host\/games$/);
  await expect(
    page.getByRole("heading", { name: "Your games", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^(My games|Games)$/ }),
  ).toHaveAttribute("aria-current", "page");
  backend.verify();
});

test("host timer actions work by keyboard and preserve reset/pause payloads", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/host/live/${sessionId}`);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  const controls = page.getByRole("region", {
    name: "Host controls",
    exact: true,
  });
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Start Timer", exact: true }),
  );
  await expect(
    controls.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    controls.getByLabel("Host control recovery actions", { exact: true }),
  );
  await page.keyboard.press("Escape");
  await expect(
    controls.getByLabel("Host control recovery actions", { exact: true }),
  ).toBeFocused();
  await activateByKeyboard(
    page,
    controls.getByLabel("Host control recovery actions", { exact: true }),
  );
  page.once("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Redo timer", exact: true }),
  );
  await expect(
    controls.getByRole("button", { name: "Start Timer", exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        backend.requests
          .filter(
            (r) => r.name === "cc_game_session_timers" && r.method === "POST",
          )
          .at(-1)?.body,
    )
    .toMatchObject({
      session_id: sessionId,
      round_number: 1,
      remaining_seconds: 300,
      is_running: false,
      is_on_break: false,
    });
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Start Timer", exact: true }),
  );
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Pause", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests
          .filter(
            (r) => r.name === "cc_game_session_timers" && r.method === "POST",
          )
          .at(-1)?.body,
    )
    .toMatchObject({
      session_id: sessionId,
      round_number: 1,
      is_running: false,
      is_on_break: false,
    });
  backend.verify();
});

test("shared timer and round-flow examples use local keyboard actions and disabled states", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panel = page.getByRole("region", {
    name: "Local timer controls",
    exact: true,
  });
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Start sample timer", exact: true }),
  );
  await expect(
    page.getByText("Local timer started.", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Skip & review", exact: true }),
  ).toBeEnabled();
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Reset sample timer", exact: true }),
  );
  await expect(
    panel.getByRole("button", { name: "Start sample timer", exact: true }),
  ).toBeEnabled();
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Review", exact: true }),
  );
  await expect(
    page.getByText("Reward review selected locally.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Sample reward active", { exact: true }).check();
  await expect(
    panel.getByRole("button", { name: "Back", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Continue review", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Sample controls busy", { exact: true }).check();
  for (const button of await panel.getByRole("button").all())
    await expect(button).toBeDisabled();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("host evidence review keeps main, side and secret media contracts and approval payload", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  const { seedReviewEvidence } = await import("./support/reviewEvidence");
  seedReviewEvidence(backend);
  backend.responses.cc_host_review_session_submission = null;
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Review", exact: true }).click();
  const main = page.locator('[data-tour="host-review"]');
  const side = page.locator('[data-tour="host-side-review"]');
  await expect(main.getByText("Needs review", { exact: true })).toBeVisible();
  await expect(main.getByText("+20 pts", { exact: true })).toBeVisible();
  await expect(main.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(
    main.getByRole("img", {
      name: "Evidence for Make an entrance",
      exact: true,
    }),
  ).toHaveCount(3);
  await expect(
    side.getByText("Auto-approved · +5 pts", { exact: true }),
  ).toBeVisible();
  await expect(
    side.getByRole("img", {
      name: "Evidence for Find a pineapple",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Evidence for Secret portrait",
      exact: true,
    }),
  ).toBeVisible();
  const videos = page.locator('video[src*="test-session/test-player/"]');
  await expect(videos).toHaveCount(5);
  for (const video of await videos.all()) {
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video).toHaveAttribute("preload", "metadata");
  }
  page.once("dialog", (dialog) => void dialog.accept("17"));
  await main
    .getByRole("button", { name: "Approve & award points", exact: true })
    .click();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_review_session_submission",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_review_session_submission")
      ?.body,
  ).toEqual({
    p_submission_id: "main-submitted",
    p_approve: true,
    p_points: 17,
  });
  backend.verify();
});

test("local submission evidence review supports approve, reset and reject without backend writes", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panel = page.getByRole("region", {
    name: "Local submission review",
    exact: true,
  });
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Approve sample evidence", exact: true }),
  );
  await expect(panel.getByText("+20 pts", { exact: true })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Reject sample evidence", exact: true }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Reset sample evidence review",
      exact: true,
    }),
  );
  await page.keyboard.press("Shift+Tab");
  await expect(
    panel.getByRole("button", { name: "Reject sample evidence", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(panel.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Sample rejected locally; no submission changed." }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("shared assignment reference toggles its empty state by keyboard without backend requests", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panel = page.getByRole("region", {
    name: "Local assignments",
    exact: true,
  });
  await expect(panel.getByText("For Pat", { exact: true })).toBeVisible();
  await expect(
    panel.getByText("Scheduled · tomorrow", { exact: true }),
  ).toBeVisible();
  const toggle = page.getByRole("checkbox", {
    name: "Show empty sample assignments",
    exact: true,
  });
  await tabTo(page, toggle);
  await page.keyboard.press("Space");
  await expect(
    panel.getByText(
      "No sample assignments. Restore the list with the checkbox below.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(panel.getByText("For Pat", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(panel.getByText("For Pat", { exact: true })).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("the host can create a custom written-answer secret mission", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await page
    .getByRole("button", { name: "Secret missions (0)", exact: true })
    .click();
  await page
    .getByText("Add a custom secret mission to this game", { exact: true })
    .click();
  await page
    .getByLabel("Mission title", { exact: true })
    .fill("Secret question");
  await page
    .getByRole("checkbox", { name: "Require a written answer" })
    .check();
  await expect(
    page.getByRole("checkbox", { name: "Require photo/video evidence" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Add mission", exact: true }).click();
  await expect
    .poll(
      () =>
        backend.requests.find(
          (r) => r.name === "cc_game_session_challenges" && r.method === "POST",
        )?.body,
    )
    .toMatchObject({
      title: "Secret question",
      secret_response_mode: "text",
      allow_photo_upload: false,
    });
  await expect(page.getByLabel("Mission title", { exact: true })).toHaveValue(
    "",
  );
  backend.verify();
});

test("custom secret mission creation and immediate/scheduled assignment preserve their contracts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date("2026-11-18T12:00:00Z"));
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_host_assign_secret_mission = null;
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await page
    .getByRole("button", { name: "Secret missions (0)", exact: true })
    .click();
  await expect(
    page.getByText("No secret missions assigned yet."),
  ).toBeVisible();
  const assign = page.getByRole("button", {
    name: "Assign secret mission",
    exact: true,
  });
  await expect(assign).toBeDisabled();
  await activateByKeyboard(
    page,
    page.getByText("Add a custom secret mission to this game", { exact: true }),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Mission title", { exact: true })
    .fill(" Secret conga ");
  await page
    .getByLabel("Instructions (private to the assigned player)", {
      exact: true,
    })
    .fill(" Start the dance quietly. ");
  await page
    .getByRole("spinbutton", { name: "Points", exact: true })
    .fill("25");
  await tabTo(
    page,
    page.getByRole("checkbox", {
      name: "Require photo/video evidence",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Add mission", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_session_challenges" && r.method === "POST",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_game_session_challenges" && r.method === "POST",
    )?.body,
  ).toEqual({
    session_id: sessionId,
    kind: "secret",
    round_number: null,
    title: "Secret conga",
    description: "Start the dance quietly.",
    points: 25,
    duration_minutes: 10,
    sort_order: 3,
    allow_photo_upload: true,
    secret_response_mode: "media",
  });
  await expect(page.getByLabel("Mission title", { exact: true })).toHaveValue(
    "",
  );
  await expect(
    page.getByRole("checkbox", {
      name: "Require photo/video evidence",
      exact: true,
    }),
  ).not.toBeChecked();
  await page
    .getByRole("combobox", { name: "Send to one player", exact: true })
    .selectOption("test-player");
  await expect(
    page.getByRole("combobox", { name: "Secret mission", exact: true }),
  ).toHaveValue("custom-secret-2");
  await activateByKeyboard(page, assign);
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_assign_secret_mission",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_assign_secret_mission")
      ?.body,
  ).toEqual({
    p_session_id: sessionId,
    p_player_id: "test-player",
    p_challenge_id: "custom-secret-2",
    p_scheduled_at: "2026-11-18T12:00:00.000Z",
  });
  const delivery = page.getByRole("textbox", {
    name: /Deliver at \(optional\)/,
  });
  await delivery.fill("2026-11-20T18:30");
  const scheduled = await page.evaluate(() =>
    new Date("2026-11-20T18:30").toISOString(),
  );
  backend.failures.add("cc_host_assign_secret_mission");
  await activateByKeyboard(page, assign);
  await expect(
    page.getByRole("alert").filter({ hasText: "Fixture connection failed" }),
  ).toBeVisible();
  await expect(delivery).toHaveValue("2026-11-20T18:30");
  backend.rows.cc_game_session_secret_assignments = [
    {
      id: "secret-assignment",
      session_id: sessionId,
      player_id: "test-player",
      challenge_id: "custom-secret-2",
      status: "scheduled",
      scheduled_at: scheduled,
      sent_at: null,
      submitted_at: null,
      reviewed_at: null,
      awarded_points: 0,
      final_review_outcome: null,
      created_at: "2026-11-18T12:00:00Z",
    },
  ];
  backend.failures.delete("cc_host_assign_secret_mission");
  await activateByKeyboard(page, assign);
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_assign_secret_mission",
        ).length,
    )
    .toBe(3);
  expect(
    backend.requests
      .filter((r) => r.name === "cc_host_assign_secret_mission")
      .at(-1)?.body,
  ).toEqual({
    p_session_id: sessionId,
    p_player_id: "test-player",
    p_challenge_id: "custom-secret-2",
    p_scheduled_at: scheduled,
  });
  await expect(delivery).toHaveValue("");
  await expect(page.getByText("Secret conga", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Assigned to Pat", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Secret missions (1)", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Controls", exact: true }).click();
  await page.locator(".control-console__more > summary").click();
  await page
    .locator(".control-console__panel > summary")
    .filter({ hasText: "Secret missions" })
    .click();
  await expect(assign).toBeEnabled();
  await expect(
    page.getByRole("combobox", { name: "Secret mission", exact: true }),
  ).toHaveValue("custom-secret-2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  backend.verify();
});

test("completed host schedules show secret reveals without mission controls", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.status = "completed";
  backend.challenges.push({
    ...backend.challenges[0],
    id: "secret-challenge",
    kind: "secret",
    round_number: null,
    title: "Secret toast",
  });
  backend.rows.cc_game_session_secret_assignments = [
    {
      id: "secret-assignment",
      session_id: sessionId,
      player_id: "test-player",
      challenge_id: "secret-challenge",
      status: "sent",
      scheduled_at: "2030-01-01T18:00:00Z",
      sent_at: "2030-01-01T18:00:00Z",
      submitted_at: null,
      reviewed_at: null,
      awarded_points: 0,
      final_review_outcome: null,
      created_at: "2030-01-01T12:00:00Z",
    },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await page
    .getByRole("button", { name: "Secret missions (1)", exact: true })
    .click();
  await expect(page.getByText("Secret toast", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Assign secret mission", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Add a custom secret mission to this game", { exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("host can reschedule a pending secret mission without changing its assignment", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.challenges.push({
    ...backend.challenges[0],
    id: "secret-challenge",
    kind: "secret",
    round_number: null,
    title: "Secret toast",
  });
  backend.rows.cc_game_session_secret_assignments = [
    {
      id: "secret-assignment",
      session_id: sessionId,
      player_id: "test-player",
      challenge_id: "secret-challenge",
      status: "scheduled",
      scheduled_at: "2030-01-01T18:00:00Z",
      sent_at: null,
      submitted_at: null,
      reviewed_at: null,
      awarded_points: 0,
      final_review_outcome: null,
      created_at: "2030-01-01T12:00:00Z",
    },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("tab", { name: "Secret mission schedule", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Edit schedule for Secret toast",
      exact: true,
    })
    .click();
  const delivery = page.getByLabel("Delivery time", { exact: true });
  await delivery.fill("2030-01-03T19:30");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save time", exact: true }),
  );
  await expect(page.getByRole("status")).toContainText(
    "Secret mission delivery time updated.",
  );
  expect(
    backend.requests.find(
      (request) =>
        request.name === "cc_game_session_secret_assignments" &&
        request.method === "PATCH",
    )?.body,
  ).toEqual({ scheduled_at: new Date("2030-01-03T19:30").toISOString() });
  backend.verify();
});

test("local mission forms submit by keyboard and retain busy states without backend requests", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panel = page.getByRole("region", {
    name: "Local mission forms",
    exact: true,
  });
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Assign secret mission", exact: true }),
  );
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Sample mission assignment selected locally." }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    panel.getByText("Add a custom secret mission to this game", {
      exact: true,
    }),
  );
  const add = panel.getByRole("button", { name: "Add mission", exact: true });
  await expect(add).toBeDisabled();
  await panel
    .getByRole("textbox", { name: "Mission title", exact: true })
    .fill("Local conga");
  await activateByKeyboard(page, add);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Sample mission creation selected locally." }),
  ).toBeVisible();
  await tabTo(
    page,
    page.getByRole("checkbox", {
      name: "Sample mission forms busy",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await expect(add).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Assign secret mission", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("combobox", { name: "Send to one player", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("textbox", { name: "Mission title", exact: true }),
  ).toBeEnabled();
  expect(backend.requests).toEqual([]);
  backend.verify();
});
