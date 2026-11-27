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
async function setParticipation(page: Page, play: boolean) {
  const toggle = page.getByRole("checkbox", { name: "Play as host" });
  if ((await toggle.isChecked()) !== play) {
    await toggle.focus();
    await page.keyboard.press("Space");
    if (play) await expect(toggle).toBeChecked();
    else await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeEnabled();
  }
}

test("does not offer a pre-event invitation when it is disabled in the plan", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [
    {
      id: "test-plan",
      host_id: backend.session.host_id,
      name: "Regression party",
      plan_data: { inviteBeforeEvent: false },
    },
  ];
  await page.goto(`#/host/live/${sessionId}`);
  await expect(page.getByText(/Pre-event invitations are off/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy invitation link" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /#\/join\?code=123456$/ }),
  ).toBeVisible();
  backend.verify();
});
test("shows the invitation address when clipboard access fails", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard unavailable");
        },
      },
    });
  });
  await page.goto(`#/host/live/${sessionId}`);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Copy invitation link" }),
  );
  await expect(page.getByRole("alert")).toContainText("#/invite/123456");
  backend.verify();
});

test("default Play joins once before advancing and retries a failed join", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.failures.add("cc_host_join_as_player");
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Enter your details");
  await expect(
    page.getByRole("checkbox", { name: "Play as host" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(
    page.getByRole("heading", { name: "Enter your details" }),
  ).toBeVisible();
  backend.failures.delete("cc_host_join_as_player");
  await next(page, "Players & teams");
  expect(
    backend.requests.filter((r) => r.name === "cc_host_join_as_player"),
  ).toHaveLength(2);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await next(page, "Players & teams");
  expect(
    backend.requests.filter((r) => r.name === "cc_host_join_as_player"),
  ).toHaveLength(2);
  backend.verify();
});

test("Just host survives back and reload without joining", async ({ page }) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Enter your details");
  const toggle = page.getByRole("checkbox", { name: "Play as host" });
  await tabTo(page, toggle);
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeFocused();
  await expect(toggle).toBeEnabled();
  await next(page, "Players & teams");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByRole("progressbar", { name: "Join progress" }),
  ).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await page.reload();
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByRole("progressbar", { name: "Join progress" }),
  ).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await next(page, "Players & teams");
  expect(
    backend.requests.filter((r) => r.name === "cc_host_join_as_player"),
  ).toHaveLength(0);
  backend.verify();
});

test("the participation toggle keeps focus and ignores input while saving", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/cc_game_sessions?*", async (route) => {
    if (route.request().method() === "PATCH") await pending;
    await route.fallback();
  });
  try {
    await page.goto(`#/host/live/${sessionId}`);
    await next(page, "Enter your details");
    const toggle = page.getByRole("checkbox", { name: "Play as host" });
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-disabled", "true");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Space");
    await expect(toggle).toBeChecked();
    release();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toBeEnabled();
    expect(
      backend.requests.filter(
        (r) => r.name === "cc_game_sessions" && r.method === "PATCH",
      ),
    ).toHaveLength(1);
    backend.verify();
  } finally {
    release();
  }
});

test("a failed default Play photo upload stays on details and retries without rejoining", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Enter your details");
  await page.getByLabel("Upload a profile picture").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixture"),
  });
  backend.failures.add("storage:game-assets");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Fixture storage failed");
  await expect(
    page.getByRole("heading", { name: "Enter your details" }),
  ).toBeVisible();
  backend.failures.delete("storage:game-assets");
  await next(page, "Players & teams");
  expect(
    backend.requests.filter((r) => r.name === "cc_host_join_as_player"),
  ).toHaveLength(1);
  expect(
    backend.requests.filter(
      (r) => r.name === "cc_game_session_players" && r.method === "PATCH",
    ),
  ).toHaveLength(1);
  backend.verify();
});

