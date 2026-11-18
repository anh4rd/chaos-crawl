import { expect, test } from "@playwright/test";
import { tabTo } from "./support/keyboard";
import { installHostFoundation } from "./support/hostFoundation";

for (const preview of [false, true]) {
  test(`Host Hub tabs use arrows and named panels${preview ? " in a read-only preview" : ""}`, async ({
    page,
  }) => {
    const backend = await installHostFoundation(page);
    await page.goto(`./#/host${preview ? "?viewAs=empty-host" : ""}`);
    const overview = page.getByRole("tab", { name: "Overview", exact: true });
    const games = page.getByRole("tab", { name: /Your games/ });
    await tabTo(page, overview);
    await page.keyboard.press("ArrowRight");
    await expect(games).toBeFocused();
    await expect(games).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(
      preview ? /#\/host\/games\?viewAs=empty-host$/ : /#\/host\/games$/,
    );
    const panel = page.getByRole("tabpanel", { name: /Your games/ });
    await expect(
      panel.getByRole("heading", { name: "All plans", exact: true }),
    ).toBeVisible();
    const panelId = await panel.getAttribute("id");
    const tabId = await games.getAttribute("id");
    expect(panelId).toBeTruthy();
    expect(tabId).toBeTruthy();
    if (!panelId || !tabId)
      throw new Error("Hub panel and tab must have linked IDs");
    await expect(games).toHaveAttribute("aria-controls", panelId);
    await expect(panel).toHaveAttribute("aria-labelledby", tabId);
    await page.keyboard.press("Tab");
    await expect(panel).toBeFocused();
    await expect(panel).not.toHaveCSS("outline-style", "none");
    expect(
      await panel.evaluate((element) =>
        parseFloat(getComputedStyle(element).outlineWidth),
      ),
    ).toBeGreaterThan(0);
    await page.keyboard.press("Shift+Tab");
    await expect(games).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(overview).toBeFocused();
    await page.keyboard.press("End");
    await expect(games).toBeFocused();
    await page.keyboard.press("Home");
    await expect(overview).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(games).toBeFocused();
    expect(
      backend.requests.some(
        (request) => request.name === "cc_host_create_game_session",
      ),
    ).toBe(false);
    backend.verify();
  });
}
