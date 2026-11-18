import { expect, test, type Page } from "@playwright/test";
import { installLegacyHostOperations } from "./support/legacyHostOperations";
import { holdLegacyAdminWrite } from "./support/legacyAdminLifecycle";
async function open(page: Page, tab: string, heading: string) {
  const fixture = await installLegacyHostOperations(page);
  fixture.backend.rows.votes = [];
  await page.goto("#/admin-legacy");
  await expect(
    page.getByRole("heading", { name: "Round Challenges", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: tab, exact: true }).press("Enter");
  await expect(
    page.getByRole("heading", { name: heading, exact: true }),
  ).toBeVisible();
  const alerts: string[] = [],
    confirmations: string[] = [];
  page.on("dialog", async (dialog) => {
    (dialog.type() === "confirm" ? confirmations : alerts).push(
      dialog.message(),
    );
    await dialog.accept();
  });
  return { ...fixture, alerts, confirmations };
}
async function showTeams(page: Page) {
  await page
    .getByRole("button", { name: "🏁 Teams", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "Assign Teams", exact: true }),
  ).toBeVisible();
}

test("a completed slideshow request cannot take over a newly selected game tab", async ({
  page,
}) => {
  const { alerts } = await open(page, "📺 Screens", "Host Screens");
  const gate = await holdLegacyAdminWrite(page, "game_state", "PATCH");
  try {
    await page
      .getByRole("button", { name: "Start Slideshow", exact: true })
      .press("Enter");
    await expect.poll(() => gate.requests.length).toBe(1);
    await page
      .getByRole("button", { name: "🔴 Live", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("heading", { name: "Round Challenges", exact: true }),
    ).toBeVisible();
    await gate.settle();
    await expect(page).toHaveURL(/#\/admin-legacy$/);
    await expect(
      page.getByRole("heading", { name: "Round Challenges", exact: true }),
    ).toBeVisible();
    expect(alerts).toEqual([]);
    expect(gate.requests[0]?.body).toEqual(
      expect.objectContaining({
        slideshow_open: true,
        voting_open: false,
        show_vote_results: false,
      }),
    );
  } finally {
    gate.release();
  }
});

test("obsolete game failure cannot unlock or interrupt the fresh tab operation", async ({
  page,
}) => {
  const { alerts } = await open(page, "📺 Screens", "Host Screens");
  const gate = await holdLegacyAdminWrite(page, "game_state", "PATCH", 1);
  try {
    await page
      .getByRole("button", { name: "Start Slideshow", exact: true })
      .press("Enter");
    await expect.poll(() => gate.requests.length).toBe(1);
    await page
      .getByRole("button", { name: "🔴 Live", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("heading", { name: "Change Live Game" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Go Live", exact: true })
      .press("Enter");
    await expect.poll(() => gate.requests.length).toBe(2);
    await gate.settle(0);
    await page
      .getByRole("button", { name: "Go Live", exact: true })
      .press("Enter");
    await page.waitForTimeout(100);
    expect(gate.requests).toHaveLength(2);
    expect(alerts).toEqual([]);
    gate.release(1);
    await expect.poll(() => alerts).toEqual(["Live game updated!"]);
  } finally {
    gate.release();
  }
});

test("a prior team form cannot report failure or release the fresh form lock", async ({
  page,
}) => {
  const { alerts } = await open(page, "🏁 Teams", "Assign Teams");
  const gate = await holdLegacyAdminWrite(page, "teams", "POST", 1);
  try {
    await page
      .getByRole("textbox", { name: "Team name", exact: true })
      .fill("Old team");
    await page
      .getByRole("button", { name: "Create Team", exact: true })
      .press("Enter");
    await expect.poll(() => gate.requests.length).toBe(1);
    await page
      .getByRole("button", { name: "👥 Players", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("heading", { name: "Players", exact: true }),
    ).toBeVisible();
    await showTeams(page);
    await page
      .getByRole("textbox", { name: "Team name", exact: true })
      .fill("  Fresh team  ");
    await page
      .getByRole("button", { name: "Create Team", exact: true })
      .press("Enter");
    await expect.poll(() => gate.requests.length).toBe(2);
    await gate.settle(0);
    expect(alerts).toEqual([]);
    await expect(
      page.getByRole("button", { name: "Creating...", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Team name", exact: true }),
    ).toHaveValue("  Fresh team  ");
    gate.release(1);
    await expect(
      page.getByRole("textbox", { name: "Team name", exact: true }),
    ).toHaveValue("");
    expect(gate.requests.map((request) => request.body)).toEqual([
      { name: "Old team" },
      { name: "Fresh team" },
    ]);
  } finally {
    gate.release();
  }
});

for (const mode of ["score", "delete"] as const) {
  test(`late ${mode} failure stays out of the new tab`, async ({ page }) => {
    const { alerts } = await open(page, "👥 Players", "Players");
    const gate = await holdLegacyAdminWrite(
      page,
      mode === "score" ? "score_events" : "players",
      mode === "score" ? "POST" : "DELETE",
      1,
    );
    try {
      await page
        .getByRole("button", {
          name: mode === "score" ? "+5" : "Delete Player",
          exact: true,
        })
        .press("Enter");
      await expect.poll(() => gate.requests.length).toBe(1);
      await showTeams(page);
      await gate.settle();
      expect(alerts).toEqual([]);
      await expect(
        page.getByRole("textbox", { name: "Team name", exact: true }),
      ).toBeEnabled();
    } finally {
      gate.release();
    }
  });
}

test("late voting target failure stays out of the new tab", async ({
  page,
}) => {
  const { alerts } = await open(page, "🗳️ Voting", "Voting");
  const gate = await holdLegacyAdminWrite(page, "game_state", "PATCH", 1);
  try {
    await page
      .getByRole("combobox", { name: "Vote for", exact: true })
      .selectOption("team");
    await expect.poll(() => gate.requests.length).toBe(1);
    await showTeams(page);
    await gate.settle();
    expect(alerts).toEqual([]);
  } finally {
    gate.release();
  }
});

test("voting locks a duplicate while pending and recovers after a current failure", async ({
  page,
}) => {
  const { alerts, confirmations } = await open(page, "🗳️ Voting", "Voting");
  const gate = await holdLegacyAdminWrite(page, "game_state", "PATCH", 1);
  try {
    const button = page.getByRole("button", {
      name: "Open Voting",
      exact: true,
    });
    await button.press("Enter");
    await expect.poll(() => gate.requests.length).toBe(1);
    await button.press("Enter");
    await page.waitForTimeout(100);
    expect(gate.requests).toHaveLength(1);
    expect(confirmations).toHaveLength(1);
    await gate.settle();
    await expect
      .poll(() => alerts)
      .toEqual(["Could not open voting: Delayed operation denied"]);
    await button.press("Enter");
    await expect.poll(() => gate.requests.length).toBe(2);
    await gate.settle(1);
    expect(confirmations).toHaveLength(2);
    expect(gate.requests.map((request) => request.body)).toEqual([
      expect.objectContaining({
        voting_open: true,
        show_vote_results: false,
        slideshow_open: false,
      }),
      expect.objectContaining({
        voting_open: true,
        show_vote_results: false,
        slideshow_open: false,
      }),
    ]);
  } finally {
    gate.release();
  }
});

test("team assignment requests remain independent for different players", async ({
  page,
}) => {
  const fixture = await open(page, "🏁 Teams", "Assign Teams");
  fixture.backend.rows.players.push({
    id: "p2",
    name: "Sam",
    team: "Ducks",
    score: 0,
  });
  fixture.backend.rows.teams.push({ id: "t2", name: "Geese" });
  await page
    .getByRole("button", { name: "👥 Players", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "Players", exact: true }),
  ).toBeVisible();
  await showTeams(page);
  const gate = await holdLegacyAdminWrite(page, "players", "PATCH");
  try {
    const pat = page.getByRole("combobox", { name: "Team for Pat" }),
      sam = page.getByRole("combobox", { name: "Team for Sam" });
    await pat.selectOption("Geese");
    await expect(pat).toBeDisabled();
    await expect(sam).toBeEnabled();
    await sam.selectOption("Geese");
    await expect.poll(() => gate.requests.length).toBe(2);
    gate.release(0);
    await expect(pat).toBeEnabled();
    await expect(sam).toBeDisabled();
    gate.release(1);
    await expect(sam).toBeEnabled();
    await expect(pat).toHaveValue("Geese");
    await expect(sam).toHaveValue("Geese");
    expect(gate.requests).toEqual([
      { query: { id: "eq.p1" }, body: { team: "Geese" } },
      { query: { id: "eq.p2" }, body: { team: "Geese" } },
    ]);
  } finally {
    gate.release();
  }
});
