import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostChallenges } from "./support/legacyHostChallenges";

async function prepare(
  page: Parameters<typeof installLegacyHostChallenges>[0],
  player: boolean,
) {
  const fixture = await installLegacyHostChallenges(page);
  await page.clock.setFixedTime(new Date("2020-01-01T12:00:00Z"));
  await page.addInitScript((saved) => {
    if (saved) localStorage.setItem("chaos-crawl-player-id", "p1");
    else localStorage.removeItem("chaos-crawl-player-id");
  }, player);
  return fixture;
}

test("legacy join retains its visible native field and empty-submit feedback", async ({
  page,
}) => {
  const { backend } = await prepare(page, false);
  await page.goto("#/legacy/join");
  await expect(
    page.getByRole("heading", { name: "Join the Chaos", exact: true }),
  ).toBeVisible();
  const name = page.getByRole("textbox", { name: "Your name", exact: true });
  await expect(name).toHaveAttribute("autocomplete", "name");
  await expect(name).toHaveAttribute("required", "");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join Game", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText("Enter your name first.");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute("aria-describedby", "join-error");
  backend.verify();
});

test("a missing legacy player reaches the existing join route", async ({
  page,
}) => {
  const { backend } = await prepare(page, false);
  await page.goto("#/game");
  await expect(
    page.getByRole("heading", {
      name: "Join the game to take part",
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join Game", exact: true }),
  );
  await expect(page).toHaveURL(/#\/legacy\/join$/);
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toBeVisible();
  backend.verify();
});

test("legacy gameplay and leaderboard retain ledger scores and native navigation", async ({
  page,
}) => {
  const { backend } = await prepare(page, true);
  await page.goto("#/game");
  await expect(
    page.getByRole("heading", { name: "Current challenge", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your team", { exact: true })).toBeVisible();
  await expect(page.getByText("Ducks", { exact: true })).toBeVisible();
  await expect(page.getByText("15", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Leaderboard", exact: true }),
  );
  await expect(page).toHaveURL(/#\/leaderboard$/);
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Players", exact: true }),
  );
  await expect(page.getByText("Pat", { exact: true })).toBeVisible();
  await expect(page.getByText("10", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Teams", exact: true }),
  );
  await expect(page.getByText("Ducks", { exact: true })).toBeVisible();
  await expect(page.getByText("15", { exact: true })).toBeVisible();
  backend.verify();
});
