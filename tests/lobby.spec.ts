import { tabTo, activateByKeyboard } from "./support/keyboard";
import { expect, test, type Page } from "@playwright/test";
import { installSessionBackend, sessionId } from "./support/sessionBackend";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});
async function next(page: Page, heading: string) {
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: heading, exact: true }),
  ).toBeVisible();
}

test("host lobby retains team capacity, assignment, creation, naming and photo paths", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [
    { id: "alpha", name: "Alpha" },
    { id: "beta", name: "Beta" },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Share the invite", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /127.0.0.1/ })).toHaveAttribute(
    "href",
    /#\/join\?code=123456$/,
  );
  await next(page, "Join your game");
  await page
    .getByRole("button", { name: "No, I’ll host", exact: true })
    .click();
  await next(page, "Players & teams");
  await expect(page.getByText("Pat", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Players per team" })
    .selectOption("3");
  await expect(
    page.getByText("Team capacity updated to 3 players.", { exact: true }),
  ).toBeVisible();
  await next(page, "Choose your teams");
  const alpha = page
    .locator("article")
    .filter({ has: page.getByText("Alpha", { exact: true }) });
  await alpha.getByRole("button", { name: "Add Pat", exact: true }).click();
  await expect(
    alpha.getByRole("button", { name: "Leave team", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("textbox", { name: "New team name", exact: true })
    .fill("Gamma");
  await page.getByRole("button", { name: "+ Add team", exact: true }).click();
  await expect(
    page.getByText('Team "Gamma" created.', { exact: true }),
  ).toBeVisible();
  await next(page, "Name your teams");
  const editor = page.locator("article").filter({
    has: page.getByRole("textbox", { name: "Name for Alpha", exact: true }),
  });
  await editor
    .getByRole("textbox", { name: "Name for Alpha", exact: true })
    .fill("Renamed Alpha");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Team renamed to Renamed Alpha.", { exact: true }),
  ).toBeVisible();
  const renamed = page.locator("article").filter({
    has: page.getByRole("textbox", {
      name: "Name for Renamed Alpha",
      exact: true,
    }),
  });
  await renamed.locator('input[type="file"]').setInputFiles({
    name: "team.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT1kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByText("Photo saved for Renamed Alpha.", { exact: true }),
  ).toBeVisible();
  await expect(renamed.getByAltText("Team photo")).toHaveAttribute(
    "src",
    /\/game-assets\/team-photos\/test-session\/alpha-.*\.png$/,
  );
  await next(page, "Ready to start");
  await expect(
    page.getByText("1 of 3 teams ready", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Game", exact: true }),
  ).toBeEnabled();
  expect(backend.requests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "cc_game_sessions",
        method: "PATCH",
        body: { team_size: 3 },
      }),
      expect.objectContaining({
        name: "cc_game_session_players",
        method: "PATCH",
        body: { team_id: "alpha" },
      }),
      expect.objectContaining({
        name: "cc_game_session_teams",
        method: "POST",
        body: { session_id: sessionId, name: "Gamma" },
      }),
      expect.objectContaining({
        name: "cc_game_session_teams",
        method: "PATCH",
        body: { name: "Renamed Alpha" },
      }),
      expect.objectContaining({
        name: "host_games",
        method: "PATCH",
        body: expect.objectContaining({
          plan_data: expect.objectContaining({
            teamPhotoUrls: expect.objectContaining({
              alpha: expect.stringMatching(/team-photos\//),
            }),
          }),
        }),
      }),
    ]),
  );
  backend.verify();
});

test("solo lobby keeps all six steps available without team controls", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Share the invite", exact: true }),
  ).toBeVisible();
  await next(page, "Join your game");
  await next(page, "Players & teams");
  await expect(
    page.getByText("This game is set up for individual players.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Players per team" }),
  ).toHaveCount(0);
  await next(page, "Choose your teams");
  await expect(
    page.getByRole("heading", { name: "Playing solo", exact: true }),
  ).toBeVisible();
  await next(page, "Name your teams");
  await expect(
    page.getByText(
      "This game is set up for individual players, so team setup is skipped.",
      { exact: true },
    ),
  ).toBeVisible();
  await next(page, "Ready to start");
  await expect(
    page.getByText("1 players ready", { exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("shared lobby controls advance and toggle locally in the styleguide", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page
    .getByRole("heading", {
      name: "Lobby controls and step progress",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  const nextStep = example.getByRole("button", {
    name: "Next example step",
    exact: true,
  });
  await nextStep.focus();
  await page.keyboard.press("Enter");
  await expect(example.getByRole("status")).toHaveText(
    "Step 2 selected locally.",
  );
  const previous = example.getByRole("button", {
    name: "Previous example step",
    exact: true,
  });
  await expect(previous).toBeEnabled();
  const choice = example.getByRole("button", {
    name: "Toggle lobby choice",
    exact: true,
  });
  await choice.focus();
  await page.keyboard.press("Space");
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(previous).toBeDisabled();
  await expect(example.getByRole("status")).toHaveText(
    "Step 1 selected locally.",
  );
  const photoExample = page
    .getByRole("heading", { name: "Keyboard photo chooser", exact: true })
    .locator("xpath=ancestor::article[1]");
  const photoInput = photoExample.getByLabel(
    "Upload team picture for Example team",
    { exact: true },
  );
  await photoInput.focus();
  const localChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Space");
  await (
    await localChooser
  ).setFiles({
    name: "local.png",
    mimeType: "image/png",
    buffer: Buffer.from("local-only"),
  });
  await expect(photoExample.getByRole("status")).toHaveText(
    "Selected local.png locally.",
  );
  await expect(photoInput).toHaveValue("");

  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("host and player selection controls expose their pressed state", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [{ id: "alpha", name: "Alpha" }];
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Join your game");
  const hostOnly = page.getByRole("button", {
    name: "No, I’ll host",
    exact: true,
  });
  const play = page.getByRole("button", {
    name: "Yes, I’ll play",
    exact: true,
  });
  await expect(hostOnly).toHaveAttribute("aria-pressed", "true");
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await play.click();
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await expect(hostOnly).toHaveAttribute("aria-pressed", "false");
  await next(page, "Players & teams");
  await next(page, "Choose your teams");
  const pat = page.getByRole("button", { name: "Pat", exact: true });
  await expect(pat).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("combobox", { name: "Choose a player to move" })
    .selectOption("host-player");
  await expect(pat).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Add Test Host", exact: true })
    .click();
  const hostMember = page.getByRole("button", {
    name: "Test Host",
    exact: true,
  });
  await expect(hostMember).toHaveAttribute("aria-pressed", "true");
  await pat.click();
  await expect(hostMember).toHaveAttribute("aria-pressed", "false");
  backend.verify();
});

test("keyboard-only lobby setup opens both photo choosers and assigns players", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [{ id: "alpha", name: "Alpha" }];
  const photo = {
    name: "keyboard.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT1kAAAAASUVORK5CYII=",
      "base64",
    ),
  };
  await page.goto(`#/host/live/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Share the invite", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Join your game", exact: true }),
  ).toBeVisible();
  const portrait = page.getByLabel(/Upload a profile picture/);
  await tabTo(page, portrait);
  await expect(page.locator(".portrait-upload")).toHaveCSS(
    "outline-style",
    "solid",
  );
  const portraitChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Space");
  await (await portraitChooser).setFiles(photo);
  await expect(page.getByAltText("Profile preview")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Yes, I’ll play", exact: true }),
  );
  await expect(
    page.getByText("You're in the game as Test Host.", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_session_players" && r.method === "PATCH",
        ).length,
    )
    .toBe(1);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Choose your teams", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Pat", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Add Pat", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Leave team", exact: true }),
  ).toBeEnabled();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Name your teams", exact: true }),
  ).toBeVisible();
  const teamPhoto = page.getByLabel(/Upload team picture/);
  await tabTo(page, teamPhoto);
  await expect(page.locator(".team-image-upload")).toHaveCSS(
    "outline-style",
    "solid",
  );
  const teamChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Space");
  await (await teamChooser).setFiles(photo);
  await expect(
    page.getByText("Photo saved for Alpha.", { exact: true }),
  ).toBeVisible();
  await expect(teamPhoto).toHaveValue("");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Ready to start", exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "storage:game-assets",
        body: {
          path: expect.stringMatching(/\/host-avatars\/test-session\/.*\.png$/),
        },
      }),
      expect.objectContaining({
        name: "storage:game-assets",
        body: {
          path: expect.stringMatching(
            /\/team-photos\/test-session\/alpha-.*\.png$/,
          ),
        },
      }),
      expect.objectContaining({
        name: "cc_game_session_players",
        method: "PATCH",
        body: {
          avatar_url: expect.stringMatching(
            /\/game-assets\/host-avatars\/test-session\/.*\.png$/,
          ),
        },
      }),
      expect.objectContaining({
        name: "cc_game_session_players",
        method: "PATCH",
        body: { team_id: "alpha" },
      }),
    ]),
  );
  backend.verify();
});
