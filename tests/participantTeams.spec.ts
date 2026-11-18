import { expect, test, type Page } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";
import { seedParticipantTeams } from "./support/participantTeams";
import { activateByKeyboard, tabTo } from "./support/keyboard";

const chooseRpc = "cc_player_choose_session_team";
const createRpc = "cc_player_create_session_team";
const credentials = {
  p_join_code: "123456",
  p_player_token: "test-player-token",
};

function teamPanel(page: Page) {
  return page
    .getByRole("heading", { name: "Choose your team", exact: true })
    .locator("xpath=ancestor::section[1]");
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
});

test("lobby team capacity, pending locks and refresh preserve the selected team contract", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const { player, teams } = seedParticipantTeams(backend);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route(`**/rest/v1/rpc/${chooseRpc}`, async (route) => {
    calls += 1;
    await pending;
    await route.fallback();
  });
  try {
    await page.goto("#/play/123456");
    const panel = teamPanel(page);
    const alpha = panel.getByRole("button", { name: /Alpha 2\/2 players/ });
    const beta = panel.getByRole("button", { name: /Beta 1\/2 players/ });
    const gamma = panel.getByRole("button", { name: /Gamma Team full/ });
    await expect(alpha).toBeEnabled();
    await expect(gamma).toBeDisabled();
    await activateByKeyboard(page, beta);
    await expect(beta).toBeDisabled();
    await expect(alpha).toBeDisabled();
    await panel
      .getByRole("textbox", { name: "New team name" })
      .fill("Pending name");
    await page.keyboard.press("Enter");
    await expect.poll(() => calls).toBe(1);
    await expect(
      panel.getByRole("button", { name: "Create team", exact: true }),
    ).toBeDisabled();
    player.team_id = "beta";
    player.team_name = "Beta";
    teams[0].member_count = 1;
    teams[1].member_count = 2;
    release();
    await expect(
      panel.getByRole("button", { name: /Beta 2\/2 players/ }),
    ).toBeEnabled();
    await expect(
      panel.getByRole("textbox", { name: "New team name" }),
    ).toHaveValue("Pending name");
    expect(
      backend.requests.filter((request) => request.name === chooseRpc),
    ).toEqual([
      {
        name: chooseRpc,
        method: "POST",
        body: { ...credentials, p_team_id: "beta" },
      },
    ]);
    expect(
      backend.requests.filter((request) => request.name === createRpc),
    ).toEqual([]);
    backend.verify();
  } finally {
    release();
  }
});

test("team creation keeps failed input, trims the RPC name and clears it after a successful retry", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const { player, teams } = seedParticipantTeams(backend, {
    selectedTeamId: null,
  });
  backend.failures.add(createRpc);
  await page.goto("#/play/123456");
  const panel = teamPanel(page);
  const name = panel.getByRole("textbox", { name: "New team name" });
  const create = panel.getByRole("button", {
    name: "Create team",
    exact: true,
  });
  await expect(name).toHaveAttribute("maxlength", "40");
  await name.fill("   ");
  await expect(create).toBeDisabled();
  await page.keyboard.press("Enter");
  expect(
    backend.requests.filter((request) => request.name === createRpc),
  ).toEqual([]);
  await name.fill("  Night Owls  ");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(name).toHaveValue("  Night Owls  ");
  await expect(create).toBeEnabled();
  backend.failures.delete(createRpc);
  teams.push({ id: "owls", name: "Night Owls", member_count: 1 });
  player.team_id = "owls";
  player.team_name = "Night Owls";
  await activateByKeyboard(page, create);
  await expect(name).toHaveValue("");
  await expect(
    panel.getByRole("button", { name: /Night Owls 1\/2 players/ }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const expected = {
    name: createRpc,
    method: "POST",
    body: { ...credentials, p_team_name: "Night Owls" },
  };
  expect(
    backend.requests.filter((request) => request.name === createRpc),
  ).toEqual([expected, expected]);
  backend.verify();
});

test("a failed team change preserves the current team and makes no success refresh", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedParticipantTeams(backend);
  backend.failures.add(chooseRpc);
  await page.goto("#/play/123456");
  const panel = teamPanel(page);
  await expect(panel).toBeVisible();
  const reads = backend.requests.filter(
    (request) => request.name === "cc_get_game_session_view",
  ).length;
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: /Beta 1\/2 players/ }),
  );
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(
    panel.getByRole("button", { name: /Alpha 2\/2 players/ }),
  ).toBeEnabled();
  await expect(
    panel.getByRole("button", { name: /Beta 1\/2 players/ }),
  ).toBeEnabled();
  expect(
    backend.requests.filter(
      (request) => request.name === "cc_get_game_session_view",
    ),
  ).toHaveLength(reads);
  expect(
    backend.requests.filter((request) => request.name === chooseRpc),
  ).toEqual([
    {
      name: chooseRpc,
      method: "POST",
      body: { ...credentials, p_team_id: "beta" },
    },
  ]);
  backend.verify();
});

test("an unassigned live player chooses a team and returns to the shared challenge", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const { player } = seedParticipantTeams(backend, {
    status: "live",
    selectedTeamId: null,
  });
  await page.route(`**/rest/v1/rpc/${chooseRpc}`, async (route) => {
    player.team_id = "beta";
    player.team_name = "Beta";
    await route.fallback();
  });
  await page.goto("#/play/123456");
  await activateByKeyboard(
    page,
    teamPanel(page).getByRole("button", { name: /Beta 1\/2 players/ }),
  );
  await expect(
    page.getByRole("heading", { name: "Choose your team", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/play\/123456$/);
  expect(
    backend.requests.filter((request) => request.name === chooseRpc),
  ).toEqual([
    {
      name: chooseRpc,
      method: "POST",
      body: { ...credentials, p_team_id: "beta" },
    },
  ]);
  backend.verify();
});

test("shared team references select and create by keyboard with local busy state only", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const choices = page
    .getByRole("heading", {
      name: "Shared team choices and participant name form",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  await expect(
    choices.getByRole("button", { name: /Gamma Team full/ }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    choices.getByRole("button", { name: /Beta 1\/2 players/ }),
  );
  await expect(
    choices.getByText("Selected sample team: Beta.", { exact: true }),
  ).toBeVisible();
  const name = choices.getByRole("textbox", {
    name: "New team name",
    exact: true,
  });
  await tabTo(page, name);
  await page.keyboard.type("  Local Owls  ");
  await page.keyboard.press("Enter");
  await expect(
    choices.getByText("Created sample team: Local Owls.", { exact: true }),
  ).toBeVisible();
  await expect(name).toHaveValue("");
  const busy = choices.getByRole("checkbox", {
    name: "Sample team operation pending",
    exact: true,
  });
  await tabTo(page, busy, "backward");
  await page.keyboard.press("Space");
  await expect(
    choices.getByRole("button", { name: /Beta 1\/2 players/ }),
  ).toBeDisabled();
  await tabTo(page, name);
  await page.keyboard.type("Still editable");
  await expect(
    choices.getByRole("button", { name: "Create sample team", exact: true }),
  ).toBeDisabled();
  await tabTo(page, busy, "backward");
  await page.keyboard.press("Space");
  const lobby = page
    .getByRole("heading", { name: "Shared lobby team name form", exact: true })
    .locator("xpath=ancestor::article[1]");
  const lobbyName = lobby.getByRole("textbox", {
    name: "New team name",
    exact: true,
  });
  await tabTo(page, lobbyName);
  await page.keyboard.type("  Local hosts  ");
  await page.keyboard.press("Enter");
  await expect(
    lobby.getByText("Added sample lobby team: Local hosts.", { exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});
