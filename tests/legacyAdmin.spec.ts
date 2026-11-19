import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostOperations } from "./support/legacyHostOperations";

async function installAdmin(page: Page) {
  const fixture = await installLegacyHostOperations(page);
  fixture.backend.rows.votes = [];
  return fixture;
}

async function openAdmin(page: Page) {
  await page.goto("#/admin-legacy");
  await expect(
    page.getByRole("heading", { name: "Host Control" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Round Challenges" }),
  ).toBeVisible();
}
async function tab(page: Page, name: string) {
  await activateByKeyboard(
    page,
    page.getByRole("button", { name, exact: true }),
  );
  const headings: Record<string, string> = {
    "🔴 Live": "Round Challenges",
    "🌙 Tonight": "Schedule a Reveal",
    "🎯 Challenges": "Play as a Player",
    "✅ Review": "Challenge Review",
    "📺 Screens": "Host Screens",
    "🗳️ Voting": "Voting",
    "👥 Players": "Players",
    "🏁 Teams": "Assign Teams",
  };
  await expect(
    page.getByRole("heading", { name: headings[name], exact: true }),
  ).toBeVisible();
}

function acceptNext(page: Page, expected: string) {
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(expected);
    await dialog.accept();
  });
}

test("legacy administration keeps all eight native tab paths and completion projection", async ({
  page,
}) => {
  const { writes, rosterWrites, awards } = await installAdmin(page);
  await openAdmin(page);
  await tab(page, "🌙 Tonight");
  await expect(
    page.getByRole("heading", { name: "Schedule a Reveal" }),
  ).toBeVisible();
  await tab(page, "🎯 Challenges");
  await page
    .getByRole("combobox", { name: "Play as player" })
    .selectOption("p1");
  await expect(
    page.getByRole("heading", { name: "Chaos Bingo" }),
  ).toBeVisible();
  await expect(page.getByText("✓ Pat", { exact: true })).toBeVisible();
  await tab(page, "✅ Review");
  await expect(
    page.getByRole("heading", { name: "Challenge Review" }),
  ).toBeVisible();
  await expect(page.getByText("side • +3 points", { exact: true })).toHaveCount(
    2,
  );
  await expect(page.getByText("Challenge 11", { exact: true })).toHaveCount(1);
  await tab(page, "📺 Screens");
  await expect(
    page.getByRole("heading", { name: "Host Screens" }),
  ).toBeVisible();
  await tab(page, "🗳️ Voting");
  await expect(
    page.getByRole("heading", { name: "Live Voting Results", exact: true }),
  ).toBeVisible();
  await tab(page, "👥 Players");
  await expect(page.getByText("Score: 10", { exact: true })).toBeVisible();
  await expect(page.getByText("Score: 500", { exact: true })).toHaveCount(0);
  await tab(page, "🏁 Teams");
  await expect(
    page.getByRole("heading", { name: "Assign Teams" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Team for Pat" }),
  ).toHaveValue("Ducks");
  await tab(page, "🔴 Live");
  await expect(
    page.getByRole("heading", { name: "Change Live Game" }),
  ).toBeVisible();
  expect(writes).toEqual([]);
  expect(rosterWrites).toEqual([]);
  expect(awards).toEqual([]);
});

test("legacy player tools append score events, recover failures, trim renames and confirm deletion", async ({
  page,
}) => {
  const { backend, awards, rosterWrites } = await installAdmin(page);
  await openAdmin(page);
  await tab(page, "👥 Players");
  backend.failures.add("score_events");
  acceptNext(page, "Could not update score: Fixture score write failed");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "+5", exact: true }),
  );
  await expect.poll(() => awards.length).toBe(1);
  await expect(
    page.getByRole("button", { name: "+5", exact: true }),
  ).toBeEnabled();
  backend.failures.delete("score_events");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "+5", exact: true }),
  );
  await expect(page.getByText("Score: 15", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "-5", exact: true }),
  );
  await expect(page.getByText("Score: 10", { exact: true })).toBeVisible();
  expect(awards.map((entry) => entry.body)).toEqual([
    expect.objectContaining({
      player_id: "p1",
      points: 5,
      reason: "Points added by host",
    }),
    expect.objectContaining({
      player_id: "p1",
      points: 5,
      reason: "Points added by host",
    }),
    expect.objectContaining({
      player_id: "p1",
      points: -5,
      reason: "Points removed by host",
    }),
  ]);
  await page.getByRole("textbox", { name: "Name for Pat" }).fill("  Robin  ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save Name", exact: true }),
  );
  await expect(
    page.getByRole("textbox", { name: "Name for Robin" }),
  ).toHaveValue("Robin");
  expect(rosterWrites[0]).toEqual({
    table: "players",
    method: "PATCH",
    query: { id: "eq.p1" },
    body: { name: "Robin" },
  });
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("Delete Robin?");
    await dialog.dismiss();
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Delete Player" }),
  );
  expect(rosterWrites).toHaveLength(1);
  acceptNext(page, "Delete Robin?");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Delete Player" }),
  );
  await expect(
    page.getByRole("textbox", { name: "Name for Robin" }),
  ).toHaveCount(0);
  expect(rosterWrites[1]).toEqual({
    table: "players",
    method: "DELETE",
    query: { id: "eq.p1" },
    body: null,
  });
});

