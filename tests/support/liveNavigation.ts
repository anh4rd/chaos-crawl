import { expect, type Browser, type Page } from "@playwright/test";
import { safeCloseContext } from "./livePlayers";
const ADMIN_URL = "./#/admin";
export async function openAdmin(page: Page) {
  await page.goto(ADMIN_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  await expect(page.getByText("Host Control")).toBeVisible({
    timeout: 15_000,
  });

  await expect(
    page
      .getByRole("button", {
        name: /live/i,
      })
      .first(),
  ).toBeVisible({
    timeout: 15_000,
  });
}

export async function openPlayersTab(page: Page) {
  const playersTab = page
    .getByRole("button", {
      name: /👥 Players/i,
    })
    .first();

  await expect(playersTab, "Could not find Players admin tab").toBeVisible({
    timeout: 15_000,
  });

  await playersTab.click();

  await expect(page.locator("body")).not.toContainText("Loading chaos...", {
    timeout: 15_000,
  });
}

export async function expectPlayerVisible(page: Page, playerName: string) {
  const exactValueInput = page.locator(
    `input[value=${JSON.stringify(playerName)}]`,
  );

  await expect(
    exactValueInput.first(),
    `Could not find player "${playerName}" in Admin player inputs`,
  ).toBeVisible({
    timeout: 15_000,
  });
}

export async function expectPlayerVisibleInAdmin(
  page: Page,
  playerName: string,
) {
  await openAdmin(page);

  await openPlayersTab(page);

  await expectPlayerVisible(page, playerName);
}

export async function verifyPlayerWithFreshAdmin(
  browser: Browser,
  playerName: string,
) {
  const context = await browser.newContext();

  const page = await context.newPage();

  try {
    await expectPlayerVisibleInAdmin(page, playerName);
  } finally {
    await safeCloseContext(context);
  }
}

export async function clickLeaderboard(page: Page) {
  const button = page
    .getByRole("button", {
      name: /leaderboard/i,
    })
    .first();

  await expect(button).toBeVisible({
    timeout: 15_000,
  });

  await button.click();

  await expect
    .poll(() => page.url(), {
      timeout: 15_000,
      intervals: [100, 250, 500],
    })
    .toMatch(/leaderboard/i);
}
