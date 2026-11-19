import { expect, test } from "@playwright/test";

test("local legacy host console supports native controls without backend or credential operations", async ({
  page,
}) => {
  const backend: string[] = [];
  await page.route("https://chaos-crawl-test.supabase.co/**", async (route) => {
    backend.push(route.request().url());
    await route.abort();
  });
  await page.goto("./#/styleguide");
  const preview = page.locator("#legacy-host");
  await expect(
    preview.getByRole("heading", { name: "Local legacy host console" }),
  ).toBeVisible();
  const stored = await page.evaluate(() => ({ ...localStorage }));
  const navigation = preview.getByRole("navigation", {
    name: "Host navigation",
  });
  await navigation.getByRole("button", { name: "Players" }).click();
  await preview
    .getByRole("textbox", { name: "New team name" })
    .fill("  Bears  ");
  await preview.getByRole("button", { name: "Create team" }).press("Enter");
  await expect(
    preview
      .getByRole("combobox", { name: "Team", exact: true })
      .getByRole("option", { name: "Bears" }),
  ).toHaveCount(1);
  await preview.getByRole("checkbox", { name: "Pending controls" }).check();
  await preview.getByRole("textbox", { name: "New player name" }).fill("Kai");
  await expect(
    preview.getByRole("textbox", { name: "New player name" }),
  ).toBeEnabled();
  await expect(
    preview.getByRole("button", { name: "Add player" }),
  ).toBeDisabled();
  await preview.getByRole("checkbox", { name: "Pending controls" }).uncheck();
  await preview.getByRole("button", { name: "Add player" }).press("Enter");
  await expect(
    preview.getByRole("textbox", { name: "Rename Kai" }),
  ).toBeVisible();
  await navigation.getByRole("button", { name: "Scores" }).click();
  await preview.getByRole("spinbutton", { name: "Points" }).fill("3");
  await preview.getByRole("button", { name: /Award points/ }).press("Enter");
  await expect(preview.getByRole("status")).toHaveText(
    "Points changed locally.",
  );
  await navigation.getByRole("button", { name: "Challenges" }).click();
  await preview.getByRole("button", { name: "Review", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText(
    "Review opened locally.",
  );
  await navigation.getByRole("button", { name: "Live", exact: true }).click();
  await preview
    .getByRole("button", { name: "Open voting", exact: true })
    .press("Enter");
  await expect(
    preview.getByRole("button", { name: "Close voting & show results" }),
  ).toBeVisible();
  await preview.getByRole("checkbox", { name: "Empty content" }).check();
  await expect(
    preview.getByRole("heading", { name: "No challenge is live yet" }),
  ).toBeVisible();
  expect(backend).toEqual([]);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(stored);
  await expect(page).toHaveURL(/#\/styleguide$/);
});