test("legacy team tools trim creation and preserve name-based assignments including unassigned", async ({
  page,
}) => {
  const { rosterWrites } = await installAdmin(page);
  await openAdmin(page);
  await tab(page, "🏁 Teams");
  await page.getByPlaceholder("Team name...").fill("  Geese  ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create Team", exact: true }),
  );
  await expect(page.getByPlaceholder("Team name...")).toHaveValue("");
  await expect(
    page.locator("span").filter({ hasText: /^Geese$/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Team for Pat" })
    .selectOption("Geese");
  await expect(
    page.getByRole("combobox", { name: "Team for Pat" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("combobox", { name: "Team for Pat" }),
  ).toHaveValue("Geese");
  await page.getByRole("combobox", { name: "Team for Pat" }).selectOption("");
  await expect.poll(() => rosterWrites.length).toBe(3);
  expect(rosterWrites).toEqual([
    { table: "teams", method: "POST", query: {}, body: { name: "Geese" } },
    {
      table: "players",
      method: "PATCH",
      query: { id: "eq.p1" },
      body: { team: "Geese" },
    },
    {
      table: "players",
      method: "PATCH",
      query: { id: "eq.p1" },
      body: { team: null },
    },
  ]);
});

test("legacy live selection preserves pub ordering and exact publish payload", async ({
  page,
}) => {
  const { writes } = await installAdmin(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openAdmin(page);
  const selection = page
    .getByRole("heading", { name: "Change Live Game" })
    .locator("..");
  const controls = selection.getByRole("combobox");
  expect(await controls.nth(0).locator("option").allTextContents()).toEqual([
    "Select pub",
    "First pub",
    "Second pub",
    "Empty pub",
  ]);
  await controls.nth(0).selectOption("Second pub");
  await expect(controls.nth(1)).toHaveValue("Scheduled challenge");
  await controls.nth(1).selectOption("Later challenge");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Go Live", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({
    query: { id: "eq.1" },
    body: {
      current_pub: "Second pub",
      current_challenge: "Later challenge",
      current_challenge_id: 3,
      challenge_description: "Make a scene.",
      current_challenge_order: 1,
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
  });
});

test("legacy schedule validates before writing and cancels with explicit null fields", async ({
  page,
}) => {
  const { writes } = await installAdmin(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openAdmin(page);
  await tab(page, "🌙 Tonight");
  const schedule = page
    .getByRole("heading", { name: "Schedule a Reveal" })
    .locator("..");
  await schedule.getByRole("textbox").fill("0");
  acceptNext(page, "Enter a valid number of minutes.");
  await activateByKeyboard(
    page,
    schedule.getByRole("button", { name: "⏰ Schedule This" }).first(),
  );
  expect(writes).toEqual([]);
  await schedule.getByRole("textbox").fill("5");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain('"Past challenge" scheduled for');
    await dialog.accept();
  });
  await activateByKeyboard(
    page,
    schedule.getByRole("button", { name: "⏰ Schedule This" }).first(),
  );
  await expect.poll(() => writes.length).toBe(1);
  await activateByKeyboard(
    page,
    schedule.getByRole("button", { name: "Cancel Scheduled Reveal" }),
  );
  await expect.poll(() => writes.length).toBe(2);
  expect(writes.map((entry) => entry.body)).toEqual([
    {
      scheduled_challenge_id: 1,
      scheduled_reveal_at: "2026-11-17T12:05:00.000Z",
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
  ]);
});

test("legacy voting confirms exclusive phase flags and screens preserve slideshow navigation", async ({
  page,
}) => {
  const { writes } = await installAdmin(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openAdmin(page);
  await tab(page, "🗳️ Voting");
  await page.getByRole("combobox").selectOption("team");
  await expect.poll(() => writes.length).toBe(1);
  acceptNext(page, "Open voting for the current challenge?");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Open Voting", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(2);
  await tab(page, "👥 Players");
  await tab(page, "🗳️ Voting");
  acceptNext(page, "Close voting and show results?");
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Close Voting & Show Results",
      exact: true,
    }),
  );
  await expect.poll(() => writes.length).toBe(3);
  await tab(page, "👥 Players");
  await tab(page, "🗳️ Voting");
  acceptNext(page, "Close results and return everyone to the game?");
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Close Results & Return Everyone",
      exact: true,
    }),
  );
  await expect.poll(() => writes.length).toBe(4);
  await tab(page, "📺 Screens");
  acceptNext(page, "Start the slideshow for everyone?");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Start Slideshow", exact: true }),
  );
  await expect(page).toHaveURL(/#\/slideshow\?host=true$/);
  expect(writes.map((entry) => entry.body)).toEqual([
    { voting_target: "team", updated_at: "2026-11-17T12:00:00.000Z" },
    {
      voting_open: true,
      show_vote_results: false,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      voting_open: false,
      show_vote_results: true,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      show_vote_results: false,
      voting_open: false,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      slideshow_open: true,
      voting_open: false,
      show_vote_results: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
  ]);
});

