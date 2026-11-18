import { expect, test } from "@playwright/test";
import { tabTo } from "./support/keyboard";

test("local workspace tabs, empty state and preview navigation use local state only", async ({
  page,
}) => {
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("supabase.co"))
      backendRequests.push(request.url());
  });
  await page.goto("#/styleguide");
  const reference = page.locator("#host-foundation-demo");
  const overview = reference.getByRole("tab", {
    name: "Overview",
    exact: true,
  });
  const games = reference.getByRole("tab", { name: /Your games/ });
  await tabTo(page, overview);
  await page.keyboard.press("ArrowRight");
  await expect(games).toBeFocused();
  await expect(games).toHaveJSProperty("tabIndex", 0);
  await expect(overview).toHaveJSProperty("tabIndex", -1);
  const panel = reference.getByRole("tabpanel", { name: /Your games/ });
  await expect(
    panel.getByRole("heading", { name: "All plans", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(panel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Home");
  await expect(overview).toBeFocused();
  await reference
    .getByRole("checkbox", { name: "Empty workspace preview" })
    .check();
  await expect(
    reference
      .getByRole("tabpanel", { name: "Overview", exact: true })
      .getByRole("heading", { name: "No games yet", exact: true }),
  ).toBeVisible();
  await reference
    .getByRole("checkbox", { name: "Empty workspace preview" })
    .uncheck();
  await reference
    .getByRole("button", { name: "View Host Hub", exact: true })
    .first()
    .press("Enter");
  await expect(
    reference.getByText("Viewing as Demo Host", { exact: true }),
  ).toBeVisible();
  await reference
    .getByRole("button", { name: "Return to local Host Hub", exact: true })
    .press("Enter");
  await expect(
    reference.getByText("Viewing as Demo Host", { exact: true }),
  ).toHaveCount(0);
  await reference
    .getByRole("link", { name: /^(My games|Games)$/ })
    .first()
    .press("Enter");
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(backendRequests).toEqual([]);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({});
});
