import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installLegacyHostOperations } from "./support/legacyHostOperations";

async function openLocalRoster(page: Page) {
  const requests: string[] = [];
  await page.route("https://chaos-crawl-test.supabase.co/**", async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  await page.goto("#/styleguide");
  const preview = page.locator("#legacy-host");
  await activateByKeyboard(
    page,
    preview
      .getByRole("navigation", { name: "Host navigation" })
      .getByRole("button", { name: "Players", exact: true }),
  );
  return { preview, requests };
}
test("keyboard removal keeps focus on the next roster row and then the empty roster input", async ({
  page,
}) => {
  const { preview, requests } = await openLocalRoster(page);
  const draft = preview.getByRole("textbox", {
    name: "New player name",
    exact: true,
  });
  await tabTo(page, draft);
  await page.keyboard.type("Alex");
  await activateByKeyboard(
    page,
    preview.getByRole("button", { name: "Add player", exact: true }),
  );
  await expect(
    preview.getByRole("textbox", { name: "Rename Alex", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    preview.getByRole("button", { name: "Remove Pat", exact: true }),
  );
  await expect(
    preview.getByRole("textbox", { name: "Rename Alex", exact: true }),
  ).toBeFocused();
  await activateByKeyboard(
    page,
    preview.getByRole("button", { name: "Remove Alex", exact: true }),
  );
  await expect(draft).toBeFocused();
  expect(
    await draft.evaluate((input) => {
      const style = getComputedStyle(input);
      return (
        (style.outlineStyle !== "none" &&
          Number.parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== "none"
      );
    }),
  ).toBe(true);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
test("a controlled roster refresh does not steal focus after keyboard navigation outside the roster", async ({
  page,
}) => {
  const { preview, requests } = await openLocalRoster(page);
  await tabTo(
    page,
    preview.getByRole("textbox", { name: "Rename Pat", exact: true }),
  );
  const empty = preview.getByRole("checkbox", {
    name: "Empty content",
    exact: true,
  });
  await tabTo(page, empty, "backward");
  await page.keyboard.press("Space");
  await expect(
    preview.getByRole("textbox", { name: "Rename Pat", exact: true }),
  ).toHaveCount(0);
  await expect(empty).toBeFocused();
  expect(requests).toEqual([]);
});
test("cancelled and failed connected removals preserve the focused row and exact delete contract", async ({
  page,
}) => {
  const { backend, rosterWrites } = await installLegacyHostOperations(page);
  let confirm = false;
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "confirm" && !confirm) await dialog.dismiss();
    else {
      if (dialog.type() === "alert") alerts.push(dialog.message());
      await dialog.accept();
    }
  });
  await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await activateByKeyboard(
    page,
    page
      .getByRole("navigation", { name: "Host navigation" })
      .getByRole("button", { name: "Players", exact: true }),
  );
  const remove = page.getByRole("button", { name: "Remove Pat", exact: true });
  await activateByKeyboard(page, remove);
  await expect(remove).toBeFocused();
  expect(rosterWrites).toEqual([]);
  confirm = true;
  backend.failures.add("players");
  await page.keyboard.press("Enter");
  await expect
    .poll(() => alerts)
    .toEqual(["Could not remove player: Fixture legacy write failed"]);
  await expect(remove).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Rename Pat", exact: true }),
  ).toBeVisible();
  expect(rosterWrites).toEqual([
    { table: "players", method: "DELETE", query: { id: "eq.p1" }, body: null },
  ]);
  backend.verify();
});

test("confirmed connected deletion restores focus after the real mocked Realtime refresh", async ({
  page,
}) => {
  const { backend, rosterWrites, notifyPlayers } =
    await installLegacyHostOperations(page);
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await activateByKeyboard(
    page,
    page
      .getByRole("navigation", { name: "Host navigation" })
      .getByRole("button", { name: "Players", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Remove Pat", exact: true }),
  );
  await expect.poll(() => rosterWrites.length).toBe(1);
  await expect.poll(() => backend.rows.players.length).toBe(0);
  notifyPlayers();
  await expect(
    page.getByRole("textbox", { name: "Rename Pat", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "New player name", exact: true }),
  ).toBeFocused();
  expect(rosterWrites).toEqual([
    { table: "players", method: "DELETE", query: { id: "eq.p1" }, body: null },
  ]);
  backend.verify();
});