test("legacy query failures retain a working retry path before showing first-load data", async ({
  page,
}) => {
  const { backend } = await installAdmin(page);
  backend.failures.add("players");
  await openAdmin(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "👥 Players", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText("Fixture connection failed");
  await expect(page.getByRole("textbox", { name: "Name for Pat" })).toHaveCount(
    0,
  );
  backend.failures.delete("players");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Try again" }),
  );
  await expect(
    page.getByRole("textbox", { name: "Name for Pat" }),
  ).toBeVisible();
  await expect(page.getByText("Score: 10", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("local legacy administration exercises native forms, chooser, recovery and intercepted navigation", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) requests.push(request.url());
  });
  await page.goto("#/styleguide");
  const reference = page.getByRole("region", {
    name: "Local legacy administration reference",
  });
  await expect(reference).toBeVisible();
  await reference
    .getByRole("button", { name: "👥 Players", exact: true })
    .press("Enter");
  await reference
    .getByRole("button", { name: "+5", exact: true })
    .press("Enter");
  await expect(reference.getByText("Score: 15", { exact: true })).toBeVisible();
  const name = reference.getByRole("textbox", { name: "Name for Robin" });
  await name.fill("  Robyn  ");
  await name.press("Enter");
  await expect(
    reference.getByRole("textbox", { name: "Name for Robyn" }),
  ).toHaveValue("Robyn");
  await reference
    .getByRole("checkbox", { name: "Preview pending operation" })
    .check();
  await expect(
    reference.getByRole("button", { name: "+5", exact: true }),
  ).toBeDisabled();
  await reference
    .getByRole("checkbox", { name: "Preview pending operation" })
    .uncheck();
  await reference
    .getByRole("checkbox", { name: "Preview query error" })
    .check();
  await expect(reference.getByRole("alert")).toHaveText("Preview query failed");
  await reference.getByRole("button", { name: "Try again" }).press("Enter");
  await expect(reference.getByRole("alert")).toHaveCount(0);
  await reference
    .getByRole("button", { name: "🏁 Teams", exact: true })
    .press("Enter");
  await reference.getByPlaceholder("Team name...").fill("  Bears  ");
  await reference
    .getByRole("button", { name: "Create Team", exact: true })
    .press("Enter");
  await reference
    .getByRole("combobox", { name: "Team for Robyn" })
    .selectOption("Bears");
  await expect(
    reference.getByRole("combobox", { name: "Team for Robyn" }),
  ).toHaveValue("Bears");
  await reference
    .getByRole("button", { name: "🎯 Challenges", exact: true })
    .press("Enter");
  await reference
    .getByRole("combobox", { name: "Play as player" })
    .selectOption("sample-player");
  const chooser = page.waitForEvent("filechooser");
  await reference
    .getByRole("button", {
      name: "📸 Upload Photo / Video",
      exact: true,
    })
    .press("Enter");
  await (
    await chooser
  ).setFiles({
    name: "preview-evidence.png",
    mimeType: "image/png",
    buffer: Buffer.from("local preview"),
  });
  await expect(reference.getByRole("status")).toHaveText(
    "preview-evidence.png",
  );
  await reference
    .getByRole("button", { name: "✓ Mark Done", exact: true })
    .press("Enter");
  await expect(
    reference.getByText("✓ Completed", { exact: true }),
  ).toBeVisible();
  await reference
    .getByRole("button", { name: "✅ Review", exact: true })
    .press("Enter");
  await expect(
    reference.getByText("📸 Media attached", { exact: true }),
  ).toBeVisible();
  await reference
    .getByRole("button", { name: "🗳️ Voting", exact: true })
    .press("Enter");
  await reference
    .getByRole("button", { name: "Open Voting", exact: true })
    .press("Enter");
  await expect(
    reference.getByRole("button", { name: "Vote Now", exact: false }),
  ).toBeVisible();
  await reference
    .getByRole("button", { name: "📺 Screens", exact: true })
    .press("Enter");
  await reference
    .getByRole("button", { name: "Leaderboard", exact: true })
    .press("Enter");
  await expect(reference.getByRole("status")).toHaveText(
    "Preview navigation: /leaderboard",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(requests).toEqual([]);
});

test("legacy visible labels focus their native controls and retain control typography and commands", async ({
  page,
}) => {
  const { writes, awards, rosterWrites } = await installAdmin(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openAdmin(page);
  await page.locator("label").filter({ hasText: /^Pub$/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Pub", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("combobox", { name: "Challenge", exact: true }),
  ).toBeFocused();
  await tab(page, "🌙 Tonight");
  await page
    .locator("label")
    .filter({ hasText: /^Reveal in minutes$/ })
    .click();
  const minutes = page.getByRole("textbox", { name: "Reveal in minutes" });
  await expect(minutes).toBeFocused();
  expect(
    await minutes.evaluate((element) =>
      element instanceof HTMLInputElement ? element.type : null,
    ),
  ).toBe("text");
  await minutes.fill("005.5");
  await expect(minutes).toHaveValue("005.5");
  await tab(page, "🏁 Teams");
  await page
    .locator("label")
    .filter({ hasText: /^Team name$/ })
    .click();
  const name = page.getByRole("textbox", { name: "Team name", exact: true });
  await expect(name).toBeFocused();
  await expect(name).toHaveCSS("font-size", "16px");
  await name.fill("  Geese  ");
  await page.locator("label").filter({ hasText: /^Pat$/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Team for Pat" }),
  ).toBeFocused();
  await tab(page, "🎯 Challenges");
  await page
    .locator("label")
    .filter({ hasText: /^Play as a Player$/ })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Play as player" }),
  ).toBeFocused();
  await tab(page, "🗳️ Voting");
  await page
    .locator("label")
    .filter({ hasText: /^Vote for$/ })
    .click();
  const target = page.getByRole("combobox", { name: "Vote for", exact: true });
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS("font-size", "16px");
  await target.selectOption("team");
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]?.body).toEqual({
    voting_target: "team",
    updated_at: "2026-11-17T12:00:00.000Z",
  });
  expect(rosterWrites).toEqual([]);
  expect(awards).toEqual([]);
});

test("local administration labels activate native fields without duplicate IDs or backend access", async ({
  page,
}) => {
  const backend: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) backend.push(request.url());
  });
  await page.goto("#/styleguide");
  const reference = page.getByRole("region", {
    name: "Local legacy administration reference",
  });
  await reference
    .getByRole("button", { name: "🏁 Teams", exact: true })
    .press("Enter");
  await expect(
    reference.locator("label").filter({ hasText: /^Team name$/ }),
  ).toBeVisible();
  await reference
    .locator("label")
    .filter({ hasText: /^Team name$/ })
    .click();
  await expect(
    reference.getByRole("textbox", { name: "Team name", exact: true }),
  ).toBeFocused();
  await reference
    .locator("label")
    .filter({ hasText: /^Robin$/ })
    .click();
  await expect(
    reference.getByRole("combobox", { name: "Team for Robin" }),
  ).toBeFocused();
  await reference
    .getByRole("button", { name: "🗳️ Voting", exact: true })
    .press("Enter");
  await reference
    .locator("label")
    .filter({ hasText: /^Vote for$/ })
    .click();
  await expect(
    reference.getByRole("combobox", { name: "Vote for", exact: true }),
  ).toBeFocused();
  const fieldIds = await reference
    .locator("input[id], select[id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  for (const id of fieldIds) {
    expect(
      await page
        .locator("[id]")
        .evaluateAll(
          (elements, expected) =>
            elements.filter((element) => element.id === expected).length,
          id,
        ),
    ).toBe(1);
  }
  expect(backend).toEqual([]);
});
