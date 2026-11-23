import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedHostRoundControls } from "./support/hostRoundControls";

async function openRounds(
  page: Page,
  options: Parameters<typeof seedHostRoundControls>[1] = {},
) {
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, options);
  if (options.onBreak)
    await page.addInitScript(() => {
      localStorage.setItem(
        "chaos-crawl-host-round-clock:test-session:1",
        JSON.stringify({
          seconds: 60,
          running: true,
          onBreak: true,
          resumeRound: 2,
          updatedAt: Date.now(),
        }),
      );
    });
  await page.goto("#/host/live/test-session");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  const plan = page.locator(".content-panel").filter({
    has: page.getByRole("heading", { name: "Control overrides", exact: true }),
  });
  return { backend, plan };
}

for (const currentRound of [1, 2]) {
  test(`overrides change rounds ${currentRound === 1 ? "forward" : "backward"} with the existing payload`, async ({
    page,
  }) => {
    const { backend, plan } = await openRounds(page, { currentRound });
    await plan.getByLabel("Choose round").selectOption({
      label:
        currentRound === 1
          ? "Round 2 · Second entrance"
          : "Round 1 · Make an entrance",
    });
    page.on("dialog", (dialog) => void dialog.accept());
    let release = () => {};
    let requests = 0;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "**/rest/v1/rpc/cc_host_set_game_session_round",
      async (route) => {
        requests += 1;
        await pending;
        await route.fallback();
      },
    );
    try {
      const target = plan.getByRole("button", { name: "Change round" });
      await activateByKeyboard(page, target);
      await expect(target).toBeDisabled();
      await expect(plan.getByLabel("Choose round")).toBeDisabled();
      await page.keyboard.press("Enter");
      expect(requests).toBe(1);
    } finally {
      release();
    }
    await expect
      .poll(
        () =>
          backend.requests.filter(
            (r) => r.name === "cc_host_set_game_session_round",
          ).length,
      )
      .toBe(1);
    expect(
      backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
        ?.body,
    ).toEqual({
      p_session_id: "test-session",
      p_round_number: currentRound === 1 ? 2 : 1,
    });
    backend.verify();
  });
}

test("overrides retain autoplay confirmation before changing the round", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page, { autoplay: true });
  await plan.getByLabel("Choose round").selectOption("round-2");
  page.on("dialog", (dialog) => void dialog.accept());
  const next = plan.getByRole("button", { name: "Change round" });
  await activateByKeyboard(page, next);
  const modal = page.getByRole("alertdialog", {
    name: "Override autoplay?",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(next).toBeFocused();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  await activateByKeyboard(page, next);
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Override & move round", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_set_game_session_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
      ?.body,
  ).toEqual({ p_session_id: "test-session", p_round_number: 2 });
  backend.verify();
});

test("direct round override bypasses a planned break", async ({ page }) => {
  const { backend, plan } = await openRounds(page, { breakMinutes: 5 });
  await plan.getByLabel("Choose round").selectOption("round-2");
  page.once("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: "Change round" }),
  );
  await expect
    .poll(
      () =>
        backend.requests.find(
          (request) => request.name === "cc_host_set_game_session_round",
        )?.body,
    )
    .toEqual({ p_session_id: "test-session", p_round_number: 2 });
  expect(
    backend.requests.some(
      (request) =>
        request.name === "cc_game_session_timers" &&
        typeof request.body === "object" &&
        request.body !== null &&
        "is_on_break" in request.body &&
        request.body.is_on_break === true,
    ),
  ).toBe(false);
  backend.verify();
});

test("game controls preserve a planned break before advancing", async ({
  page,
}) => {
  const { backend } = await openRounds(page, { breakMinutes: 1 });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Game", exact: true }),
  );
  await expect(
    page
      .getByRole("region", { name: "Host controls" })
      .getByText("Up next: Break · 1 minutes"),
  ).toBeVisible();
  const preview = page.locator("article").filter({
    has: page.getByText("▶ NEXT UP · BREAK · 1 MIN", { exact: true }),
  });
  await expect(
    preview.getByText("Break · 1 minutes", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByText("After the break: Second entrance", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "Edit next challenge", exact: true }),
  ).toBeVisible();
  page.on("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(
    page,
    page
      .getByRole("region", { name: "Host controls" })
      .getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "BREAK IN PROGRESS", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toHaveLength(0);
  const writes = backend.requests.filter(
    (r) => r.name === "cc_game_session_timers" && r.method === "POST",
  );
  expect(
    writes.some(
      (r) =>
        typeof r.body === "object" &&
        r.body !== null &&
        "is_on_break" in r.body &&
        r.body.is_on_break === true &&
        "resume_round_number" in r.body &&
        r.body.resume_round_number === 2,
    ),
  ).toBe(true);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Start Now", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_set_game_session_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
      ?.body,
  ).toEqual({ p_session_id: "test-session", p_round_number: 2 });
  backend.verify();
});

