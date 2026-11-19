import { expect, test } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});
const baseGame = {
  host_id: "00000000-0000-4000-8000-000000000001",
  start_time: "18:00",
  end_time: "22:00",
  player_count: 12,
  venue_name: "The Test Venue",
  plan_data: {},
};
const games = [
  {
    ...baseGame,
    id: "future-plan",
    name: "Future plan",
    event_date: "2030-01-01",
    status: "planned",
  },
  {
    ...baseGame,
    id: "draft-plan",
    name: "Draft plan",
    event_date: null,
    status: "draft",
  },
  {
    ...baseGame,
    id: "past-plan",
    name: "Past plan",
    event_date: "2020-01-01",
    status: "completed",
  },
];
test("host hub separates upcoming and past plans without duplicated cards", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = games;
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("#/host");
  const upcoming = page
    .getByRole("heading", { name: "Upcoming games", exact: true })
    .locator("xpath=ancestor::section[1]");
  const past = page
    .getByRole("heading", { name: "Past games", exact: true })
    .locator("xpath=ancestor::section[1]");
  await expect(
    upcoming.getByRole("heading", { name: "Future plan", exact: true }),
  ).toHaveCount(1);
  await expect(
    upcoming.getByRole("heading", { name: "Draft plan", exact: true }),
  ).toHaveCount(1);
  await expect(
    past.getByRole("heading", { name: "Past plan", exact: true }),
  ).toHaveCount(1);
  await expect(
    upcoming.getByRole("heading", { name: "Past plan", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: /Your games/ }).click();
  await expect(page).toHaveURL(/#\/host\/games$/);
  const allPlans = page
    .getByRole("heading", { name: "All plans", exact: true })
    .locator("xpath=ancestor::section[1]");
  await expect(
    allPlans.getByRole("heading", { name: "Future plan", exact: true }),
  ).toHaveCount(1);
  await expect(
    allPlans.getByRole("heading", { name: "Draft plan", exact: true }),
  ).toHaveCount(1);
  await expect(
    allPlans.getByRole("heading", { name: "Past plan", exact: true }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
  backend.verify();
});
test("platform host preview keeps cards read-only and returns to the host hub", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.responses.cc_is_platform_admin = true;
  backend.responses.cc_super_admin_list_hosts = [
    {
      host_id: "preview-host",
      display_name: "Preview Host",
      email: "preview@example.test",
      created_at: "2020-01-01",
      game_count: 3,
    },
  ];
  backend.responses.cc_super_admin_host_hub = {
    host: {
      id: "preview-host",
      display_name: "Preview Host",
      email: "preview@example.test",
    },
    games,
  };
  await page.goto("#/host");
  await page
    .getByRole("button", { name: "View Host Hub", exact: true })
    .click();
  await expect(page).toHaveURL(/viewAs=preview-host/);
  await expect(
    page.getByText("Viewing as Preview Host", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit plan", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Play game", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Create new game", exact: true }),
  ).toHaveCount(0);
  expect(
    backend.requests.some(
      (request) => request.name === "cc_host_create_game_session",
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Return to your Host Hub", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/host$/);
  backend.verify();
});
test("host hub reports a failed launch and keeps the plan available", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [games[0]];
  backend.failures.add("cc_host_create_game_session");
  await page.goto("#/host/games");
  await page.getByRole("button", { name: "Play game", exact: true }).click();
  await expect(
    page.getByText("Fixture connection failed", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play game", exact: true }),
  ).toBeEnabled();
  await expect(page).toHaveURL(/#\/host\/games$/);
  backend.verify();
});

test("host preview refuses non-administrators before querying another host", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  await page.goto("#/host?viewAs=private-host");
  await expect(
    page.getByText(
      "Only a platform administrator can view another host's Host Hub.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    backend.requests.some(
      (request) => request.name === "cc_super_admin_host_hub",
    ),
  ).toBe(false);
  await expect(
    page.getByRole("button", { name: "Create new game", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});
test("host hub query failure keeps navigation and create actions available", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.failures.add("host_games");
  await page.goto("#/host");
  await expect(
    page.getByText(
      "Couldn't load your plans. Make sure the host planning database migration has been run.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create new game", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Loading your games…", { exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("local workspace panels advance by keyboard without backend access", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panels = page
    .getByRole("heading", { name: "Shared workspace panels", exact: true })
    .locator("xpath=ancestor::article[1]");
  const action = panels.getByRole("button", {
    name: "Advance demo setup",
    exact: true,
  });
  await action.focus();
  await page.keyboard.press("Space");
  await expect(panels.getByRole("status")).toHaveText(
    "2 setup items complete.",
  );
  await page.keyboard.press("Enter");
  await expect(panels.getByRole("status")).toHaveText(
    "3 setup items complete.",
  );
  await expect(page.getByRole("main")).toHaveCount(1);
  expect(backend.requests).toEqual([]);
  backend.verify();
});
