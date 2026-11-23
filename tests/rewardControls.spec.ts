import { expect, test } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedRewardControls } from "./support/rewardControls";

for (const [method, label, teamsEnabled] of [
  ["voting", "Vote", false],
  ["host_awards", "Host choose", true],
  ["audience_cheers", "Audience cheers", false],
] as const) {
  test(`${method} review uses current challenge settings in the start payload`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    backend.challenges[0].points = 45;
    backend.session.teams_enabled = teamsEnabled;
    backend.rows.host_games = [
      { id: "test-plan", plan_data: { decideRewardInGame: true } },
    ];
    if (teamsEnabled)
      backend.rows.cc_game_session_teams = [
        { id: "team-1", session_id: "test-session", name: "Team Chaos" },
      ];
    backend.responses.cc_host_start_session_reward_round = {
      reward_method: method,
    };
    await page.goto("#/host/live/test-session");
    await page.getByRole("button", { name: "Host", exact: true }).click();
    await page
      .getByRole("region", { name: "Host controls", exact: true })
      .getByRole("button", { name: "Review", exact: true })
      .click();
    const panel = page.getByRole("dialog", {
      name: "Review points and voting",
      exact: true,
    });
    await expect(panel.getByText("Round 1 · Make an entrance")).toBeVisible();
    await expect(
      panel.getByRole("combobox", { name: "Challenge" }),
    ).toHaveCount(0);
    const settings = panel.getByLabel("Reward settings");
    await expect(settings).toContainText(
      teamsEnabled ? "Teams" : "Individual players",
    );
    await expect(settings).toContainText("45");
    await expect(settings.getByRole("combobox")).toHaveCount(0);
    await expect(settings.getByRole("spinbutton")).toHaveCount(0);
    const methods = panel.getByRole("group", {
      name: "Choose a reward method",
    });
    for (const name of ["Host choose", "Audience cheers", "Vote"]) {
      const option = methods.getByRole("button", { name, exact: true });
      await expect(option).toBeVisible();
      await expect
        .poll(() =>
          option
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      const box = await option.boundingBox();
      expect(box).not.toBeNull();
      if (box) expect(Math.abs(box.width - box.height)).toBeLessThan(2);
    }
    if (method === "voting")
      await page.screenshot({
        path: test.info().outputPath("round-review.png"),
      });
    await activateByKeyboard(
      page,
      methods.getByRole("button", { name: label, exact: true }),
    );
    await expect(
      methods.getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await activateByKeyboard(
      page,
      panel.getByRole("button", { name: "Start reward flow", exact: true }),
    );
    await expect
      .poll(
        () =>
          backend.requests.filter(
            (r) => r.name === "cc_host_start_session_reward_round",
          ).length,
      )
      .toBe(1);
    expect(
      backend.requests.find(
        (r) => r.name === "cc_host_start_session_reward_round",
      )?.body,
    ).toEqual({
      p_session_id: "test-session",
      p_challenge_id: "test-challenge",
      p_reward_method: method,
      p_target_kind: teamsEnabled ? "team" : "player",
      p_points: 45,
    });
    backend.verify();
  });
}

test("review retains enabled-method selection when the plan does not choose in game", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { decideRewardInGame: false } },
  ];
  backend.session.reward_methods = ["voting", "host_awards"];
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("region", { name: "Host controls" })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "Review points and voting" });
  await expect(
    panel.getByRole("combobox", { name: "Reward method" }).locator("option"),
  ).toHaveCount(2);
  await expect(
    panel.getByRole("group", { name: "Choose a reward method" }),
  ).toHaveCount(0);
  backend.verify();
});

