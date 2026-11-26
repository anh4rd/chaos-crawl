import { tabTo, activateByKeyboard } from "./support/keyboard";
import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { installSessionBackend } from "./support/sessionBackend";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});
async function section(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Game setup steps" })
    .getByRole("button")
    .filter({ has: page.getByText(name, { exact: true }) })
    .click();
}
async function start(page: Page, name = "Planning regression") {
  await page.goto("#/host/games/new");
  await page.getByLabel("Game name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
}
test("planning adds and removes scheduled challenges before saving the complete plan", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await start(page);
  await section(page, "Schedule");
  await page
    .getByRole("combobox", { name: "Add a challenge", exact: true })
    .selectOption("pineapple");
  await page
    .getByRole("combobox", { name: "Add a challenge", exact: true })
    .selectOption("best-noise");
  await page
    .getByRole("button", { name: "Delete Conceal a pineapple", exact: true })
    .click();
  await section(page, "Review & Launch");
  await page
    .getByRole("button", { name: "Save game plan", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/host\?created=1$/);
  expect(
    backend.requests.find((r) => r.name === "host_games" && r.method === "POST")
      ?.body,
  ).toMatchObject({
    name: "Planning regression",
    status: "planned",
    plan_data: {
      version: 3,
      selectedMain: ["best-noise"],
      selectedTaskIds: ["best-noise", "team-handshake", "team-laugh"],
      locationMode: "single-venue",
      noVenueChanges: true,
      schedule: expect.arrayContaining([
        expect.objectContaining({ taskId: "best-noise", duration: 5 }),
      ]),
    },
  });
  backend.verify();
});
test("planning uploads a challenge icon to Supabase and saves its public URL", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await start(page);
  await section(page, "Schedule");
  await page
    .getByRole("combobox", { name: "Add a challenge", exact: true })
    .selectOption("pineapple");
  await page
    .getByLabel("Upload custom art for Conceal a pineapple")
    .setInputFiles({
      name: "pineapple.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4"/></svg>',
      ),
    });
  await expect(
    page.getByText("Challenge icon uploaded.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".schedule-item__artwork > img")).toBeVisible();
  await section(page, "Review & Launch");
  await page
    .getByRole("button", { name: "Save game plan", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/host\?created=1$/);
  expect(
    backend.requests.find(
      (request) => request.name === "storage:challenge-icons",
    )?.body,
  ).toMatchObject({
    path: expect.stringContaining("/challenge-icons/pineapple/"),
  });
  expect(
    backend.requests.find(
      (request) => request.name === "host_games" && request.method === "POST",
    )?.body,
  ).toMatchObject({
    plan_data: {
      challengeArtUrls: {
        pineapple: expect.stringContaining(
          "/storage/v1/object/public/challenge-icons/",
        ),
      },
    },
  });
  backend.verify();
});
test("planning selects and saves an OpenMoji override for a challenge", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await start(page);
  await section(page, "Schedule");
  await page
    .getByRole("combobox", { name: "Add a challenge", exact: true })
    .selectOption("pineapple");
  const pickerSummary = page.locator(".schedule-item__emoji-picker summary");
  await pickerSummary.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("searchbox", {
      name: "Search OpenMoji for Conceal a pineapple",
    })
    .fill("camera");
  const cameraEmoji = page.getByRole("button", {
    name: "Select camera emoji",
  });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(cameraEmoji).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".schedule-item__artwork > img")).toHaveAttribute(
    "src",
    /1F4F7\.svg/,
  );
  await expect
    .poll(() =>
      page
        .locator(".schedule-item__artwork > img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await section(page, "Review & Launch");
  await page
    .getByRole("button", { name: "Save game plan", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/host\?created=1$/);
  expect(
    backend.requests.find(
      (request) => request.name === "host_games" && request.method === "POST",
    )?.body,
  ).toMatchObject({
    plan_data: {
      challengeArtUrls: { pineapple: "openmoji:1F4F7" },
    },
  });
  backend.verify();
});
test("editing a phased challenge retains selection until its final phase is deleted", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [
    {
      id: "test-plan",
      name: "Phased plan",
      event_date: "2030-01-01",
      start_time: "18:00",
      end_time: "22:00",
      player_count: 12,
      venue_name: "Venue",
      status: "draft",
      plan_data: {
        selectedMain: ["pineapple"],
        schedule: [
          {
            id: "prep",
            type: "challenge",
            title: "Pineapple prep",
            duration: 7,
            taskId: "pineapple",
            phase: "prep",
          },
          {
            id: "performance",
            type: "challenge",
            title: "Pineapple performance",
            duration: 11,
            taskId: "pineapple",
            phase: "performance",
          },
        ],
      },
    },
  ];
  await page.goto("#/host/games/test-plan/edit");
  await section(page, "Schedule");
  await page
    .getByRole("button", { name: "Delete Pineapple prep", exact: true })
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved.", { exact: true })).toBeVisible();
  const writes = () =>
    backend.requests.filter(
      (r) => r.name === "host_games" && r.method === "PATCH",
    );
  expect(writes()[0]?.body).toMatchObject({
    plan_data: {
      selectedMain: ["pineapple"],
      schedule: [expect.objectContaining({ id: "performance", duration: 11 })],
    },
  });
  await page
    .getByRole("button", { name: "Delete Pineapple performance", exact: true })
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect.poll(() => writes().length).toBe(2);
  expect(writes()[1]?.body).toMatchObject({
    plan_data: { selectedMain: [], schedule: [] },
  });
  backend.verify();
});
test("Explore imports preserve side challenge identity and payload", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  const idea = {
    id: "imported",
    title: "Imported challenge",
    description: "Use the imported idea",
    points: 17,
    minutes: 8,
    tags: ["creative"],
    setup: "none",
  };
  await page.goto(
    `#/host/games/new?challengeKind=side&exploreTask=${encodeURIComponent(JSON.stringify(idea))}`,
  );
  await expect(
    page.getByText(/Added “Imported challenge” as a side challenge/),
  ).toBeVisible();
  await page.getByLabel("Game name", { exact: true }).fill("Imported plan");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/test-plan\/edit$/);
  expect(
    backend.requests.find((r) => r.name === "host_games" && r.method === "POST")
      ?.body,
  ).toMatchObject({
    status: "draft",
    plan_data: {
      sideChallenges: true,
      selectedSide: ["team-handshake", "team-laugh", "explore-imported"],
      customTasks: [
        expect.objectContaining({
          id: "explore-imported",
          kind: "side",
          title: idea.title,
          points: 17,
          minutes: 8,
          evidenceRequired: true,
        }),
      ],
    },
  });
  backend.verify();
});
test("saved secret missions can be selected and remain in a saved plan", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_favourites = [
    {
      id: "saved-secret",
      host_id: "00000000-0000-4000-8000-000000000001",
      item_type: "task",
      item_id: "community-sneaky",
      item_data: {
        id: "community-sneaky",
        title: "Hidden high five",
        description: "Get a high five unnoticed",
        kind: "secret",
        minutes: 8,
        points: 15,
        tags: ["sneaky"],
        setup: "none",
      },
    },
    {
      id: "saved-side",
      host_id: "00000000-0000-4000-8000-000000000001",
      item_type: "task",
      item_id: "other-side",
      item_data: {
        id: "other-side",
        title: "Side only",
        description: "Side challenge",
        kind: "side",
      },
    },
  ];
  await start(page, "Saved secret plan");
  await section(page, "Secret missions");
  const card = page
    .locator(".challenge-tile")
    .filter({ hasText: "Hidden high five" });
  await expect(card).toBeVisible();
  await expect(page.getByText("Side only")).toHaveCount(0);
  await activateByKeyboard(
    page,
    card.getByRole("button", { name: "Add", exact: true }),
  );
  await expect(
    page.locator(".selected-challenge").filter({ hasText: "Hidden high five" }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    card.getByRole("button", { name: "Favourite Hidden high five" }),
  );
  await expect(
    card.getByRole("button", { name: "Favourite Hidden high five" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/test-plan\/edit$/);
  expect(
    backend.requests.find((r) => r.name === "host_games" && r.method === "POST")
      ?.body,
  ).toMatchObject({
    plan_data: {
      secretMissions: true,
      selectedSecret: ["community-sneaky"],
      customTasks: [
        expect.objectContaining({
          id: "community-sneaky",
          title: "Hidden high five",
          kind: "secret",
        }),
      ],
      schedule: expect.arrayContaining([
        expect.objectContaining({ type: "secret-reveal" }),
      ]),
    },
  });
  backend.verify();
});
test("invalid Explore JSON keeps a usable planning form", async ({ page }) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host/games/new?exploreTask=%7B");
  await expect(page.getByRole("alert")).toHaveText(
    "Couldn't add that Explore challenge. Return to Explore and try again.",
  );
  await page.getByLabel("Game name", { exact: true }).fill("Recoverable plan");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("community timing phases remain distinct when added to the schedule", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.cc_catalog_submissions = [
    {
      id: "timed",
      title: "Two phase challenge",
      description: "Prepare then perform",
      payload: {
        minutes: 10,
        prepMinutes: 3,
        performanceMinutes: 7,
        points: 24,
        tags: ["creative"],
        setup: "basic",
      },
      status: "approved",
    },
  ];
  await page.goto("#/host/games/new?communityTask=timed&challengeKind=main");
  await expect(
    page.getByText(/Added “Two phase challenge” as a main challenge/),
  ).toBeVisible();
  await page.getByLabel("Game name", { exact: true }).fill("Community plan");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await section(page, "Schedule");
  await page
    .getByRole("combobox", { name: "Add a challenge", exact: true })
    .selectOption("community-timed");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/test-plan\/edit$/);
  expect(
    backend.requests.find((r) => r.name === "host_games" && r.method === "POST")
      ?.body,
  ).toMatchObject({
    plan_data: {
      selectedMain: ["community-timed"],
      customTasks: [
        expect.objectContaining({
          id: "community-timed",
          kind: "main",
          prepMinutes: 3,
          performanceMinutes: 7,
        }),
      ],
      schedule: expect.arrayContaining([
        expect.objectContaining({
          taskId: "community-timed",
          phase: "prep",
          duration: 3,
        }),
        expect.objectContaining({
          taskId: "community-timed",
          phase: "performance",
          duration: 7,
        }),
      ]),
    },
  });
  backend.verify();
});
test("planning cover upload and favourite toggling retain their storage and data paths", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host/games/new");
  await page.locator('input[type="file"]').setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT1kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByText("Game photo uploaded.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByAltText("Game cover")).toHaveAttribute(
    "src",
    /\/storage\/v1\/object\/public\/game-assets\/.*cover\.png$/,
  );
  await page.getByLabel("Game name", { exact: true }).fill("Photo plan");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await section(page, "Main Challenges");
  const card = page
    .getByText("Conceal a pineapple", { exact: true })
    .locator("xpath=ancestor::article[1]");
  await card
    .getByRole("button", { name: "Favourite", exact: true })
    .last()
    .click();
  await expect(
    card.getByRole("button", { name: "Favourited", exact: true }),
  ).toBeVisible();
  await card.getByRole("button", { name: "Favourited", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "Favourite", exact: true }).last(),
  ).toBeVisible();
  expect(
    backend.requests.find(
      (r) => r.name === "host_favourites" && r.method === "POST",
    )?.body,
  ).toMatchObject({
    item_type: "task",
    item_id: "pineapple",
    item_data: expect.objectContaining({ id: "pineapple" }),
  });
  await expect
    .poll(() =>
      backend.requests.some(
        (r) => r.name === "host_favourites" && r.method === "DELETE",
      ),
    )
    .toBe(true);
  await expect(
    card.getByRole("button", { name: "Favourited", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("a new plan starts fresh after editing a saved plan", async ({ page }) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host/games/test-plan/edit");
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  await page.goto("#/host/games/new");
  await expect(page).toHaveURL(/#\/host\/games\/new$/);
  await expect(page.getByLabel("Game name", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Create a game", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("shared planning controls and navigation remain local in the styleguide", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const controls = page
    .getByRole("heading", {
      name: "Setup controls and image chooser",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  const filter = controls.getByRole("button", {
    name: "Toggle example filter",
    exact: true,
  });
  await filter.focus();
  await page.keyboard.press("Space");
  await expect(filter).toHaveAttribute("aria-pressed", "true");
  await controls.locator('input[type="file"]').setInputFiles({
    name: "local.png",
    mimeType: "image/png",
    buffer: Buffer.from("local image"),
  });
  await expect(controls.getByRole("status")).toHaveText(
    "Selected local.png locally.",
  );
  const navigation = page
    .getByRole("heading", { name: "PlanNavigation", exact: true })
    .locator("xpath=ancestor::article[1]");
  await navigation
    .getByRole("button", { name: "Save draft", exact: true })
    .click();
  await expect(navigation.getByRole("status")).toHaveText(
    "Draft action selected locally.",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("planning reorders side, secret and timeline items from the keyboard and saves their order", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [
    {
      id: "test-plan",
      name: "Keyboard plan",
      event_date: "2030-01-01",
      start_time: "18:00",
      end_time: "22:00",
      player_count: 12,
      status: "draft",
      plan_data: {
        selectedMain: ["pineapple", "best-noise"],
        selectedSide: ["team-handshake", "team-laugh"],
        selectedSecret: ["secret-word", "secret-toast"],
        secretMissions: true,
        schedule: [
          { id: "welcome", type: "welcome", title: "Welcome", duration: 5 },
          {
            id: "pineapple",
            type: "challenge",
            title: "Conceal a pineapple",
            duration: 10,
            taskId: "pineapple",
            phase: "prep",
          },
          { id: "break", type: "break", title: "Break", duration: 5 },
          {
            id: "noise",
            type: "challenge",
            title: "Make the best noise",
            duration: 5,
            taskId: "best-noise",
          },
        ],
      },
    },
  ];
  await page.goto("#/host/games/test-plan/edit");
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  const steps = page.getByRole("navigation", { name: "Game setup steps" });
  await activateByKeyboard(
    page,
    steps
      .getByRole("button")
      .filter({ has: page.getByText("Side challenges", { exact: true }) }),
  );
  const sideRows = page.locator(".selected-challenge strong");
  await expect(sideRows).toHaveText([
    "Invent a secret handshake",
    "Make your team laugh",
  ]);
  const moveSide = page.getByRole("button", {
    name: "Move Make your team laugh up",
    exact: true,
  });
  await tabTo(page, moveSide);
  await expect(moveSide).toHaveCSS("outline-style", /solid|auto/);
  await page.keyboard.press("Enter");
  await expect(sideRows).toHaveText([
    "Make your team laugh",
    "Invent a secret handshake",
  ]);
  await expect(moveSide).toBeDisabled();
  await tabTo(
    page,
    page.getByRole("textbox", { name: "Search challenges", exact: true }),
  );
  await page.keyboard.type("laugh");
  await expect(page.locator(".challenge-tile")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  const favourites = page.getByRole("button", {
    name: "Favourites",
    exact: true,
  });
  await activateByKeyboard(page, favourites);
  await expect(favourites).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(favourites).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("combobox", { name: "Filter challenges by vibe" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Filter challenges by accessibility" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Custom challenge name" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Custom challenge description" }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    steps
      .getByRole("button")
      .filter({ has: page.getByText("Secret missions", { exact: true }) }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Move The suspicious toast up",
      exact: true,
    }),
  );
  await expect(sideRows).toHaveText([
    "The suspicious toast",
    "Sneak in the word",
  ]);
  await activateByKeyboard(
    page,
    steps
      .getByRole("button")
      .filter({ has: page.getByText("Schedule", { exact: true }) }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Move Make the best noise up",
      exact: true,
    }),
  );
  const timelineTitles = page.locator(
    ".schedule-item__detail > strong, .schedule-item__title",
  );
  await expect(timelineTitles).toHaveCount(4);
  await expect(
    page
      .locator(".schedule-item")
      .nth(2)
      .getByRole("textbox", { name: "Edit Make the best noise" }),
  ).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "Duration for Make the best noise" }),
  ).toHaveValue("5");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save draft", exact: true }),
  );
  await expect(page.getByText("Draft saved.", { exact: true })).toBeVisible();
  expect(
    backend.requests.find(
      (request) => request.name === "host_games" && request.method === "PATCH",
    )?.body,
  ).toMatchObject({
    plan_data: {
      selectedMain: ["pineapple", "best-noise"],
      selectedSide: ["team-laugh", "team-handshake"],
      selectedSecret: ["secret-toast", "secret-word"],
      schedule: [
        expect.objectContaining({ id: "welcome" }),
        expect.objectContaining({ id: "pineapple", phase: "prep" }),
        expect.objectContaining({ id: "noise" }),
        expect.objectContaining({ id: "break" }),
      ],
    },
  });
  backend.verify();
});
test("a cleared start time stays usable through schedule navigation and recovers when restored", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host/games/new");
  await page.getByLabel("Game name", { exact: true }).fill("Time recovery");
  await page.getByLabel("Start time", { exact: true }).fill("");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await section(page, "Schedule");
  await expect(
    page.getByText("Time TBC", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("NaN:NaN", { exact: true })).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Game setup steps" })
    .getByRole("button")
    .filter({ has: page.getByText("Game basics", { exact: true }) })
    .click();
  await page.getByLabel("Start time", { exact: true }).fill("18:00");
  await page
    .getByRole("button", { name: /Next: Players/i })
    .first()
    .click();
  await section(page, "Schedule");
  await expect(page.getByText("Time TBC", { exact: true })).toHaveCount(0);
  await expect(page.getByText("18:00", { exact: true }).first()).toBeVisible();
  backend.verify();
});