test("active break shows its own controls and the next challenge", async ({
  page,
}) => {
  const { backend } = await openRounds(page, {
    onBreak: true,
    breakMinutes: 1,
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Game", exact: true }),
  );
  const breakPanel = page.locator(".host-break-panel");
  await expect(breakPanel.getByText("Take a breather")).toBeVisible();
  await expect(
    breakPanel.getByRole("heading", { name: "Second entrance" }),
  ).toBeVisible();
  backend.verify();
});

test("completed overrides prevent changing rounds or editing challenges", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page, { completed: true });
  await plan.getByLabel("Choose round").selectOption("round-2");
  await expect(
    plan.getByRole("button", { name: "Change round" }),
  ).toBeDisabled();
  await expect(
    plan.getByRole("button", { name: "Edit selected challenge" }),
  ).toBeDisabled();
  await expect(
    plan.getByRole("button", { name: "Open memories and social assets" }),
  ).toBeVisible();
  await expect(
    page.getByText(/▶ NEXT CHALLENGE|▶ NEXT UP|BREAK IN PROGRESS/),
  ).toHaveCount(0);
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  backend.verify();
});

test("overrides edit and run the timer and open challenge review", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page);
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: "Start timer", exact: true }),
  );
  await expect(plan.getByRole("button", { name: "Pause timer" })).toBeVisible();
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: "Edit timer" }),
  );
  const dialog = page.getByRole("dialog", { name: "Edit round timer" });
  await dialog.getByLabel("Minutes remaining").fill("3");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Save timer" }),
  );
  await expect(dialog).toHaveCount(0);
  await expect
    .poll(() =>
      backend.requests.some(
        (request) =>
          request.name === "cc_game_session_timers" &&
          request.method === "POST" &&
          typeof request.body === "object" &&
          request.body !== null &&
          "remaining_seconds" in request.body &&
          request.body.remaining_seconds === 180 &&
          "is_running" in request.body &&
          request.body.is_running === true,
      ),
    )
    .toBe(true);
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: "Review or open challenge voting" }),
  );
  await expect(
    page.getByRole("heading", { name: "Review points" }),
  ).toBeVisible();
  const challenge = page.getByRole("combobox", { name: /^Challenge/ });
  await challenge.selectOption("round-2");
  await expect(challenge).toHaveValue("round-2");
  backend.verify();
});

test("finish action opens memories only after the backend confirms completion", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page);
  page.on("dialog", (dialog) => void dialog.accept());
  backend.failures.add("cc_host_complete_game_session");
  const finish = plan.getByRole("button", {
    name: "Finish game and open end phase",
  });
  await activateByKeyboard(page, finish);
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(finish).toBeVisible();
  backend.failures.delete("cc_host_complete_game_session");
  await activateByKeyboard(page, finish);
  await expect(page.getByRole("tab", { name: "Memories" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("heading", { name: /memories/i })).toBeVisible();
  backend.verify();
});

test("override shortcuts preserve keyboard focus on the destination tab", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page);
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: "View all challenges and times" }),
  );
  const schedule = page.getByRole("tab", {
    name: "Game schedule",
    exact: true,
  });
  await expect(schedule).toBeFocused();
  await expect(schedule).toHaveAttribute("aria-selected", "true");
  backend.verify();
});

