import { expect, test, type Page, type Locator } from "@playwright/test";
import { installSessionBackend, sessionId } from "./support/sessionBackend";
import { activateByKeyboard, tabTo } from "./support/keyboard";

async function openHost(
  page: Page,
  { autoplay = false, lobby = false, onBreak = false } = {},
) {
  const backend = await installSessionBackend(page, { host: true, lobby });
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    round_number: 2,
    sort_order: 3,
  });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { autoplay, breakMinutes: 1 } },
  ];
  await page.addInitScript(
    ({ onBreak, lobby }) => {
      if (lobby)
        localStorage.setItem("chaos-crawl-host-flow:test-session", "6");
      if (onBreak)
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
    },
    { onBreak, lobby },
  );
  await page.goto(`#/host/live/${sessionId}`);
  if (!lobby)
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Host", exact: true }),
    );
  return backend;
}

async function expectModalKeyboard(
  page: Page,
  modal: Locator,
  first: Locator,
  last: Locator,
  trigger: Locator,
) {
  await expect(modal).toBeVisible();
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function openBreakMenu(page: Page) {
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Game", exact: true }),
  );
  await activateByKeyboard(page, page.locator(".host-break-panel summary"));
}

test("round override is a keyboard modal and cancellation never advances the round", async ({
  page,
}) => {
  const backend = await openHost(page, { autoplay: true });
  const trigger = page
    .getByRole("region", { name: "Host controls", exact: true })
    .getByRole("button", { name: "Next", exact: true });
  page.once("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("alertdialog", {
    name: "Override autoplay?",
    exact: true,
  });
  await expectModalKeyboard(
    page,
    modal,
    modal.getByRole("button", { name: "Go back", exact: true }),
    modal.getByRole("button", { name: "Override & move round", exact: true }),
    trigger,
  );
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  page.once("dialog", (dialog) => void dialog.accept());
  await activateByKeyboard(page, trigger);
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Override & move round", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  const startNow = page.getByRole("button", { name: "Start Now", exact: true });
  await expect(startNow).toBeVisible();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  await activateByKeyboard(page, startNow);
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
  ).toEqual({ p_session_id: sessionId, p_round_number: 2 });
  backend.verify();
});

test("break timer editor contains keyboard focus and preserves the save contract", async ({
  page,
}) => {
  const backend = await openHost(page, { onBreak: true });
  await openBreakMenu(page);
  const trigger = page.getByRole("button", {
    name: "Edit break timer",
    exact: true,
  });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("dialog", {
    name: "Edit the time until the next round",
    exact: true,
  });
  const minutes = modal.getByRole("spinbutton", {
    name: "Break minutes",
    exact: true,
  });
  await expectModalKeyboard(
    page,
    modal,
    minutes,
    modal.getByRole("button", { name: "Save timer", exact: true }),
    trigger,
  );
  await activateByKeyboard(page, trigger);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("2");
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Save timer", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect
    .poll(() =>
      backend.requests
        .filter(
          (r) => r.name === "cc_game_session_timers" && r.method === "POST",
        )
        .some(
          (r) =>
            typeof r.body === "object" &&
            r.body !== null &&
            "remaining_seconds" in r.body &&
            r.body.remaining_seconds === 120,
        ),
    )
    .toBe(true);
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  backend.verify();
});

test("challenge editor contains keyboard focus and saves only the selected upcoming challenge", async ({
  page,
}) => {
  const writeUrls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "PATCH" &&
      new URL(request.url()).pathname.endsWith("/cc_game_session_challenges")
    )
      writeUrls.push(request.url());
  });
  const backend = await openHost(page, { onBreak: true });
  const trigger = page.getByRole("button", {
    name: "Edit next challenge",
    exact: true,
  });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("dialog", {
    name: "Update challenge",
    exact: true,
  });
  const title = modal.getByRole("textbox", {
    name: "Challenge title",
    exact: true,
  });
  await expectModalKeyboard(
    page,
    modal,
    title,
    modal.getByRole("button", { name: "Save challenge", exact: true }),
    trigger,
  );
  await activateByKeyboard(page, trigger);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Updated second entrance");
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Save challenge", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const writes = backend.requests.filter(
    (r) => r.name === "cc_game_session_challenges" && r.method === "PATCH",
  );
  expect(writes).toHaveLength(1);
  expect(writes[0].body).toEqual({
    title: "Updated second entrance",
    description: "Show everyone your best entrance.",
    duration_minutes: 5,
    points: 20,
    allow_photo_upload: false,
  });
  expect(writeUrls).toHaveLength(1);
  expect(new URL(writeUrls[0]).searchParams.get("id")).toBe("eq.round-2");
  expect(new URL(writeUrls[0]).searchParams.get("session_id")).toBe(
    `eq.${sessionId}`,
  );
  backend.verify();
});

