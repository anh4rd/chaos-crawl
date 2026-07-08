import {
  test,
  expect,
  type Page,
} from "@playwright/test";

async function openAdmin(
  page: Page
) {
  await page.goto("/#/admin");

  await expect(
    page.getByText(
      "Host Control"
    )
  ).toBeVisible();

  await expect(
    page.getByRole(
      "button",
      {
        name: /live/i,
      }
    ).first()
  ).toBeVisible();
}

test.describe(
  "admin journey",
  () => {
    test(
      "admin loads without runtime or network errors",
      async ({ page }) => {
        const pageErrors: string[] =
          [];

        const failedResponses: string[] =
          [];

        page.on(
          "pageerror",
          (error) => {
            pageErrors.push(
              error.message
            );
          }
        );

        page.on(
          "response",
          (response) => {
            if (
              response.status() >= 400
            ) {
              failedResponses.push(
                `${response.status()} ${response.url()}`
              );
            }
          }
        );

        await openAdmin(page);

        await page.waitForTimeout(
          1000
        );

        expect(
          pageErrors,
          `Runtime errors:\n${pageErrors.join(
            "\n"
          )}`
        ).toEqual([]);

        expect(
          failedResponses,
          `Failed responses:\n${failedResponses.join(
            "\n"
          )}`
        ).toEqual([]);
      }
    );

    test(
      "all admin tabs open",
      async ({ page }) => {
        await openAdmin(page);

        const tabs = [
          /🔴 Live/i,
          /🎯 Challenges/i,
          /✅ Review/i,
          /📺 Screens/i,
          /🗳️ Voting/i,
          /👥 Players/i,
          /🏁 Teams/i,
        ];

        for (
          const tabName of tabs
        ) {
          const tab =
            page.getByRole(
              "button",
              {
                name: tabName,
              }
            );

          await expect(
            tab
          ).toBeVisible();

          await tab.click();

          await expect(
            tab
          ).toBeVisible();
        }
      }
    );

    test(
      "live tab shows round controls",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /🔴 Live/i,
            }
          )
          .click();

        await expect(
          page.getByText(
            "Round Challenges"
          )
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /move to next pub/i,
            }
          )
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name: /go live/i,
            }
          )
        ).toBeVisible();
      }
    );

    test(
      "challenges tab opens",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name:
                /🎯 Challenges/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );

        await expect(
          page.locator("body")
        ).toContainText(
          /challenge/i
        );
      }
    );

    test(
      "review tab opens",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /✅ Review/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );
      }
    );

    test(
      "screens tab exposes host screen controls",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /📺 Screens/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );

        const bodyText =
          await page
            .locator("body")
            .innerText();

        expect(
          bodyText
        ).toMatch(
          /slideshow|screen|leaderboard/i
        );
      }
    );

    test(
      "voting tab opens",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /🗳️ Voting/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );

        await expect(
          page.locator("body")
        ).toContainText(
          /vot/i
        );
      }
    );

    test(
      "players tab opens",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /👥 Players/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );
      }
    );

    test(
      "teams tab opens",
      async ({ page }) => {
        await openAdmin(page);

        await page
          .getByRole(
            "button",
            {
              name: /🏁 Teams/i,
            }
          )
          .click();

        await expect(
          page.locator("body")
        ).not.toContainText(
          "Loading chaos..."
        );

        await expect(
          page.locator("body")
        ).toContainText(
          /team/i
        );
      }
    );

    test(
      "switching every admin tab causes no React crash",
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

        await openAdmin(page);

        const tabs = [
          /🔴 Live/i,
          /🎯 Challenges/i,
          /✅ Review/i,
          /📺 Screens/i,
          /🗳️ Voting/i,
          /👥 Players/i,
          /🏁 Teams/i,
        ];

        for (
          const tabName of tabs
        ) {
          await page
            .getByRole(
              "button",
              {
                name: tabName,
              }
            )
            .click();

          await page.waitForTimeout(
            200
          );
        }

        expect(
          errors,
          `React errors while switching tabs:\n${errors.join(
            "\n"
          )}`
        ).toEqual([]);
      }
    );
  }
);