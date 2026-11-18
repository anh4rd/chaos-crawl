import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";

test("local host score groups expose their selected choices during keyboard operation", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("https://chaos-crawl-test.supabase.co/**", async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  await page.goto("#/styleguide");
  const preview = page.locator("#legacy-host");
  await activateByKeyboard(
    page,
    preview
      .getByRole("navigation", { name: "Host navigation" })
      .getByRole("button", { name: "Scores", exact: true }),
  );
  const leaderboard = preview.getByRole("group", {
    name: "Leaderboard view",
    exact: true,
  });
  const target = preview.getByRole("group", {
    name: "Score target",
    exact: true,
  });
  const action = preview.getByRole("group", {
    name: "Award or dock points",
    exact: true,
  });
  await expect(
    leaderboard.getByRole("button", { name: "Player scores", pressed: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    leaderboard.getByRole("button", { name: "Team scores", pressed: false }),
  );
  await expect(
    leaderboard.getByRole("button", { name: "Team scores", pressed: true }),
  ).toBeFocused();
  await expect(
    leaderboard.getByRole("button", { name: "Player scores", pressed: false }),
  ).toBeVisible();
  await expect(
    target.getByRole("button", { name: "Player", exact: true, pressed: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    target.getByRole("button", { name: "Team", exact: true, pressed: false }),
    "backward",
  );
  await expect(
    target.getByRole("button", { name: "Team", exact: true, pressed: true }),
  ).toBeFocused();
  await expect(
    preview.getByRole("combobox", { name: "Team", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    action.getByRole("button", { name: "Dock", exact: true, pressed: false }),
  );
  await expect(
    action.getByRole("button", { name: "Dock", exact: true, pressed: true }),
  ).toBeFocused();
  await expect(
    action.getByRole("button", { name: "Award", exact: true, pressed: false }),
  ).toBeVisible();
  await expect(
    leaderboard.getByRole("button", { name: "Team scores", pressed: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/styleguide$/);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
