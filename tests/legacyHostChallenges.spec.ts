import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostChallenges } from "./support/legacyHostChallenges";

async function openChallenges(page: Page) {
  await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Challenges", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Challenges", exact: true }),
  ).toBeVisible();
}
const row = (page: Page, title: string) =>
  page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });

test("legacy host challenges preserve round order, scheduled/current controls, side counts and ledger score views", async ({
  page,
}) => {
  const { backend, writes } = await installLegacyHostChallenges(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openChallenges(page);
  await expect(page.locator(".challenge-item h3")).toHaveText([
    "Past challenge",
    "Current challenge",
    "Later challenge",
    "Scheduled challenge",
    "Unassigned finale",
    "Orphan challenge",
  ]);
  await expect(page.getByText("ROUND 3", { exact: true })).toBeVisible();
  await expect(page.getByText("ROUND 4", { exact: true })).toHaveCount(0);
  await expect(
    row(page, "Current challenge").getByRole("button", {
      name: "Live",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    row(page, "Scheduled challenge").getByRole("button", {
      name: "Schedule",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    row(page, "Unassigned finale").getByText("No description added."),
  ).toBeVisible();
  await expect(
    row(page, "Side & photo?").getByText("2 completions recorded"),
  ).toBeVisible();
  await expect(
    row(page, "Another side task").getByText("0 completions recorded"),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Scores", exact: true }),
  );
  await expect(page.locator(".ranking-row")).toHaveText(["1Pat10 pts"]);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Team scores", exact: true }),
  );
  await expect(page.locator(".ranking-row")).toHaveText(["1Ducks15 pts"]);
  expect(writes).toHaveLength(0);
  backend.verify();
});

for (const operation of ["Reveal", "Schedule"]) {
  test(`legacy host ${operation.toLowerCase()} keeps pending native controls and exact update contracts`, async ({
    page,
  }) => {
    const { backend, writes } = await installLegacyHostChallenges(page);
    await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname === "/rest/v1/game_state",
      async (route) => {
        if (route.request().method() === "PATCH") await pending;
        await route.fallback();
      },
    );
    try {
      await openChallenges(page);
      await activateByKeyboard(
        page,
        row(page, "Later challenge").getByRole("button", {
          name: operation,
          exact: true,
        }),
      );
      const controls = page.getByRole("button", {
        name: /^(Reveal|Schedule)$/,
      });
      for (const control of await controls.all())
        await expect(control).toBeDisabled();
      release();
      await expect(
        page
          .getByRole("navigation", { name: "Host navigation" })
          .getByRole("button", { name: "Live", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      expect(writes).toEqual([
        {
          query: { id: "eq.1" },
          body:
            operation === "Reveal"
              ? {
                  current_pub: "Second pub",
                  current_challenge_id: 3,
                  current_challenge: "Later challenge",
                  challenge_description: "Make a scene.",
                  current_challenge_order: 1,
                  voting_open: false,
                  show_vote_results: false,
                  slideshow_open: false,
                  scheduled_challenge_id: null,
                  scheduled_reveal_at: null,
                  updated_at: "2026-11-17T12:00:00.000Z",
                }
              : {
                  scheduled_challenge_id: 3,
                  scheduled_reveal_at: "2026-11-17T12:15:00.000Z",
                  updated_at: "2026-11-17T12:00:00.000Z",
                },
        },
      ]);
      backend.verify();
    } finally {
      release();
    }
  });
}

test("legacy host empty challenge collections retain their message and read-only state", async ({
  page,
}) => {
  const { backend, writes } = await installLegacyHostChallenges(page, true);
  await openChallenges(page);
  await expect(
    page.getByText("No active side challenges found.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".challenge-item")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Review", exact: true }),
  ).toHaveCount(0);
  expect(writes).toHaveLength(0);
  backend.verify();
});