test("shared stage/plan reference selects local rounds and preserves read-only and break states", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const exampleHeading = page.getByRole("heading", {
    name: "Shared stage preview and round plan",
    exact: true,
  });
  const example = page
    .locator("article.component-example")
    .filter({ has: exampleHeading });
  const second = example.getByRole("button", { name: /Team portrait.*40 pts/ });
  await second.click();
  await expect(second).toBeDisabled();
  await expect(example.getByRole("status")).toHaveText(
    "Sample plan round 2 selected locally.",
  );
  await example
    .getByRole("checkbox", { name: "Sample round plan read-only", exact: true })
    .check();
  await expect(
    example.getByRole("button", { name: /Make an entrance.*20 pts/ }),
  ).toBeDisabled();
  await expect(second).toBeDisabled();
  await example
    .getByRole("checkbox", { name: "Sample round plan read-only", exact: true })
    .uncheck();
  await example
    .getByRole("button", { name: "Edit sample stage", exact: true })
    .click();
  await expect(example.getByRole("status")).toHaveText(
    "Sample stage edit selected locally.",
  );
  await example
    .getByRole("checkbox", { name: "Sample stage break active", exact: true })
    .check();
  await expect(
    example.getByText("Round 2 follows the break", { exact: true }),
  ).toBeVisible();
  await expect(
    example.getByRole("button", { name: "Edit sample stage", exact: true }),
  ).toHaveCount(0);
  const breakPanel = example.locator(".host-break-panel");
  await expect(
    breakPanel.getByRole("region", { name: /Next main challenge/ }),
  ).toContainText("Team portrait");
  await expect(breakPanel.getByText("Equipment: Camera, Props")).toBeVisible();
  await breakPanel.getByRole("button", { name: "Edit challenge" }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Sample challenge edit selected locally.",
  );
  await breakPanel.locator("summary").click();
  await breakPanel.getByRole("button", { name: "Pause break" }).click();
  await expect(breakPanel.getByText("PAUSED", { exact: true })).toBeVisible();
  await breakPanel.getByRole("button", { name: "Start next round" }).click();
  await expect(example.getByRole("status")).toHaveText(
    "Sample next round started locally.",
  );
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("override reference changes local state without backend requests", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page.locator("article.component-example").filter({
    has: page.getByRole("heading", {
      name: "Host control overrides",
      exact: true,
    }),
  });
  await example.getByLabel("Choose round").selectOption("two");
  page.once("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Change round" }),
  );
  await expect(example.getByText("Sample round 2 selected.")).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Start timer", exact: true }),
  );
  await expect(
    example.getByRole("button", { name: "Pause timer" }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("game host controls identify the next challenge or planned break", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend);
  await page.goto("#/host/live/test-session");
  const controls = page.getByRole("region", { name: "Host controls" });
  await expect(controls.getByText("Up next: Second entrance")).toBeVisible();
  backend.verify();
});

