import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostScores } from "./support/legacyHostScores";

async function openScores(page: Page) {
  await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Scores", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Scores & results", exact: true }),
  ).toBeVisible();
}

test("legacy score validation and player awards preserve native fields, trimmed payloads and success retention", async ({
  page,
}) => {
  const { backend, awards } = await installLegacyHostScores(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });
  await openScores(page);
  const submit = page.getByRole("button", {
    name: "Award points",
    exact: true,
  });
  await activateByKeyboard(page, submit);
  await expect.poll(() => alerts.at(-1)).toBe("Choose a player first.");
  await page
    .getByRole("combobox", { name: "Player", exact: true })
    .selectOption("p1");
  await page.getByLabel("Points", { exact: true }).fill("0");
  await activateByKeyboard(page, submit);
  await expect
    .poll(() => alerts.at(-1))
    .toBe("Enter a points amount greater than zero.");
  expect(awards).toHaveLength(0);
  await page.getByLabel("Points", { exact: true }).fill("7");
  await page
    .getByLabel("Reason (optional)", { exact: true })
    .fill("  Best costume  ");
  await activateByKeyboard(page, submit);
  await expect(
    page.getByLabel("Reason (optional)", { exact: true }),
  ).toHaveValue("");
  expect(awards).toEqual([
    {
      query: { select: "*" },
      body: {
        player_id: "p1",
        team_name: null,
        challenge_type: "manual",
        challenge_id: expect.stringMatching(
          new RegExp(
            `^manual-${Date.parse("2026-11-17T12:00:00Z")}-[a-z0-9]+$`,
          ),
        ),
        challenge_title: "Best costume",
        points: 7,
        reason: "Best costume",
      },
    },
  ]);
  await expect(page.getByLabel("Points", { exact: true })).toHaveValue("7");
  await expect(
    page.getByRole("combobox", { name: "Player", exact: true }),
  ).toHaveValue("p1");
  backend.verify();
});

test("legacy team deductions retain drafts across tabs and display reset command contracts", async ({
  page,
}) => {
  const { backend, awards, writes } = await installLegacyHostScores(page, {
    results: true,
  });
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openScores(page);
  await activateByKeyboard(
    page,
    page
      .getByRole("group", { name: "Score target", exact: true })
      .getByRole("button", { name: "Team", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Dock", exact: true }),
  );
  await page
    .getByRole("combobox", { name: "Team", exact: true })
    .selectOption("Ducks");
  await page.getByLabel("Points", { exact: true }).fill("9");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Team scores", exact: true }),
  );
  await activateByKeyboard(
    page,
    page
      .getByRole("navigation", { name: "Host navigation" })
      .getByRole("button", { name: "Live", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Scores", exact: true }),
  );
  await expect(
    page.getByRole("combobox", { name: "Team", exact: true }),
  ).toHaveValue("Ducks");
  await expect(page.getByLabel("Points", { exact: true })).toHaveValue("9");
  await expect(
    page.getByRole("button", { name: "Team scores", exact: true }),
  ).toHaveClass("is-selected");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Dock points", exact: true }),
  );
  await expect.poll(() => awards.length).toBe(1);
  expect(awards[0]?.body).toEqual({
    player_id: null,
    team_name: "Ducks",
    challenge_type: "manual",
    challenge_id: expect.stringMatching(/^manual-\d+-[a-z0-9]+$/),
    challenge_title: "Host points deduction",
    points: -9,
    reason: "Host points deduction",
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Open slideshow", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(1);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Return everyone to game", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(2);
  expect(writes).toEqual([
    {
      query: { id: "eq.1" },
      body: {
        slideshow_open: true,
        voting_open: false,
        show_vote_results: false,
        updated_at: "2026-11-17T12:00:00.000Z",
      },
    },
    {
      query: { id: "eq.1" },
      body: {
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
        updated_at: "2026-11-17T12:00:00.000Z",
      },
    },
  ]);
  backend.verify();
});

test("failed legacy score writes keep the reason and allow an explicit native retry", async ({
  page,
}) => {
  const { backend, awards } = await installLegacyHostScores(page);
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });
  await openScores(page);
  backend.failures.add("score_events");
  await page
    .getByRole("combobox", { name: "Player", exact: true })
    .selectOption("p1");
  await page
    .getByLabel("Reason (optional)", { exact: true })
    .fill("Keep this reason");
  const submit = page.getByRole("button", {
    name: "Award points",
    exact: true,
  });
  await activateByKeyboard(page, submit);
  await expect
    .poll(() => alerts.at(-1))
    .toBe("Could not update score: Fixture score write failed");
  await expect(
    page.getByLabel("Reason (optional)", { exact: true }),
  ).toHaveValue("Keep this reason");
  await expect(submit).toBeEnabled();
  backend.failures.delete("score_events");
  await activateByKeyboard(page, submit);
  await expect(
    page.getByLabel("Reason (optional)", { exact: true }),
  ).toHaveValue("");
  expect(awards).toHaveLength(2);
  backend.verify();
});

test("empty legacy score lists preserve the original message and choice placeholders", async ({
  page,
}) => {
  const { backend, awards } = await installLegacyHostScores(page, {
    empty: true,
  });
  await openScores(page);
  await expect(
    page.getByText("Scores will appear here when points are awarded.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("combobox", { name: "Player", exact: true })
      .getByRole("option"),
  ).toHaveText(["Select a player"]);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Team scores", exact: true }),
  );
  await expect(
    page.getByText("Scores will appear here when points are awarded.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(awards).toHaveLength(0);
  backend.verify();
});
