import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
  type Response,
} from "@playwright/test";

const JOIN_URL = "/";
const ADMIN_URL = "/#/admin";

type TestPlayer = {
  id: string;
  name: string;
};

type PlayerWrite = {
  method: string;
  status: number;
  body: string;
  url: string;
};

type ErrorTracker = {
  pageErrors: string[];
  consoleErrors: string[];
  failedResponses: string[];
  stop: () => void;
};

function uniqueName(label: string) {
  return [
    "PW-TEST",
    label,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 7),
  ].join("-");
}

function isPlayersRequest(
  url: string
) {
  return url.includes(
    "/rest/v1/players"
  );
}

async function createCleanContext(
  browser: Browser
) {
  return browser.newContext();
}

async function safeCloseContext(
  context: BrowserContext
) {
  try {
    await context.close();
  } catch {
    // Context may already be closed
    // after a timeout or browser shutdown.
  }
}

async function getBodyText(
  page: Page
) {
  return page
    .locator("body")
    .innerText()
    .catch(() => "");
}

function attachErrorTracker(
  page: Page
): ErrorTracker {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  const onPageError = (
    error: Error
  ) => {
    pageErrors.push(
      error.message
    );
  };

  const onConsole = (
    message: ConsoleMessage
  ) => {
    if (
      message.type() !== "error"
    ) {
      return;
    }

    const text =
      message.text();

    if (
      text.includes("favicon")
    ) {
      return;
    }

    consoleErrors.push(text);
  };

  const onResponse = (
    response: Response
  ) => {
    if (
      response.status() < 400
    ) {
      return;
    }

    failedResponses.push(
      `${response.status()} ${response.url()}`
    );
  };

  page.on(
    "pageerror",
    onPageError
  );

  page.on(
    "console",
    onConsole
  );

  page.on(
    "response",
    onResponse
  );

  return {
    pageErrors,
    consoleErrors,
    failedResponses,

    stop: () => {
      page.off(
        "pageerror",
        onPageError
      );

      page.off(
        "console",
        onConsole
      );

      page.off(
        "response",
        onResponse
      );
    },
  };
}

async function openJoin(
  page: Page
) {
  await page.goto(
    JOIN_URL,
    {
      waitUntil:
        "domcontentloaded",
      timeout: 30_000,
    }
  );

  const joinButton =
    page.getByRole(
      "button",
      {
        name: /join game/i,
      }
    );

  await expect(
    joinButton
  ).toBeVisible({
    timeout: 15_000,
  });
}

async function findNameInput(
  page: Page
) {
  const byRole =
    page.getByRole(
      "textbox",
      {
        name: /name/i,
      }
    ).first();

  if (
    await byRole
      .isVisible()
      .catch(() => false)
  ) {
    return byRole;
  }

  const byPlaceholder =
    page.locator(
      [
        'input[placeholder*="name" i]',
        'input[name*="name" i]',
      ].join(", ")
    ).first();

  if (
    await byPlaceholder
      .isVisible()
      .catch(() => false)
  ) {
    return byPlaceholder;
  }

  return page
    .locator("input")
    .first();
}

async function joinPlayer(
  page: Page,
  name: string
): Promise<TestPlayer> {
  const writes:
    PlayerWrite[] = [];

  const onResponse = async (
    response: Response
  ) => {
    if (
      !isPlayersRequest(
        response.url()
      )
    ) {
      return;
    }

    const method =
      response
        .request()
        .method();

    if (
      ![
        "POST",
        "PUT",
        "PATCH",
      ].includes(method)
    ) {
      return;
    }

    let responseBody = "";

    try {
      responseBody =
        await response.text();
    } catch {
      responseBody = "";
    }

    writes.push({
      method,
      status:
        response.status(),
      body:
        responseBody,
      url:
        response.url(),
    });
  };

  page.on(
    "response",
    onResponse
  );

  try {
    await openJoin(page);

    const input =
      await findNameInput(
        page
      );

    await expect(
      input,
      "Could not find player name input"
    ).toBeVisible({
      timeout: 10_000,
    });

    await input.fill(name);

    await expect(
      input
    ).toHaveValue(name);

    const joinButton =
      page.getByRole(
        "button",
        {
          name: /join game/i,
        }
      );

    await joinButton.click();

    await expect
      .poll(
        () => writes.length,
        {
          timeout: 15_000,
          intervals: [
            100,
            250,
            500,
          ],
          message:
            "No player write request was observed",
        }
      )
      .toBeGreaterThan(0);

    const successfulWrite =
      writes.find(
        (write) =>
          write.status >= 200 &&
          write.status < 300
      );

    expect(
      successfulWrite,
      [
        `Player "${name}" was not persisted.`,
        "Observed writes:",
        JSON.stringify(
          writes,
          null,
          2
        ),
      ].join("\n")
    ).toBeTruthy();

    let parsed:
      unknown = null;

    try {
      parsed = JSON.parse(
        successfulWrite?.body ??
          ""
      );
    } catch {
      parsed = null;
    }

    const row =
      Array.isArray(parsed)
        ? parsed[0]
        : parsed;

    expect(
      row &&
        typeof row ===
          "object",
      [
        `Player "${name}" write succeeded`,
        "but response did not contain a player row.",
        successfulWrite?.body ??
          "",
      ].join("\n")
    ).toBeTruthy();

    const playerRow =
      row as {
        id?: string | number;
        name?: string;
      };

    expect(
      playerRow.id,
      [
        `Player "${name}" was created`,
        "but response had no id.",
        successfulWrite?.body ??
          "",
      ].join("\n")
    ).toBeTruthy();

    expect(
      playerRow.name
    ).toBe(name);

    await expect
      .poll(
        () => page.url(),
        {
          timeout: 15_000,
          intervals: [
            100,
            250,
            500,
          ],
        }
      )
      .toMatch(/game/i);

    return {
      id: String(
        playerRow.id
      ),
      name,
    };
  } finally {
    page.off(
      "response",
      onResponse
    );
  }
}

