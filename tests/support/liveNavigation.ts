import { expect, type Browser, type Page } from "@playwright/test";
import { safeCloseContext } from "./livePlayers";
const ADMIN_URL = "./#/admin-legacy";
export async function openAdmin(page: Page) {
  await page.goto(ADMIN_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  await expect(page.getByRole("heading").first()).toBeVisible();
  if (page.url().includes("/host/login")) {
    const email = process.env.SUPABASE_TEST_HOST_EMAIL;
    const password = process.env.SUPABASE_TEST_HOST_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Host journeys require SUPABASE_TEST_HOST_EMAIL and SUPABASE_TEST_HOST_PASSWORD for the disposable backend.",
      );
    }
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Log in to Host Hub", exact: true })
      .click();
    await expect(page).toHaveURL(/#\/host$/);
    await page.goto(ADMIN_URL, { waitUntil: "domcontentloaded" });
  }

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
