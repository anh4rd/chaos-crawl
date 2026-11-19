import { expect, type Locator, type Page } from "@playwright/test";

export async function tabTo(
  page: Page,
  target: Locator,
  direction: "forward" | "backward" = "forward",
) {
  await expect(target).toBeVisible();
  const controlCount = await page
    .locator(
      'a[href], button, input, select, textarea, summary, [tabindex], audio[controls], video[controls], [contenteditable="true"], iframe',
    )
    .count();
  for (let count = 0; count <= controlCount; count += 1) {
    if (await target.evaluate((element) => element === document.activeElement))
      return;
    await page.keyboard.press(direction === "backward" ? "Shift+Tab" : "Tab");
  }
  await expect(target).toBeFocused();
}
export async function activateByKeyboard(
  page: Page,
  target: Locator,
  direction: "forward" | "backward" = "forward",
) {
  await tabTo(page, target, direction);
  await page.keyboard.press("Enter");
}
