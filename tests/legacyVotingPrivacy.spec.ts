import { expect, test } from "@playwright/test";
import { installLegacyPlayer } from "./support/legacyPlayer";

for (const route of ["game", "vote", "vote-results"]) {
  test(`legacy ${route} keeps open voting ahead of a stale result flag`, async ({
    page,
  }) => {
    const { backend, setGame } = await installLegacyPlayer(page);
    setGame({ voting_open: true, show_vote_results: true });
    await page.goto(`#/${route}`);
    await expect(page).toHaveURL(/#\/vote$/);
    await expect(
      page.getByRole("heading", { name: "Vote!", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cast Vote", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: "Voting Results", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("ol")).toHaveCount(0);
    backend.verify();
  });
}

test("legacy results publish again only after open voting clears", async ({
  page,
}) => {
  const { backend, setGame } = await installLegacyPlayer(page);
  setGame({ voting_open: true, show_vote_results: true });
  await page.goto("#/vote-results");
  await expect(
    page.getByRole("heading", { name: "Vote!", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Voting Results", exact: true }),
  ).toHaveCount(0);
  setGame({ voting_open: false, show_vote_results: true });
  await page.goto("#/vote-results");
  await expect(
    page.getByRole("heading", { name: "Voting Results", exact: true }),
  ).toBeVisible();
  const result = page.getByRole("listitem");
  await expect(result).toHaveCount(1);
  await expect(result).toContainText("Pat");
  await expect(result).toContainText("1");
  backend.verify();
});

test("a missing legacy voter rejoins through legacy access without clearing V2 credentials", async ({
  page,
}) => {
  const { backend, setGame } = await installLegacyPlayer(page);
  setGame({ voting_open: true, show_vote_results: false });
  await page.addInitScript(() => {
    localStorage.removeItem("chaos-crawl-player-id");
    localStorage.setItem(
      "chaos-crawl-session-player:123456",
      "unrelated-v2-token",
    );
  });
  await page.goto("#/vote");
  await expect(
    page.getByRole("heading", { name: "Rejoin Needed", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rejoin Game", exact: true }).click();
  await expect(page).toHaveURL(/#\/legacy\/join$/);
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-session-player:123456"),
    ),
  ).toBe("unrelated-v2-token");
  backend.verify();
});
