import { expect, test } from "@playwright/test";
import { tabTo } from "./support/keyboard";
import { installHostFoundation } from "./support/hostFoundation";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});

test("public suspense fallback remains a main landmark until its route chunk resolves", async ({
  page,
}) => {
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname.endsWith("/src/pages/Join.tsx"),
    async (route) => {
      await waiting;
      await route.continue();
    },
  );
  try {
    await page.goto("./#/join", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main")).toHaveText("Loading chaos...");
    expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({});
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Loading chaos...", { exact: true })).toHaveCount(
    0,
  );
});

test("host directory fallbacks, native tab activation and read-only preview preserve their route contracts", async ({
  page,
}) => {
  const backend = await installHostFoundation(page);
  await page.goto("./#/host");
  await expect(page.getByText("3 hosts", { exact: true })).toBeVisible();
  const fallback = page
    .getByText("Host account", { exact: true })
    .locator("xpath=ancestor::article[1]");
  await expect(fallback).toContainText("No email");
  await expect(fallback).toContainText("0 games");
  const named = page
    .getByText("Named Host", { exact: true })
    .locator("xpath=ancestor::article[1]");
  await expect(named).toContainText("1 game ·");
  await tabTo(page, page.getByRole("tab", { name: "Overview", exact: true }));
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tab", { name: /Your games/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/host\/games$/);
  await expect(
    page.getByRole("heading", { name: "All plans", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await fallback
    .getByRole("button", { name: "View Host Hub", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/#\/host\?viewAs=empty-host$/);
  await expect(
    page.getByText("Viewing as host", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create new game", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit plan", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Return to your Host Hub" })
    .press("Enter");
  await expect(page).toHaveURL(/#\/host$/);
  expect(
    backend.requests.some(
      (request) => request.name === "cc_host_create_game_session",
    ),
  ).toBe(false);
  backend.verify();
});
