import { test, expect } from "../support/liveFixture";
import { uniqueName } from "../support/livePlayers";

test.describe("player journey", () => {
  test("player can join and reach the game", async ({ page }) => {
    const playerName = uniqueName("Player");

    await page.goto("./#/legacy/join");

    const nameInput = page.locator("input").first();

    await expect(nameInput).toBeVisible();

    await nameInput.fill(playerName);

    await page
      .getByRole("button", {
        name: /join game/i,
      })
      .click();

    await expect(page).toHaveURL(/\/game/);

    await expect(page.locator("body")).not.toContainText("Loading chaos...");
  });

  test("joined player survives refresh", async ({ page }) => {
    const playerName = uniqueName("Refresh");

    await page.goto("./#/legacy/join");

    await page.locator("input").first().fill(playerName);

    await page
      .getByRole("button", {
        name: /join game/i,
      })
      .click();

    await expect(page).toHaveURL(/\/game/);

    await page.reload();

    await expect(page).toHaveURL(/\/game/);

    await expect(page.locator("body")).not.toContainText("Loading chaos...");
  });

  test("leaderboard button opens leaderboard", async ({ page }) => {
    const playerName = uniqueName("Leaderboard");

    await page.goto("./#/legacy/join");

    await page.locator("input").first().fill(playerName);

    await page
      .getByRole("button", {
        name: /join game/i,
      })
      .click();

    await expect(page).toHaveURL(/\/game/);

    const leaderboardControl = page.getByRole("button", {
      name: /leaderboard/i,
    });

    await expect(leaderboardControl).toBeVisible();

    await leaderboardControl.click();

    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test("game has no uncaught runtime errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    const playerName = uniqueName("Errors");

    await page.goto("./#/legacy/join");

    await page.locator("input").first().fill(playerName);

    await page
      .getByRole("button", {
        name: /join game/i,
      })
      .click();

    await expect(page).toHaveURL(/\/game/);

    await page.waitForTimeout(2000);

    expect(errors, `Runtime errors:\n${errors.join("\n")}`).toEqual([]);
  });
});
