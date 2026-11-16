import type { BrowserContext } from "@playwright/test";
import { test, expect } from "../support/liveFixture";
import {
  uniqueName,
  safeCloseContext,
  joinPlayer,
  type TestPlayer,
} from "../support/livePlayers";
import {
  openAdmin,
  openPlayersTab,
  expectPlayerVisible,
  verifyPlayerWithFreshAdmin,
  clickLeaderboard,
} from "../support/liveNavigation";
import { attachErrorTracker } from "../support/runtimeErrors";

test.describe("multi-player event flow", () => {
  test.setTimeout(90_000);

  test("three players join and appear in admin", async ({ browser }) => {
    const playerContexts: BrowserContext[] = [];

    const adminContext = await browser.newContext();

    const adminPage = await adminContext.newPage();

    try {
      const players: TestPlayer[] = [];

      const names = [
        uniqueName("Anna"),
        uniqueName("Bob"),
        uniqueName("Charlie"),
      ];

      for (const name of names) {
        const context = await browser.newContext();

        playerContexts.push(context);

        const page = await context.newPage();

        const player = await joinPlayer(page, name);

        players.push(player);
      }

      await openAdmin(adminPage);

      await openPlayersTab(adminPage);

      for (const player of players) {
        await expectPlayerVisible(adminPage, player.name);
      }
    } finally {
      for (const context of playerContexts) {
        await safeCloseContext(context);
      }

      await safeCloseContext(adminContext);
    }
  });

  test("three player sessions survive refresh independently", async ({
    browser,
  }) => {
    const contexts: BrowserContext[] = [];

    try {
      const players: TestPlayer[] = [];

      const names = [
        uniqueName("Refresh-A"),
        uniqueName("Refresh-B"),
        uniqueName("Refresh-C"),
      ];

      for (const name of names) {
        const context = await browser.newContext();

        contexts.push(context);

        const page = await context.newPage();

        const player = await joinPlayer(page, name);

        players.push(player);

        await page.reload({
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });

        await expect
          .poll(() => page.url(), {
            timeout: 15_000,
          })
          .toMatch(/game/i);
      }

      expect(new Set(players.map((player) => player.id)).size).toBe(3);
    } finally {
      for (const context of contexts) {
        await safeCloseContext(context);
      }
    }
  });

  test("admin sees a newly joined player", async ({ browser }) => {
    const playerContext = await browser.newContext();

    const adminContext = await browser.newContext();

    const playerPage = await playerContext.newPage();

    const adminPage = await adminContext.newPage();

    try {
      await openAdmin(adminPage);

      await openPlayersTab(adminPage);

      const name = uniqueName("Realtime");

      await joinPlayer(playerPage, name);

      await expectPlayerVisible(adminPage, name);
    } finally {
      await safeCloseContext(playerContext);

      await safeCloseContext(adminContext);
    }
  });

  test("newly joined player is visible in a fresh admin session", async ({
    browser,
  }) => {
    const playerContext = await browser.newContext();

    const playerPage = await playerContext.newPage();

    try {
      const name = uniqueName("Fresh-Admin");

      await joinPlayer(playerPage, name);

      await verifyPlayerWithFreshAdmin(browser, name);
    } finally {
      await safeCloseContext(playerContext);
    }
  });

  test("multiple players can open leaderboard independently", async ({
    browser,
  }) => {
    const contexts: BrowserContext[] = [];

    try {
      for (const label of ["LB-A", "LB-B", "LB-C"]) {
        const context = await browser.newContext();

        contexts.push(context);

        const page = await context.newPage();

        await joinPlayer(page, uniqueName(label));

        await clickLeaderboard(page);
      }
    } finally {
      for (const context of contexts) {
        await safeCloseContext(context);
      }
    }
  });

  test("player and admin sessions run together without uncaught errors", async ({
    browser,
  }) => {
    const playerContext = await browser.newContext();

    const adminContext = await browser.newContext();

    const playerPage = await playerContext.newPage();

    const adminPage = await adminContext.newPage();

    const playerTracker = attachErrorTracker(playerPage);

    const adminTracker = attachErrorTracker(adminPage);

    try {
      const player = await joinPlayer(playerPage, uniqueName("Concurrent"));

      await openAdmin(adminPage);

      await openPlayersTab(adminPage);

      await expectPlayerVisible(adminPage, player.name);

      expect(
        playerTracker.pageErrors,
        ["Player page errors:", ...playerTracker.pageErrors].join("\n"),
      ).toEqual([]);

      expect(
        adminTracker.pageErrors,
        ["Admin page errors:", ...adminTracker.pageErrors].join("\n"),
      ).toEqual([]);

      expect(
        playerTracker.consoleErrors,
        ["Player console errors:", ...playerTracker.consoleErrors].join("\n"),
      ).toEqual([]);

      expect(
        adminTracker.consoleErrors,
        ["Admin console errors:", ...adminTracker.consoleErrors].join("\n"),
      ).toEqual([]);
    } finally {
      playerTracker.stop();
      adminTracker.stop();

      await safeCloseContext(playerContext);

      await safeCloseContext(adminContext);
    }
  });
});
