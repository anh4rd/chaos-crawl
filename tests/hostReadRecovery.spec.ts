import { expect, test } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});
test("failed host sign-out stays in the workspace and retries through the same native control", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  let attempts = 0;
  await page.route("**/auth/v1/logout**", async (route) => {
    attempts += 1;
    await route.fulfill({
      status: attempts === 1 ? 400 : 204,
      contentType: "application/json",
      body:
        attempts === 1
          ? JSON.stringify({ message: "Sign-out unavailable" })
          : "",
    });
  });
  await page.goto("#/host");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Couldn't sign out");
  await expect(page).toHaveURL(/#\/host$/);
  await page.getByRole("button", { name: "Sign out", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/host\/login$/);
  expect(attempts).toBe(2);
  backend.verify();
});
test("failed favourite hydration preserves the loaded plan and blocks writes until collection retry", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
  });
  backend.rows.host_games = [
    {
      id: "recovery-plan",
      name: "Retained plan",
      event_date: "2030-01-01",
      start_time: "18:00",
      end_time: "22:00",
      player_count: 12,
      venue_name: "Venue",
      status: "draft",
      plan_data: {
        selectedMain: [],
        selectedSide: [],
        selectedSecret: [],
        schedule: [],
      },
    },
  ];
  backend.rows.host_favourites = [
    {
      id: "already-saved",
      host_id: "00000000-0000-4000-8000-000000000001",
      item_type: "task",
      item_id: "pineapple",
    },
  ];
  backend.failures.add("host_favourites");
  await page.goto("#/host/games/recovery-plan/edit");
  await expect(page.getByRole("alert")).toContainText(
    "Couldn't load your favourites",
  );
  await page
    .getByRole("navigation", { name: "Game setup steps" })
    .getByRole("button")
    .filter({ has: page.getByText("Main Challenges", { exact: true }) })
    .click();
  await page
    .getByRole("button", { name: "Favourite Conceal a pineapple", exact: true })
    .click();
  expect(
    backend.requests.filter(
      (r) => r.name === "host_favourites" && r.method !== "GET",
    ),
  ).toHaveLength(0);
  backend.failures.delete("host_favourites");
  await page
    .getByRole("button", { name: "Retry favourites", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  const favourite = page.getByRole("button", {
    name: "Favourite Conceal a pineapple",
    exact: true,
  });
  await expect(favourite).toHaveAttribute("aria-pressed", "true");
  await favourite.click();
  await expect(favourite).toHaveAttribute("aria-pressed", "false");
  expect(
    backend.requests.filter(
      (r) => r.name === "host_favourites" && r.method === "POST",
    ),
  ).toHaveLength(0);
  expect(
    backend.requests.filter(
      (r) => r.name === "host_favourites" && r.method === "DELETE",
    ),
  ).toHaveLength(1);
  expect(
    backend.requests.filter(
      (r) => r.name === "host_games" && r.method === "GET",
    ),
  ).toHaveLength(1);
  backend.verify();
});