test("break save remains modal and cannot be dismissed while its write is pending", async ({
  page,
}) => {
  const backend = await openHost(page, { onBreak: true });
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/cc_game_session_timers*", async (route) => {
    const body: unknown =
      route.request().method() === "POST"
        ? route.request().postDataJSON()
        : null;
    if (
      route.request().method() === "POST" &&
      typeof body === "object" &&
      body !== null &&
      "remaining_seconds" in body &&
      body.remaining_seconds === 120
    )
      await pending;
    await route.fallback();
  });
  try {
    await openBreakMenu(page);
    const trigger = page.getByRole("button", {
      name: "Edit break timer",
      exact: true,
    });
    await activateByKeyboard(page, trigger);
    const modal = page.getByRole("dialog", {
      name: "Edit the time until the next round",
      exact: true,
    });
    const minutes = modal.getByRole("spinbutton", {
      name: "Break minutes",
      exact: true,
    });
    await expect(minutes).toBeFocused();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("2");
    await activateByKeyboard(
      page,
      modal.getByRole("button", { name: "Save timer", exact: true }),
    );
    await expect(
      modal.getByRole("button", { name: "Saving…", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(modal).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(modal).toBeFocused();
    await page.mouse.click(1, 1);
    await expect(modal).toBeVisible();
    release();
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
    backend.verify();
  } finally {
    release();
  }
});

test("host dialog reference contains focus, guards dismissal and remains local", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const trigger = page.getByRole("button", {
    name: "Open sample host dialog",
    exact: true,
  });
  await expect(page.locator("body")).toBeFocused();
  await activateByKeyboard(page, trigger, "backward");
  const modal = page.getByRole("dialog", {
    name: "Local host dialog",
    exact: true,
  });
  const field = modal.getByRole("textbox", {
    name: "Sample host note",
    exact: true,
  });
  await expectModalKeyboard(
    page,
    modal,
    field,
    modal.getByRole("button", {
      name: "Save sample host note",
      exact: true,
    }),
    trigger,
  );
  await activateByKeyboard(page, trigger);
  await tabTo(
    page,
    modal.getByRole("checkbox", { name: "Sample dialog busy", exact: true }),
  );
  await page.keyboard.press("Space");
  await expect(
    modal.getByRole("button", {
      name: "Close sample host dialog",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    modal.getByRole("button", { name: "Close Local host dialog", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(modal).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    modal.getByRole("checkbox", { name: "Sample dialog busy", exact: true }),
  ).not.toBeChecked();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await activateByKeyboard(page, trigger);
  await page.mouse.click(1, 1);
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("challenge save failure stays announced inside the modal and can be retried", async ({
  page,
}) => {
  const backend = await openHost(page, { onBreak: true });
  backend.failures.add("cc_game_session_challenges");
  const trigger = page.getByRole("button", {
    name: "Edit next challenge",
    exact: true,
  });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("dialog", {
    name: "Update challenge",
    exact: true,
  });
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Save challenge", exact: true }),
  );
  await expect(modal.getByRole("alert")).toContainText(
    "Couldn't update this challenge: Fixture connection failed",
  );
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Dismiss error", exact: true }),
  );
  await expect(modal.getByRole("alert")).toHaveCount(0);
  backend.failures.delete("cc_game_session_challenges");
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Save challenge", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  backend.verify();
});

for (const editor of ["break", "challenge"] as const) {
  test(`${editor} editor can dismiss refresh errors without waiting for another poll`, async ({
    page,
  }) => {
    const backend = await openHost(page, { onBreak: true });
    if (editor === "break") await openBreakMenu(page);
    const trigger = page.getByRole("button", {
      name: editor === "break" ? "Edit break timer" : "Edit next challenge",
      exact: true,
    });
    await activateByKeyboard(page, trigger);
    const modal = page.getByRole("dialog", {
      name:
        editor === "break"
          ? "Edit the time until the next round"
          : "Update challenge",
      exact: true,
    });
    backend.failures.add("cc_game_sessions");
    await expect(modal.getByRole("alert")).toContainText(
      "Couldn't load this game session: Fixture connection failed",
    );
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/rest/v1/cc_game_sessions*", async (route) => {
      if (route.request().method() === "GET") await pending;
      await route.fallback();
    });
    try {
      await activateByKeyboard(
        page,
        modal.getByRole("button", { name: "Dismiss error", exact: true }),
      );
      await expect(modal.getByRole("alert")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(modal).toHaveCount(0);
      await expect(trigger).toBeFocused();
      backend.verify();
    } finally {
      backend.failures.delete("cc_game_sessions");
      release();
    }
  });
}

test("start override is keyboard-modal and starts only after explicit confirmation", async ({
  page,
}) => {
  const backend = await openHost(page, { autoplay: true, lobby: true });
  const trigger = page.getByRole("button", { name: "Start Game", exact: true });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("alertdialog", {
    name: "Start before everything is ready?",
    exact: true,
  });
  await expectModalKeyboard(
    page,
    modal,
    modal.getByRole("button", { name: "Go back", exact: true }),
    modal.getByRole("button", { name: "Override & start game", exact: true }),
    trigger,
  );
  expect(
    backend.requests.filter((r) => r.name === "cc_host_start_game_session"),
  ).toEqual([]);
  await activateByKeyboard(page, trigger);
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Override & start game", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  await expect
    .poll(
      () =>
        backend.requests.filter((r) => r.name === "cc_host_start_game_session")
          .length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_start_game_session")?.body,
  ).toEqual({ p_session_id: sessionId });
  backend.verify();
});

test("shared dialog form submits local values and dismisses its local error by keyboard", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const trigger = page.getByRole("button", {
    name: "Open sample host dialog",
    exact: true,
  });
  await expect(page.locator("body")).toBeFocused();
  await activateByKeyboard(page, trigger, "backward");
  const modal = page.getByRole("dialog", {
    name: "Local host dialog",
    exact: true,
  });
  await activateByKeyboard(
    page,
    modal.getByRole("button", {
      name: "Show sample dialog error",
      exact: true,
    }),
  );
  await expect(modal.getByRole("alert")).toContainText("Sample dialog error.");
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Dismiss error", exact: true }),
  );
  await expect(modal.getByRole("alert")).toHaveCount(0);
  await tabTo(
    page,
    modal.getByRole("textbox", { name: "Sample host note", exact: true }),
  );
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Saved locally");
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Save sample host note", exact: true }),
  );
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Sample note saved: Saved locally" }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("shared session panel reference selects rounds and keeps invitation actions local", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const panel = page.getByRole("region", { name: "Sample session panel" });
  await expect(
    panel.getByRole("button", {
      name: "1. Find something purple",
      exact: true,
    }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "2. Team portrait", exact: true }),
  );
  await expect(
    panel.getByRole("button", { name: "2. Team portrait", exact: true }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Sample round 2 selected locally." }),
  ).toBeVisible();
  await tabTo(
    page,
    page.getByRole("checkbox", {
      name: "Sample round controls busy",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await expect(
    panel.getByRole("button", {
      name: "1. Find something purple",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Edit sample challenge", exact: true }),
  ).toBeDisabled();
  await tabTo(
    page,
    page.getByRole("checkbox", {
      name: "Sample invitation teams enabled",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await expect(
    page.getByText("Players can pick or create a team in the lobby.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("checkbox", {
      name: "Sample round controls busy",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("link", { name: "Open join screen", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Copy join code", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("button", { name: "Join code copied", exact: true })
      .locator(".lucide-check"),
  ).toBeVisible();
  const link = page.getByRole("link", {
    name: "Open join screen",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", "#/styleguide");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noreferrer");
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("start confirmation blocks a newly invalid team setup while the dialog is open", async ({
  page,
}) => {
  const backend = await openHost(page, { autoplay: true, lobby: true });
  const trigger = page.getByRole("button", { name: "Start Game", exact: true });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("alertdialog", {
    name: "Start before everything is ready?",
    exact: true,
  });
  await expect(
    modal.getByRole("button", { name: "Override & start game", exact: true }),
  ).toBeEnabled();
  backend.session.teams_enabled = true;
  await expect(
    modal.getByText(
      "Assign every player to a team before starting. This requirement cannot be overridden.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Assign teams first", exact: true }),
  ).toBeDisabled();
  const cancel = modal.getByRole("button", { name: "Go back", exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_start_game_session"),
  ).toEqual([]);
  backend.verify();
});