for (const participating of [false, true]) {
  test(`game break controls work for a ${participating ? "participating" : "non-participating"} host`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const backend = await installSessionBackend(page, { host: true });
    seedHostRoundControls(backend, { onBreak: true, breakMinutes: 1 });
    backend.rows.host_games = [
      {
        id: "test-plan",
        plan_data: {
          breakMinutes: 1,
          selectedTasks: [
            {
              id: "first-task",
              title: "Make an entrance",
              equipment: ["Wrong item"],
            },
            {
              id: "next-task",
              title: "Second entrance",
              equipment: ["Camera", "Props"],
              setup: "Choose a photo spot.",
              prep: "Gather everyone.",
            },
          ],
          schedule: [
            {
              type: "challenge",
              title: "Make an entrance",
              duration: 5,
              taskId: "first-task",
            },
            {
              type: "challenge",
              title: "Second entrance",
              duration: 5,
              taskId: "next-task",
            },
          ],
        },
      },
    ];
    if (participating) {
      backend.session.host_participates = true;
      backend.session.host_player_id = backend.hostPlayer.id;
      // The participant's independent timer can lag behind the host's clock.
      backend.timer.is_on_break = false;
      backend.rows.cc_game_session_timers = [{ ...backend.timer }];
    }
    await page.addInitScript(
      ({ participating }) => {
        localStorage.setItem(
          "chaos-crawl-host-round-clock:test-session:1",
          JSON.stringify({
            seconds: 60,
            running: true,
            onBreak: true,
            resumeRound: 2,
            updatedAt: Date.now(),
          }),
        );
        if (participating)
          localStorage.setItem(
            "chaos-crawl-host-player:test-session",
            "host-player-token",
          );
      },
      { participating },
    );
    await page.goto("#/host/live/test-session");
    const breakPanel = page.locator(".host-break-panel");
    await expect(breakPanel.getByText("Take a breather")).toBeVisible();
    const next = breakPanel.getByRole("region", {
      name: /Next main challenge/,
    });
    await expect(
      next.getByRole("heading", { name: "Second entrance" }),
    ).toBeVisible();
    await expect(next.getByText("Follow the next challenge.")).toBeVisible();
    await expect(next.getByText("+40 POINTS")).toBeVisible();
    await expect(next.getByText("ROUND 2 / 2")).toBeVisible();
    await expect(next.getByText("ROUND LENGTH")).toBeVisible();
    await expect(next.getByText("Equipment: Camera, Props")).toBeVisible();
    await expect(next.getByText("Setup: Choose a photo spot.")).toBeVisible();
    await expect(next.getByText("Preparation: Gather everyone.")).toBeVisible();
    const challengeEdit = next.getByRole("button", { name: "Edit challenge" });
    await activateByKeyboard(page, challengeEdit);
    const challengeDialog = page.getByRole("dialog", {
      name: "Update challenge",
    });
    const equipment = challengeDialog.getByRole("textbox", {
      name: /Equipment needed/,
    });
    await expect(equipment).toHaveValue("Camera, Props");
    await equipment.fill("Lights, Tripod");
    await activateByKeyboard(
      page,
      challengeDialog.getByRole("button", { name: "Save challenge" }),
    );
    await expect(challengeDialog).toHaveCount(0);
    await expect(challengeEdit).toBeFocused();
    await expect(next.getByText("Equipment: Lights, Tripod")).toBeVisible();
    expect(
      backend.requests.find(
        (request) =>
          request.name === "host_games" && request.method === "PATCH",
      )?.body,
    ).toMatchObject({
      plan_data: {
        selectedTasks: [
          { id: "first-task", equipment: ["Wrong item"] },
          { id: "next-task", equipment: ["Lights", "Tripod"] },
        ],
      },
    });
    const controls = page.getByRole("region", { name: "Host controls" });
    await expect(controls.getByText("Up next: Second entrance")).toBeVisible();
    await expect(controls.getByText("Edit break timer")).toHaveCount(0);
    await expect(
      controls.getByLabel("Host control recovery actions"),
    ).toHaveCount(0);
    const menu = breakPanel.locator("summary");
    await activateByKeyboard(page, menu);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await activateByKeyboard(page, menu);
    await activateByKeyboard(
      page,
      breakPanel.getByRole("button", { name: "Pause break" }),
    );
    await expect(breakPanel.getByText("PAUSED", { exact: true })).toBeVisible();
    const edit = breakPanel.getByRole("button", { name: "Edit break timer" });
    await activateByKeyboard(page, edit);
    const dialog = page.getByRole("dialog", {
      name: "Edit the time until the next round",
    });
    const minutes = dialog.getByRole("spinbutton", { name: "Break minutes" });
    await expect(minutes).toBeFocused();
    await minutes.fill("2");
    await activateByKeyboard(
      page,
      dialog.getByRole("button", { name: "Save timer" }),
    );
    await expect(dialog).toHaveCount(0);
    await expect(edit).toBeFocused();
    await expect
      .poll(() =>
        backend.requests.some(
          (request) =>
            request.name === "cc_game_session_timers" &&
            request.method === "POST" &&
            typeof request.body === "object" &&
            request.body !== null &&
            "remaining_seconds" in request.body &&
            request.body.remaining_seconds === 120 &&
            "is_running" in request.body &&
            request.body.is_running === false,
        ),
      )
      .toBe(true);
    await activateByKeyboard(
      page,
      breakPanel.getByRole("button", { name: "Start next round" }),
    );
    await expect
      .poll(
        () =>
          backend.requests.find(
            (request) => request.name === "cc_host_set_game_session_round",
          )?.body,
      )
      .toEqual({ p_session_id: "test-session", p_round_number: 2 });
    await expect(breakPanel).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Game", exact: true }),
    ).toBeFocused();
    backend.verify();
  });
}

test("break advancement failure stays visible and allows a retry", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, { onBreak: true });
  backend.failures.add("cc_host_set_game_session_round");
  await page.addInitScript(() => {
    localStorage.setItem(
      "chaos-crawl-host-round-clock:test-session:1",
      JSON.stringify({
        seconds: 60,
        running: false,
        onBreak: true,
        resumeRound: 2,
      }),
    );
  });
  await page.goto("#/host/live/test-session");
  const panel = page.locator(".host-break-panel");
  await expect(panel.getByText("Equipment: Not specified")).toBeVisible();
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Edit challenge" }),
  );
  const challengeDialog = page.getByRole("dialog", {
    name: "Update challenge",
  });
  await expect(
    challengeDialog.getByRole("textbox", { name: /Equipment needed/ }),
  ).toBeDisabled();
  await expect(
    challengeDialog.getByText(/isn't linked to a saved plan/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await activateByKeyboard(page, panel.locator("summary"));
  const start = panel.getByRole("button", { name: "Start next round" });
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/rest/v1/rpc/cc_host_set_game_session_round",
    async (route) => {
      await pending;
      await route.fallback();
    },
  );
  try {
    await activateByKeyboard(page, start);
    await expect(start).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await expect(start).toBeEnabled();
  backend.failures.delete("cc_host_set_game_session_round");
  await activateByKeyboard(page, start);
  await expect(panel).toHaveCount(0);
  backend.verify();
});