async function openAdmin(
  page: Page
) {
  await page.goto(
    ADMIN_URL,
    {
      waitUntil:
        "domcontentloaded",
      timeout: 30_000,
    }
  );

  await expect(
    page.getByText(
      "Host Control"
    )
  ).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page.getByRole(
      "button",
      {
        name: /live/i,
      }
    ).first()
  ).toBeVisible({
    timeout: 15_000,
  });
}

async function openPlayersTab(
  page: Page
) {
  const playersTab =
    page.getByRole(
      "button",
      {
        name: /👥 Players/i,
      }
    ).first();

  await expect(
    playersTab,
    "Could not find Players admin tab"
  ).toBeVisible({
    timeout: 15_000,
  });

  await playersTab.click();

  await expect(
    page.locator("body")
  ).not.toContainText(
    "Loading chaos...",
    {
      timeout: 15_000,
    }
  );
}

async function expectPlayerVisible(
  page: Page,
  playerName: string
) {
  const playerInput =
    page.locator("input").filter({
      has: page.locator(
        `xpath=self::*[@value=${JSON.stringify(
          playerName
        )}]`
      ),
    });

  const exactValueInput =
    page.locator(
      `input[value=${JSON.stringify(
        playerName
      )}]`
    );

  await expect(
    exactValueInput.first(),
    `Could not find player "${playerName}" in Admin player inputs`
  ).toBeVisible({
    timeout: 15_000,
  });
}

async function expectPlayerVisibleInAdmin(
  page: Page,
  playerName: string
) {
  await openAdmin(page);

  await openPlayersTab(page);

  await expectPlayerVisible(
    page,
    playerName
  );
}

async function verifyPlayerWithFreshAdmin(
  browser: Browser,
  playerName: string
) {
  const context =
    await createCleanContext(
      browser
    );

  const page =
    await context.newPage();

  try {
    await expectPlayerVisibleInAdmin(
      page,
      playerName
    );
  } finally {
    await safeCloseContext(
      context
    );
  }
}

async function clickLeaderboard(
  page: Page
) {
  const button =
    page.getByRole(
      "button",
      {
        name: /leaderboard/i,
      }
    ).first();

  await expect(
    button
  ).toBeVisible({
    timeout: 15_000,
  });

  await button.click();

  await expect
    .poll(
      () => page.url(),
      {
        timeout: 15_000,
        intervals: [
          100,
          250,
          500,
        ],
      }
    )
    .toMatch(
      /leaderboard/i
    );
}

