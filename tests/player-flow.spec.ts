import {
  test,
  expect,
} from "@playwright/test";

test.describe(
  "player journey",
  () => {
    test(
      "player can join and reach the game",
      async ({ page }) => {
        const playerName =
          `PW-${Date.now()}`;

        await page.goto("/");

        const nameInput =
          page.locator("input").first();

        await expect(
          nameInput
        ).toBeVisible();

        await nameInput.fill(
          playerName
        );

        await page
          .getByRole("button", {
            name: /join game/i,
          })
          .click();

        await expect(
          page
        ).toHaveURL(/\/game/);

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );
      }
    );

    test(
      "joined player survives refresh",
      async ({ page }) => {
        const playerName =
          `PW-Refresh-${Date.now()}`;

        await page.goto("/");

        await page
          .locator("input")
          .first()
          .fill(playerName);

        await page
          .getByRole("button", {
            name: /join game/i,
          })
          .click();

        await expect(
          page
        ).toHaveURL(/\/game/);

        await page.reload();

        await expect(
          page
        ).toHaveURL(/\/game/);

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );
      }
    );

    test(
      "leaderboard button opens leaderboard",
      async ({ page }) => {
        const playerName =
          `PW-Leaderboard-${Date.now()}`;

        await page.goto("/");

        await page
          .locator("input")
          .first()
          .fill(playerName);

        await page
          .getByRole("button", {
            name: /join game/i,
          })
          .click();

        await expect(
          page
        ).toHaveURL(/\/game/);

        const leaderboardControl =
          page.getByRole(
            "button",
            {
              name: /leaderboard/i,
            }
          );

        await expect(
          leaderboardControl
        ).toBeVisible();

        await leaderboardControl.click();

        await expect(
          page
        ).toHaveURL(
          /\/leaderboard/
        );
      }
    );

    test(
      "game has no uncaught runtime errors",
      async ({ page }) => {
        const errors: string[] =
          [];

        page.on(
          "pageerror",
          (error) => {
            errors.push(
              error.message
            );
          }
        );

        const playerName =
          `PW-Errors-${Date.now()}`;

        await page.goto("/");

        await page
          .locator("input")
          .first()
          .fill(playerName);

        await page
          .getByRole("button", {
            name: /join game/i,
          })
          .click();

        await expect(
          page
        ).toHaveURL(/\/game/);

        await page.waitForTimeout(
          2000
        );

        expect(
          errors,
          `Runtime errors:\n${errors.join(
            "\n"
          )}`
        ).toEqual([]);
      }
    );
  }
);