test("review allows overriding target and points while preserving defaults on reopening", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.session.teams_enabled = true;
  backend.rows.cc_game_session_teams = [
    { id: "team-1", session_id: "test-session", name: "Team Chaos" },
  ];
  backend.responses.cc_host_start_session_reward_round = {
    reward_method: "voting",
  };
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  const trigger = page
    .getByRole("region", { name: "Host controls" })
    .getByRole("button", { name: "Review", exact: true });
  await activateByKeyboard(page, trigger);
  const panel = page.getByRole("dialog", { name: "Review points and voting" });
  const target = panel.getByRole("combobox", { name: "Rewarding" });
  const points = panel.getByRole("spinbutton", { name: "Points per winner" });
  const settings = panel.getByLabel("Reward settings");
  await expect(settings).toContainText("Teams");
  await expect(settings).toContainText("20");
  await expect(target).toHaveCount(0);
  await activateByKeyboard(
    page,
    settings.getByRole("button", { name: "Edit reward settings" }),
  );
  await expect(target).toHaveValue("team");
  await expect(points).toHaveValue("20");
  await tabTo(page, target);
  await page.keyboard.press("i");
  await expect(target).toHaveValue("player");
  await tabTo(page, points);
  await points.fill("-1");
  await activateByKeyboard(
    page,
    settings.getByRole("button", { name: "Done reward settings" }),
  );
  await expect(points).toBeVisible();
  await expect(points).toBeFocused();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("37");
  const reads = backend.requests.filter(
    (r) => r.name === "cc_game_session_challenges" && r.method === "GET",
  ).length;
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_session_challenges" && r.method === "GET",
        ).length,
      { timeout: 10000 },
    )
    .toBeGreaterThan(reads);
  await expect(target).toHaveValue("player");
  await expect(points).toHaveValue("37");
  await activateByKeyboard(
    page,
    settings.getByRole("button", { name: "Done reward settings" }),
  );
  await expect(target).toHaveCount(0);
  await expect(settings).toContainText("Individual players");
  await expect(settings).toContainText("37");
  await page.keyboard.press("Escape");
  await activateByKeyboard(page, trigger);
  await expect(settings).toContainText("Teams");
  await expect(settings).toContainText("20");
  await activateByKeyboard(
    page,
    settings.getByRole("button", { name: "Edit reward settings" }),
  );
  await expect(target).toHaveValue("team");
  await expect(points).toHaveValue("20");
  await tabTo(page, target);
  await page.keyboard.press("i");
  await tabTo(page, points);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("0");
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Start reward flow" }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_start_session_reward_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_host_start_session_reward_round",
    )?.body,
  ).toEqual({
    p_session_id: "test-session",
    p_challenge_id: "test-challenge",
    p_reward_method: "voting",
    p_target_kind: "player",
    p_points: 0,
  });
  backend.verify();
});

test("in-game choice respects disabled methods and requires teams for a team game", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { decideRewardInGame: true } },
  ];
  backend.session.teams_enabled = true;
  backend.session.reward_methods = ["voting"];
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("region", { name: "Host controls" })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "Review points and voting" });
  const methods = panel.getByRole("group", { name: "Choose a reward method" });
  await expect(
    methods.getByRole("button", { name: "Host choose" }),
  ).toBeDisabled();
  await expect(
    methods.getByRole("button", { name: "Audience cheers" }),
  ).toBeDisabled();
  await expect(methods.getByRole("button", { name: "Vote" })).toBeEnabled();
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Edit reward settings" }),
  );
  await expect(
    panel
      .getByRole("combobox", { name: "Rewarding" })
      .locator('option[value="team"]'),
  ).toHaveJSProperty("disabled", true);
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Start reward flow" }),
  );
  await expect(panel.getByRole("alert")).toContainText(
    "Create teams before rewarding a team.",
  );
  expect(
    backend.requests.filter(
      (r) => r.name === "cc_host_start_session_reward_round",
    ),
  ).toEqual([]);
  backend.verify();
});

test("reward choices remain square and readable at a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const backend = await installSessionBackend(page, { host: true });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { decideRewardInGame: true } },
  ];
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("region", { name: "Host controls" })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "Review points and voting" });
  const methods = panel.getByRole("group", { name: "Choose a reward method" });
  await expect(methods).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("round-review.png") });
  const summary = panel.getByLabel("Reward settings");
  const target = await summary.getByText("Rewarding").boundingBox();
  const points = await summary.getByText("Points per winner").boundingBox();
  expect(target).not.toBeNull();
  expect(points).not.toBeNull();
  await activateByKeyboard(
    page,
    summary.getByRole("button", { name: "Edit reward settings" }),
  );
  const targetControl = summary.getByRole("combobox", { name: "Rewarding" });
  const targetBox = await targetControl.boundingBox();
  expect(targetBox?.width).toBeGreaterThan(150);
  const boxes = await Promise.all(
    ["Host choose", "Audience cheers", "Vote"].map((name) =>
      methods.getByRole("button", { name, exact: true }).boundingBox(),
    ),
  );
  for (const box of boxes) {
    expect(box).not.toBeNull();
    if (box) expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  }
  if (boxes[0] && boxes[1] && boxes[2]) {
    expect(boxes[0].y).toBe(boxes[1].y);
    expect(boxes[1].y).toBe(boxes[2].y);
  }
  backend.verify();
});