test.describe(
  "multi-player event flow",
  () => {
    test.setTimeout(
      90_000
    );

    test(
      "three players join and appear in admin",
      async ({ browser }) => {
        const playerContexts:
          BrowserContext[] = [];

        const adminContext =
          await createCleanContext(
            browser
          );

        const adminPage =
          await adminContext.newPage();

        try {
          const players:
            TestPlayer[] = [];

          const names = [
            uniqueName("Anna"),
            uniqueName("Bob"),
            uniqueName("Charlie"),
          ];

          for (
            const name
            of names
          ) {
            const context =
              await createCleanContext(
                browser
              );

            playerContexts.push(
              context
            );

            const page =
              await context.newPage();

            const player =
              await joinPlayer(
                page,
                name
              );

            players.push(
              player
            );
          }

          await openAdmin(
            adminPage
          );

          await openPlayersTab(
            adminPage
          );

          for (
            const player
            of players
          ) {
            await expectPlayerVisible(
              adminPage,
              player.name
            );
          }
        } finally {
          for (
            const context
            of playerContexts
          ) {
            await safeCloseContext(
              context
            );
          }

          await safeCloseContext(
            adminContext
          );
        }
      }
    );

    test(
      "three player sessions survive refresh independently",
      async ({ browser }) => {
        const contexts:
          BrowserContext[] = [];

        try {
          const players:
            TestPlayer[] = [];

          const names = [
            uniqueName(
              "Refresh-A"
            ),
            uniqueName(
              "Refresh-B"
            ),
            uniqueName(
              "Refresh-C"
            ),
          ];

          for (
            const name
            of names
          ) {
            const context =
              await createCleanContext(
                browser
              );

            contexts.push(
              context
            );

            const page =
              await context.newPage();

            const player =
              await joinPlayer(
                page,
                name
              );

            players.push(
              player
            );

            await page.reload({
              waitUntil:
                "domcontentloaded",
              timeout: 30_000,
            });

            await expect
              .poll(
                () => page.url(),
                {
                  timeout: 15_000,
                }
              )
              .toMatch(/game/i);
          }

          expect(
            new Set(
              players.map(
                (player) =>
                  player.id
              )
            ).size
          ).toBe(3);
        } finally {
          for (
            const context
            of contexts
          ) {
            await safeCloseContext(
              context
            );
          }
        }
      }
    );

    test(
      "admin sees a newly joined player",
      async ({ browser }) => {
        const playerContext =
          await createCleanContext(
            browser
          );

        const adminContext =
          await createCleanContext(
            browser
          );

        const playerPage =
          await playerContext.newPage();

        const adminPage =
          await adminContext.newPage();

        try {
          await openAdmin(
            adminPage
          );

          await openPlayersTab(
            adminPage
          );

          const name =
            uniqueName(
              "Realtime"
            );

          await joinPlayer(
            playerPage,
            name
          );

          try {
            await expectPlayerVisible(
              adminPage,
              name
            );
          } catch {
            await adminPage.reload({
              waitUntil:
                "domcontentloaded",
              timeout: 30_000,
            });

            await expect(
              adminPage.getByText(
                "Host Control"
              )
            ).toBeVisible({
              timeout: 15_000,
            });

            await openPlayersTab(
              adminPage
            );

            await expectPlayerVisible(
              adminPage,
              name
            );
          }
        } finally {
          await safeCloseContext(
            playerContext
          );

          await safeCloseContext(
            adminContext
          );
        }
      }
    );

    test(
      "newly joined player is visible in a fresh admin session",
      async ({ browser }) => {
        const playerContext =
          await createCleanContext(
            browser
          );

        const playerPage =
          await playerContext.newPage();

        try {
          const name =
            uniqueName(
              "Fresh-Admin"
            );

          await joinPlayer(
            playerPage,
            name
          );

          await verifyPlayerWithFreshAdmin(
            browser,
            name
          );
        } finally {
          await safeCloseContext(
            playerContext
          );
        }
      }
    );

    test(
      "multiple players can open leaderboard independently",
      async ({ browser }) => {
        const contexts:
          BrowserContext[] = [];

        try {
          for (
            const label of [
              "LB-A",
              "LB-B",
              "LB-C",
            ]
          ) {
            const context =
              await createCleanContext(
                browser
              );

            contexts.push(
              context
            );

            const page =
              await context.newPage();

            await joinPlayer(
              page,
              uniqueName(label)
            );

            await clickLeaderboard(
              page
            );
          }
        } finally {
          for (
            const context
            of contexts
          ) {
            await safeCloseContext(
              context
            );
          }
        }
      }
    );

    test(
      "player and admin sessions run together without uncaught errors",
      async ({ browser }) => {
        const playerContext =
          await createCleanContext(
            browser
          );

        const adminContext =
          await createCleanContext(
            browser
          );

        const playerPage =
          await playerContext.newPage();

        const adminPage =
          await adminContext.newPage();

        const playerTracker =
          attachErrorTracker(
            playerPage
          );

        const adminTracker =
          attachErrorTracker(
            adminPage
          );

        try {
          const player =
            await joinPlayer(
              playerPage,
              uniqueName(
                "Concurrent"
              )
            );

          await openAdmin(
            adminPage
          );

          await openPlayersTab(
            adminPage
          );

          await expectPlayerVisible(
            adminPage,
            player.name
          );

          expect(
            playerTracker.pageErrors,
            [
              "Player page errors:",
              ...playerTracker.pageErrors,
            ].join("\n")
          ).toEqual([]);

          expect(
            adminTracker.pageErrors,
            [
              "Admin page errors:",
              ...adminTracker.pageErrors,
            ].join("\n")
          ).toEqual([]);

          expect(
            playerTracker.consoleErrors,
            [
              "Player console errors:",
              ...playerTracker.consoleErrors,
            ].join("\n")
          ).toEqual([]);

          expect(
            adminTracker.consoleErrors,
            [
              "Admin console errors:",
              ...adminTracker.consoleErrors,
            ].join("\n")
          ).toEqual([]);
        } finally {
          playerTracker.stop();
          adminTracker.stop();

          await safeCloseContext(
            playerContext
          );

          await safeCloseContext(
            adminContext
          );
        }
      }
    );
  }
);