test("host setup hides tour, score and team until the game starts", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  backend.session.teams_enabled = true;
  backend.session.host_participates = true;
  backend.session.host_player_id = backend.hostPlayer.id;
  backend.hostPlayer.team_id = "alpha";
  backend.hostPlayer.score = 25;
  backend.rows.cc_game_session_teams = [{ id: "alpha", name: "Alpha" }];
  await page.goto(`#/host/live/${sessionId}`);
  const profile = page.locator(".session-profile");
  await expect(
    profile.getByRole("heading", { name: "Test Host" }),
  ).toBeVisible();
  for (const step of [1, 2, 3, 4, 5, 6]) {
    const progress = page.getByRole("progressbar", { name: "Join progress" });
    await expect(progress).toHaveAttribute("aria-valuenow", String(step));
    await expect(progress).toHaveAttribute("aria-valuemax", "6");
    await expect(progress).toHaveAttribute(
      "aria-valuetext",
      `Step ${step} of 6`,
    );
    await expect(
      page.getByText("Join progress", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Take the host tour/ }),
    ).toHaveCount(0);
    const fillPercent = await progress
      .locator("span")
      .evaluate((element) =>
        Number.parseFloat((element as HTMLElement).style.width),
      );
    expect(fillPercent).toBeCloseTo((step / 6) * 100);
    await expect(progress.locator("..")).not.toContainText(`Step ${step}`);
    if (step <= 3) {
      await expect(
        page.locator(".lobby-game-heading + .join-progress"),
      ).toBeVisible();
    }
    await expect(profile.locator(".session-profile__score")).toHaveCount(0);
    await expect(profile).not.toContainText("Alpha");
    if (step === 1) await next(page, "Enter your details");
    if (step === 2) await next(page, "Players & teams");
    if (step === 3) await next(page, "Choose your teams");
    if (step === 4) await next(page, "Name your teams");
    if (step === 5) await next(page, "Ready to start");
  }
  backend.session.status = "live";
  await expect(
    page.getByRole("button", { name: /Take the host tour/ }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(profile.locator(".session-profile__score")).toBeVisible();
  await expect(profile).toContainText("Alpha");
  backend.verify();
});

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
  await next(page, "Enter your details");
  await setParticipation(page, false);
  await next(page, "Players & teams");
  await expect(page.getByText("Pat", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Players per team" })
    .selectOption("3");
  await expect(
    page.getByText("Team capacity updated to 3 players.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".team-choice-list")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start Game" })).toHaveCount(0);
  await next(page, "Choose your teams");
  await expect(
    page.getByRole("heading", { name: "Choose your teams" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  await next(page, "Choose your teams");
  const alpha = page
    .locator("article")
    .filter({ has: page.getByText("Alpha", { exact: true }) });
  await alpha.getByRole("button", { name: "Add Pat", exact: true }).click();
  await expect(
    alpha.getByRole("button", { name: "Leave team", exact: true }),
  ).toBeEnabled();
  const member = alpha.getByRole("button", { name: "Pat", exact: true });
  await expect(member).toHaveCSS("animation-name", "team-member-arrival");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(member).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("textbox", { name: "New team name", exact: true })
    .fill("Gamma");
  await page.getByRole("button", { name: "+ Add team", exact: true }).click();
  await expect(page.locator("output.u-visually-hidden")).toHaveText(
    'Team "Gamma" created.',
  );
  await expect(page.locator(".session-feedback--success")).toHaveCount(0);
  await next(page, "Name your teams");
  const editor = page.locator("article").filter({
    has: page.getByRole("textbox", { name: "Name for Alpha", exact: true }),
  });
  await editor
    .getByRole("textbox", { name: "Name for Alpha", exact: true })
    .fill("Renamed Alpha");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("output.u-visually-hidden")).toHaveText(
    "Team renamed to Renamed Alpha.",
  );
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
  await expect(page.locator("output.u-visually-hidden")).toHaveText(
    "Photo saved for Renamed Alpha.",
  );
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

test("solo lobby starts from the roster without team controls", async ({
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
  await next(page, "Enter your details");
  await next(page, "Players & teams");
  await expect(
    page.getByRole("progressbar", { name: "Join progress" }),
  ).toHaveAttribute("aria-valuetext", "Step 3 of 3");
  await expect(
    page.getByText("This game is set up for individual players.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Players per team" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Manage teams" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "Start Game" })).toBeEnabled();
  await page.getByRole("button", { name: "Start Game" }).click();
  await expect
    .poll(
      () =>
        backend.requests.filter((r) => r.name === "cc_host_start_game_session")
          .length,
    )
    .toBe(1);
  backend.verify();
});

test("join information stays available and team games cannot start with unassigned players", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  backend.session.teams_enabled = true;
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Enter your details");
  const disclosure = page.locator(".lobby-setup__join-disclosure");
  const details = disclosure.locator(".lobby-setup__join-details");
  const toggle = disclosure.locator(".lobby-setup__join-toggle");
  await expect(toggle).toHaveText("Show Join Info");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(details).toBeHidden();
  await expect(disclosure.getByRole("link")).toHaveCount(0);
  await expect(disclosure.getByRole("button")).toHaveCount(1);
  await activateByKeyboard(page, toggle);
  await expect(toggle).toHaveText("Hide Join Info");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const controlsId = await toggle.getAttribute("aria-controls");
  expect(controlsId).toBeTruthy();
  await expect(details).toHaveAttribute("id", controlsId ?? "");
  await expect(details).toBeVisible();
  await expect(details.getByText("123456", { exact: true })).toBeVisible();
  await expect(
    details.getByRole("link", { name: /#\/join\?code=/ }),
  ).toHaveAttribute("href", /#\/join\?code=123456$/);
  await expect(
    details.getByRole("button", { name: "Copy game link" }),
  ).toBeVisible();
  await expect(
    details.getByRole("button", { name: "Copy invitation link" }),
  ).toBeVisible();
  await expect(
    details.getByRole("img", { name: "QR code to join the game" }),
  ).toBeVisible();
  const toggleBox = await toggle.boundingBox();
  const detailsBox = await details.boundingBox();
  if (!toggleBox || !detailsBox)
    throw new Error("Join disclosure is not visible");
  expect(detailsBox.y).toBeGreaterThanOrEqual(toggleBox.y + toggleBox.height);
  await activateByKeyboard(page, toggle);
  await expect(toggle).toHaveText("Show Join Info");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(details).toBeHidden();
  await expect(disclosure.getByRole("link")).toHaveCount(0);
  await next(page, "Players & teams");
  await expect(toggle).toHaveText("Show Join Info");
  await activateByKeyboard(page, toggle);
  await expect(toggle).toHaveText("Hide Join Info");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    details.getByRole("link", { name: /#\/join\?code=/ }),
  ).toBeVisible();
  await expect(
    details.getByRole("button", { name: "Copy game link" }),
  ).toBeVisible();
  await next(page, "Choose your teams");
  await expect(
    page.getByRole("button", { name: "Hide Join Info" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ready to start" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Every player must be assigned to a team",
  );
  expect(
    backend.requests.filter((r) => r.name === "cc_host_start_game_session"),
  ).toHaveLength(0);
  backend.verify();
});

test("the lobby header previews the selected host photo and restores the saved avatar when cleared", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  backend.session.host_participates = true;
  backend.session.host_player_id = backend.hostPlayer.id;
  const savedAvatar =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT1kAAAAASUVORK5CYII=";
  backend.hostPlayer.avatar_url = savedAvatar;
  await page.goto(`#/host/live/${sessionId}`);
  const avatarSlot = page.locator(".session-profile__avatar");
  const avatar = avatarSlot.locator("img");
  async function avatarPosition() {
    return avatarSlot.evaluate((element) => {
      const profile = element.closest(".session-profile");
      if (!profile) throw new Error("Missing session profile");
      const box = element.getBoundingClientRect();
      const parent = profile.getBoundingClientRect();
      return {
        x: box.x - parent.x,
        y: box.y - parent.y,
        width: box.width,
        height: box.height,
      };
    });
  }
  await expect(avatar).toHaveAttribute("src", savedAvatar);
  await next(page, "Enter your details");
  const originalPosition = await avatarPosition();
  const upload = page.getByLabel("Upload a profile picture");
  const image = {
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(savedAvatar.split(",")[1], "base64"),
  };
  await upload.setInputFiles(image);
  const preview = page.getByAltText("Profile preview");
  const firstPreview = await preview.getAttribute("src");
  expect(firstPreview).toMatch(/^blob:/);
  await expect(avatar).toHaveAttribute("src", firstPreview ?? "");
  expect(await avatarPosition()).toEqual(originalPosition);
  await expect
    .poll(() =>
      avatar.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
  await upload.setInputFiles({ ...image, name: "replacement.png" });
  const replacement = await preview.getAttribute("src");
  expect(replacement).not.toBe(firstPreview);
  await expect(avatar).toHaveAttribute("src", replacement ?? "");
  await upload.setInputFiles([]);
  await expect(avatar).toHaveAttribute("src", savedAvatar);
  backend.verify();
});

test("a photo selected after joining is saved before advancing", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
    savedPlayer: false,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await next(page, "Enter your details");
  await setParticipation(page, false);
  await setParticipation(page, true);
  await expect(
    page.getByText("You're in the game as Test Host."),
  ).toBeVisible();
  await page.getByLabel("Upload a profile picture").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixture"),
  });
  const preview = await page
    .getByAltText("Profile preview")
    .getAttribute("src");
  await expect(page.locator(".session-profile__avatar img")).toHaveAttribute(
    "src",
    preview ?? "",
  );
  backend.failures.add("storage:game-assets");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Fixture storage failed");
  await expect(
    page.getByRole("heading", { name: "Enter your details" }),
  ).toBeVisible();
  backend.failures.delete("storage:game-assets");
  await next(page, "Players & teams");
  expect(backend.requests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "cc_game_session_players",
        method: "PATCH",
        body: {
          avatar_url: expect.stringMatching(
            /host-avatars\/test-session\/.*\.png$/,
          ),
        },
      }),
    ]),
  );
  expect(
    backend.requests.filter((r) => r.name === "cc_host_join_as_player"),
  ).toHaveLength(1);
  await page.reload();
  await expect(page.locator(".session-profile__avatar img")).toHaveAttribute(
    "src",
    /host-avatars\/test-session\/.*\.png$/,
  );
  backend.session.status = "live";
  await expect(page.locator(".session-profile__score")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator(".session-profile__avatar img")).toHaveAttribute(
    "src",
    /host-avatars\/test-session\/.*\.png$/,
  );
  backend.verify();
});

test("participation finishes its photo upload before the host can advance", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/storage/v1/object/game-assets/**", async (route) => {
    if (route.request().method() === "POST") await pending;
    await route.fallback();
  });
  try {
    await page.goto(`#/host/live/${sessionId}`);
    await next(page, "Enter your details");
    await page.getByLabel("Upload a profile picture").setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("fixture"),
    });
    const preview = await page
      .getByAltText("Profile preview")
      .getAttribute("src");
    await expect(page.locator(".session-profile__avatar img")).toHaveAttribute(
      "src",
      preview ?? "",
    );
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect
      .poll(
        () =>
          backend.requests.filter((r) => r.name === "cc_host_join_as_player")
            .length,
      )
      .toBe(1);
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    release();
    await expect(
      page.getByRole("heading", { name: "Players & teams" }),
    ).toBeVisible();
    expect(
      backend.requests.filter((r) => r.name === "storage:game-assets"),
    ).toHaveLength(1);
    backend.verify();
  } finally {
    release();
  }
});

test("shared lobby controls advance and toggle locally in the styleguide", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const joinExample = page
    .getByRole("heading", { name: "Host join information", exact: true })
    .locator("xpath=ancestor::article[1]");
  const joinToggle = joinExample.getByRole("button", {
    name: "Show Join Info",
  });
  await joinToggle.focus();
  await page.keyboard.press("Space");
  await expect(
    joinExample.getByRole("button", { name: "Hide Join Info" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(joinToggle).toHaveAttribute("aria-expanded", "false");
  const participationExample = page
    .getByRole("heading", { name: "Host lobby participation", exact: true })
    .locator("xpath=ancestor::article[1]");
  const localPlay = participationExample.getByRole("checkbox", {
    name: "Play as host",
  });
  await expect(localPlay).toBeChecked();
  await tabTo(page, localPlay);
  await page.keyboard.press("Space");
  await expect(localPlay).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(localPlay).toBeChecked();
  const profileExample = page
    .getByRole("heading", {
      name: "SessionPlayerProfile + SessionGameTitlebar",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  const scoreToggle = profileExample.getByRole("checkbox", {
    name: "Show profile score and rank",
  });
  await expect(profileExample.locator(".session-profile__score")).toBeVisible();
  await scoreToggle.focus();
  await page.keyboard.press("Space");
  await expect(profileExample.locator(".session-profile__score")).toHaveCount(
    0,
  );
  await page.keyboard.press("Space");
  await expect(profileExample.locator(".session-profile__score")).toBeVisible();
  const example = page
    .getByRole("heading", {
      name: "Lobby controls and step progress",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  const joinTrack = example.getByRole("progressbar", { name: "Join progress" });
  const hubTrack = page.locator(".setup-progress__track").first();
  await expect(hubTrack).toBeAttached();
  const trackStyles = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.height,
          style.border,
          style.borderRadius,
          style.backgroundColor,
        ];
      });
  expect(await trackStyles(".step-progress--join")).toEqual(
    await trackStyles(".setup-progress__track"),
  );
  const fillStyles = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.borderRight, style.borderRadius];
      });
  expect(await fillStyles(".step-progress--join span")).toEqual(
    await fillStyles(".setup-progress__track span"),
  );
  await expect(joinTrack).toHaveAttribute("aria-valuenow", "1");
  const nextStep = example.getByRole("button", {
    name: "Next example step",
    exact: true,
  });
  await nextStep.focus();
  await page.keyboard.press("Enter");
  await expect(joinTrack).toHaveAttribute("aria-valuenow", "2");
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

test("host participation and player selection controls expose their state", async ({
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
  await next(page, "Enter your details");
  const card = page.locator(".lobby-participation__card");
  await expect(
    card.getByRole("heading", {
      name: "Would you like to participate as well as host?",
    }),
  ).toBeVisible();
  await expect(card.getByRole("checkbox")).toBeChecked();
  await expect(card.getByLabel("Upload a profile picture")).toHaveCount(0);
  const upload = page.locator(".portrait-upload--lobby");
  await expect(upload).toBeVisible();
  await expect(card).toHaveCSS(
    "background-color",
    await upload.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  );
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await card.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return [...element.querySelectorAll("h3, label")].every((child) => {
        const box = child.getBoundingClientRect();
        return box.left >= bounds.left && box.right <= bounds.right;
      });
    }),
  ).toBe(true);
  if (viewport) await page.setViewportSize(viewport);
  await setParticipation(page, false);
  await setParticipation(page, true);
  await next(page, "Players & teams");
  await next(page, "Choose your teams");
  await expect(
    page.getByRole("heading", { name: "Choose your teams" }),
  ).toBeVisible();
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
    page.getByRole("heading", { name: "Enter your details", exact: true }),
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
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.filter(
      (r) => r.name === "cc_game_session_players" && r.method === "PATCH",
    ),
  ).toHaveLength(1);
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
