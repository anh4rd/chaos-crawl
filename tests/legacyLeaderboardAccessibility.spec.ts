import { expect, test } from "@playwright/test";
import { installLegacyWorkspace } from "./support/legacyWorkspace";
import { activateByKeyboard } from "./support/keyboard";

test("legacy score history exposes expansion, a live target and stable keyboard focus", async ({
  page,
}) => {
  const { backend, commands } = await installLegacyWorkspace(page);
  await page.goto("#/leaderboard");
  const toggle = page.getByRole("button", { name: /Ducks/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await activateByKeyboard(page, toggle);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toBeFocused();
  const historyId = await toggle.getAttribute("aria-controls");
  if (!historyId) throw new Error("Expanded history has no target");
  const history = page.locator(`[id="${historyId}"]`);
  await expect(history).toBeVisible();
  await expect(history).toContainText("Past challenge");
  await expect(history).toContainText("Bonus");
  await activateByKeyboard(page, toggle);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(history).toHaveCount(0);
  await expect(toggle).not.toHaveAttribute("aria-controls");
  expect(commands).toHaveLength(0);
  backend.verify();
});
