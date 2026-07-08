import {
  test,
  expect,
  type Page,
} from "@playwright/test";

const consoleErrors: string[] = [];
const pageErrors: string[] = [];
const failedRequests: string[] = [];

function watchForProblems(
  page: Page
) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(
        message.text()
      );
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(
      error.message
    );
  });

  page.on(
    "requestfailed",
    (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} :: ${
          request.failure()?.errorText ??
          "unknown error"
        }`
      );
    }
  );
}

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  pageErrors.length = 0;
  failedRequests.length = 0;

  watchForProblems(page);
});

test.afterEach(async ({}, testInfo) => {
  if (
    consoleErrors.length > 0 ||
    pageErrors.length > 0 ||
    failedRequests.length > 0
  ) {
    await testInfo.attach(
      "runtime-problems",
      {
        body: JSON.stringify(
          {
            consoleErrors,
            pageErrors,
            failedRequests,
          },
          null,
          2
        ),

        contentType:
          "application/json",
      }
    );
  }
});

test(
  "app boots without blank screen",
  async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator("body")
    ).toBeVisible();

    const bodyText =
      await page
        .locator("body")
        .innerText();

    expect(
      bodyText.trim().length
    ).toBeGreaterThan(0);

    expect(
      pageErrors,
      `Page crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);
test(
  "join page has usable UI",
  async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState(
      "networkidle"
    );

    const bodyText =
      await page
        .locator("body")
        .innerText();

    console.log(
      "\nJOIN PAGE TEXT:\n",
      bodyText
    );

    expect(
      bodyText.trim().length
    ).toBeGreaterThan(0);

    const controls =
      page.locator(
        [
          "input",
          "button",
          "a",
          "[role='button']",
          "select",
          "textarea",
        ].join(",")
      );

    const controlCount =
      await controls.count();

    console.log(
      "JOIN CONTROL COUNT:",
      controlCount
    );

    expect(
      controlCount,
      `Join page has no usable controls.\n\nVisible text:\n${bodyText}`
    ).toBeGreaterThan(0);
  }
);

test(
  "game route does not crash",
  async ({ page }) => {
    await page.goto("/game");

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Game route crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "admin route does not crash",
  async ({ page }) => {
    await page.goto("/admin");

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Admin route crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "leaderboard route does not crash",
  async ({ page }) => {
    await page.goto(
      "/leaderboard"
    );

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Leaderboard crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "vote route does not crash",
  async ({ page }) => {
    await page.goto("/vote");

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Vote route crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "vote results route does not crash",
  async ({ page }) => {
    await page.goto(
      "/vote-results"
    );

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Vote results crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "slideshow route does not crash",
  async ({ page }) => {
    await page.goto(
      "/slideshow?host=true"
    );

    await page.waitForTimeout(1500);

    await expect(
      page.locator("body")
    ).toBeVisible();

    expect(
      pageErrors,
      `Slideshow crashed:\n${pageErrors.join(
        "\n"
      )}`
    ).toEqual([]);
  }
);

test(
  "join alias does not become blank screen",
  async ({ page }) => {
    await page.goto("/join");

    await page.waitForTimeout(500);

    const bodyText =
      await page
        .locator("body")
        .innerText();

    expect(
      bodyText.trim().length,
      "/join rendered a blank page"
    ).toBeGreaterThan(0);
  }
);