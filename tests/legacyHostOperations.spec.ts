import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostOperations } from "./support/legacyHostOperations";

async function openHost(page: Page, tab = "Live") {
  if (page.url().endsWith("#/admin")) await page.reload();
  else await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  if (tab !== "Live")
    await activateByKeyboard(
      page,
      page
        .getByRole("navigation", { name: "Host navigation" })
        .getByRole("button", { name: tab, exact: true }),
    );
}

test("legacy live voting, results return and slideshow controls retain exclusive update flags", async ({
  page,
}) => {
  const { backend, writes } = await installLegacyHostOperations(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openHost(page);
  await page
    .getByRole("combobox", { name: "Vote for", exact: true })
    .selectOption("team");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Open voting", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(1);
  await openHost(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Close voting & show results",
      exact: true,
    }),
  );
  await expect.poll(() => writes.length).toBe(2);
  await openHost(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Return everyone to game", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(3);
  await openHost(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Open slideshow", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(4);
  expect(writes.map((entry) => entry.body)).toEqual([
    {
      voting_open: true,
      voting_target: "team",
      show_vote_results: false,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      voting_open: false,
      show_vote_results: true,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      slideshow_open: true,
      voting_open: false,
      show_vote_results: false,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
  ]);
  backend.verify();
});

test("legacy live scheduling validates bounds and cancels only schedule fields", async ({
  page,
}) => {
  const { backend, writes } = await installLegacyHostOperations(page, {
    unscheduled: true,
  });
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });
  await openHost(page);
  await page
    .getByRole("spinbutton", { name: "Minutes until auto reveal", exact: true })
    .fill("241");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Schedule next challenge", exact: true }),
  );
  await expect
    .poll(() => alerts.at(-1))
    .toBe("Enter a reveal time between 1 and 240 minutes.");
  expect(writes).toHaveLength(0);
  await page
    .getByRole("spinbutton", { name: "Minutes until auto reveal", exact: true })
    .fill("12");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Schedule next challenge", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(1);
  await openHost(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Cancel schedule", exact: true }),
  );
  await expect.poll(() => writes.length).toBe(2);
  expect(writes.map((entry) => entry.body)).toEqual([
    {
      scheduled_challenge_id: 3,
      scheduled_reveal_at: "2026-11-17T12:12:00.000Z",
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
  ]);
  backend.verify();
});

test("legacy roster creation, assignment, blur rename and confirmed removal preserve persistence contracts", async ({
  page,
}) => {
  const { backend, rosterWrites } = await installLegacyHostOperations(page);
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  await openHost(page, "Players");
  await page
    .getByRole("textbox", { name: "New team name", exact: true })
    .fill("  Owls  ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create team", exact: true }),
  );
  await expect(
    page.getByRole("textbox", { name: "New team name", exact: true }),
  ).toHaveValue("");
  await expect(page.locator(".host-v2__team-chips")).toContainText("Owls");
  await page
    .getByRole("textbox", { name: "New player name", exact: true })
    .fill("  Kai  ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Add player", exact: true }),
  );
  await expect(
    page.getByRole("textbox", { name: "New player name", exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("combobox", { name: "Team", exact: true })
    .selectOption("Owls");
  await expect.poll(() => rosterWrites.length).toBe(3);
  await page
    .getByRole("textbox", { name: "Rename Pat", exact: true })
    .fill("  New Pat  ");
  await page.keyboard.press("Tab");
  await expect.poll(() => rosterWrites.length).toBe(4);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Remove Pat", exact: true }),
  );
  await expect.poll(() => rosterWrites.length).toBe(5);
  expect(rosterWrites).toEqual([
    { table: "teams", method: "POST", query: {}, body: { name: "Owls" } },
    {
      table: "players",
      method: "POST",
      query: {},
      body: { name: "Kai", team: null, score: 0 },
    },
    {
      table: "players",
      method: "PATCH",
      query: { id: "eq.p1" },
      body: { team: "Owls" },
    },
    {
      table: "players",
      method: "PATCH",
      query: { id: "eq.p1" },
      body: { name: "New Pat" },
    },
    { table: "players", method: "DELETE", query: { id: "eq.p1" }, body: null },
  ]);
  await openHost(page, "Players");
  await expect(
    page.getByRole("textbox", { name: "Rename Kai", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Rename Pat", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("legacy roster write failures keep editable drafts and explicit retry", async ({
  page,
}) => {
  const { backend, rosterWrites } = await installLegacyHostOperations(page);
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });
  await openHost(page, "Players");
  backend.failures.add("teams");
  await page
    .getByRole("textbox", { name: "New team name", exact: true })
    .fill("Owls");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create team", exact: true }),
  );
  await expect
    .poll(() => alerts.at(-1))
    .toBe("Could not create team: Fixture legacy write failed");
  await expect(
    page.getByRole("textbox", { name: "New team name", exact: true }),
  ).toHaveValue("Owls");
  await expect(
    page.getByRole("button", { name: "Create team", exact: true }),
  ).toBeEnabled();
  backend.failures.delete("teams");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create team", exact: true }),
  );
  await expect(
    page.getByRole("textbox", { name: "New team name", exact: true }),
  ).toHaveValue("");
  expect(rosterWrites).toHaveLength(2);
  backend.verify();
});

test("legacy roster emptiness preserves team and participant guidance", async ({
  page,
}) => {
  const { backend, rosterWrites } = await installLegacyHostOperations(page, {
    emptyRoster: true,
  });
  await openHost(page, "Players");
  await expect(
    page.getByText("Create a team or assign players to a team below.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Players will appear here when they join using your game code.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create team", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Add player", exact: true }),
  ).toBeDisabled();
  expect(rosterWrites).toHaveLength(0);
  backend.verify();
});