test("local reward example changes methods by keyboard without backend access", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const methods = page.getByRole("group", { name: "Choose a reward method" });
  const host = methods.getByRole("button", { name: "Host choose" });
  await activateByKeyboard(page, host);
  await expect(host).toHaveAttribute("aria-pressed", "true");
  await expect(methods.getByRole("button", { name: "Vote" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const sample = page.getByRole("region", { name: "Local reward primitives" });
  await activateByKeyboard(
    page,
    sample.getByRole("button", { name: "Edit reward settings" }),
  );
  await sample
    .getByRole("combobox", { name: "Rewarding" })
    .selectOption("team");
  await sample
    .getByRole("spinbutton", { name: "Points per winner", exact: true })
    .fill("35");
  await activateByKeyboard(
    page,
    sample.getByRole("button", { name: "Start reward flow" }),
  );
  await expect(
    sample.getByText("Sample reward: team, 35 points."),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

for (const method of ["host_awards", "audience_cheers"] as const) {
  for (const target of ["player", "team"] as const) {
    test(`${method} ${target} award preserves selection, cancellation and points payload`, async ({
      page,
    }) => {
      const backend = await installSessionBackend(page, { host: true });
      seedRewardControls(backend, method, target);
      backend.responses.cc_host_complete_session_reward_round = {
        winner_count: target === "team" ? 1 : 2,
        points_awarded: 37,
      };
      await page.goto("#/host/live/test-session");
      await page.getByRole("button", { name: "Host", exact: true }).click();
      await page
        .getByRole("button", { name: "Continue reward flow", exact: true })
        .click();
      const panel = page.getByRole("dialog", {
        name: "Review points and voting",
        exact: true,
      });
      const confirm = panel.getByRole("button", {
        name: "Confirm winners & award points",
        exact: true,
      });
      await expect(confirm).toBeDisabled();
      const first = panel.getByRole("button", {
        name: `Select winner ${target === "team" ? "Team Chaos" : "Pat"}`,
        exact: true,
      });
      await activateByKeyboard(page, first);
      await expect(first).toHaveAttribute("aria-pressed", "true");
      if (target === "player")
        await activateByKeyboard(
          page,
          panel.getByRole("button", { name: "Select winner Sam", exact: true }),
        );
      await panel
        .getByRole("spinbutton", {
          name: "Points to award each winner",
          exact: true,
        })
        .fill("37");
      const confirmations: string[] = [];
      page.once("dialog", (dialog) => {
        confirmations.push(dialog.message());
        void dialog.dismiss();
      });
      await activateByKeyboard(page, confirm);
      expect(
        backend.requests.filter(
          (r) => r.name === "cc_host_complete_session_reward_round",
        ),
      ).toHaveLength(0);
      page.once("dialog", (dialog) => {
        confirmations.push(dialog.message());
        void dialog.accept();
      });
      await page.keyboard.press("Enter");
      await expect
        .poll(
          () =>
            backend.requests.filter(
              (r) => r.name === "cc_host_complete_session_reward_round",
            ).length,
        )
        .toBe(1);
      const confirmation = `Award 37 points to ${target === "team" ? "1 selected winner" : "2 selected winners"}?`;
      expect(confirmations).toEqual([confirmation, confirmation]);
      expect(
        backend.requests.find(
          (r) => r.name === "cc_host_complete_session_reward_round",
        )?.body,
      ).toEqual({
        p_reward_round_id: "reward-1",
        p_winner_player_ids: target === "player" ? ["test-player", "sam"] : [],
        p_winner_team_ids: target === "team" ? ["team-1"] : [],
        p_points: 37,
      });
      backend.verify();
    });
  }
}

test("published reward can return everyone to the game with the existing release command", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  seedRewardControls(backend, "host_awards", "player", "completed");
  backend.responses.cc_host_release_session_reward_round = null;
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue reward flow", exact: true })
    .click();
  const panel = page.getByRole("dialog", {
    name: "Review points and voting",
    exact: true,
  });
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Return everyone to game", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_release_session_reward_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_host_release_session_reward_round",
    )?.body,
  ).toEqual({ p_reward_round_id: "reward-1" });
  await expect(panel).toHaveCount(0);
  backend.verify();
});
