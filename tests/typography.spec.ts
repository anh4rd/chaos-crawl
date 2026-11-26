import { expect, test, type Page } from "@playwright/test";
import { installSessionBackend, sessionId } from "./support/sessionBackend";

async function undersizedText(page: Page) {
  return page.evaluate(() => {
    const navigation = ".session-navigation, .mobile-navigation, .game-dock";
    const compactLabels = [
      ".timer-readout__label",
      ".game-identity__name small",
      ".game-identity__code small",
      ".invite-code > span",
      ".stat-tile__label",
      ".session-titlebar__code small",
      ".session-titlebar__name small",
      ".main-challenge__award",
      ".session-reward-round__kicker",
    ].join(", ");
    const failures: string[] = [];
    function check(element: Element, text: string) {
      if (!text.trim() || !element.getClientRects().length) return;
      const style = getComputedStyle(element);
      if (style.visibility !== "visible") return;
      const size = Number.parseFloat(style.fontSize);
      const minimum = element.closest(navigation)
        ? 9
        : element.closest(compactLabels)
          ? 11
          : 12;
      if (size < minimum) {
        failures.push(
          `${size}px: ${element.tagName.toLowerCase()}.${element.className.toString()} "${text.trim().slice(0, 60)}"`,
        );
      }
    }
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      if (node.parentElement && range.getBoundingClientRect().height > 0)
        check(node.parentElement, node.textContent ?? "");
    }
    for (const input of document.querySelectorAll<HTMLInputElement>(
      "input[placeholder], textarea[placeholder], input[type=submit], input[type=button]",
    )) {
      check(input, input.placeholder || input.value);
    }
    return failures;
  });
}

test("the console display font loads locally without the blocked font provider", async ({
  page,
}) => {
  const providerRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("db.onlinewebfonts.com"))
      providerRequests.push(request.url());
  });
  const fontResponse = page.waitForResponse((response) =>
    response.url().includes("/fonts/Lost%20in%20South.woff2"),
  );
  await page.goto("#/styleguide");
  const faces = await page.evaluate(async () =>
    (await document.fonts.load('24px "Lost in South"')).map(
      (face) => face.status,
    ),
  );
  expect(faces).toEqual(["loaded"]);
  expect((await fontResponse).status()).toBe(200);
  expect(providerRequests).toEqual([]);
});

test("styleguide text respects the typography minimums", async ({ page }) => {
  const backend = await installSessionBackend(page);
  await page.goto("#/styleguide");
  await expect(page.locator(".timer-readout__label").first()).toHaveCSS(
    "font-size",
    "11px",
  );
  await expect(
    page.locator(".stat-tile--compact .stat-tile__label").first(),
  ).toHaveCSS("font-size", "11px");
  expect(await undersizedText(page)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  const timerRow = page
    .getByText("TIME REMAINING", { exact: true })
    .first()
    .locator("../..");
  expect(
    await timerRow
      .locator(".timer-readout__label")
      .evaluate((label) => label.scrollWidth <= label.clientWidth),
  ).toBe(true);
  expect(
    await timerRow.evaluate((row) => {
      const bounds = row.getBoundingClientRect();
      return [...row.children].every((child) => {
        const box = child.getBoundingClientRect();
        return box.left >= bounds.left && box.right <= bounds.right;
      });
    }),
  ).toBe(true);
  expect(await undersizedText(page)).toEqual([]);
  backend.verify();
});

test("session and lobby text respect the typography minimums", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  backend.session.teams_enabled = true;
  await page.goto(`#/host/live/${sessionId}`);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Players & teams", exact: true }),
  ).toBeVisible();
  expect(await undersizedText(page)).toEqual([]);
  backend.session.status = "live";
  await expect(page.locator(".session-navigation__item").first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator(".session-navigation__item").first()).toHaveCSS(
    "font-size",
    "9px",
  );
  expect(await undersizedText(page)).toEqual([]);
  await page.goto("#/play/123456/game");
  await expect(page.locator(".session-navigation__item").first()).toBeVisible();
  expect(await undersizedText(page)).toEqual([]);
  backend.verify();
});
