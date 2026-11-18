import { expect, test, type Page } from "@playwright/test";
import { installSessionBackend, sessionId } from "./support/sessionBackend";
import { activateByKeyboard } from "./support/keyboard";

async function expectTarget(page: Page, target: string) {
  const highlighted = page.locator(target);
  await expect(highlighted).toHaveClass(/tour-highlight/);
  await expect(highlighted).toBeVisible();
  await expect(highlighted).toBeInViewport();
}

for (const status of ["live", "lobby", "completed"] as const) {
  test(`host ${status} tour walks every visible target by keyboard and restores focus`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, {
      host: true,
      savedPlayer: false,
      lobby: status === "lobby",
    });
    backend.session.status = status;
    await page.goto(`#/host/live/${sessionId}`);
    if (status === "live")
      await expect
        .poll(
          () =>
            backend.requests.filter(
              (r) => r.name === "cc_game_session_timers" && r.method === "POST",
            ).length,
        )
        .toBe(1);
    const initialRequestCount = backend.requests.length;
    const trigger = page.getByRole("button", { name: /Take the host tour/ });
    await activateByKeyboard(page, trigger);
    const dialog = page.getByRole("dialog", { name: /HOST TOUR/ });
    await expect(dialog).toBeVisible();
    await expectTarget(page, '[data-tour="host-overview"]');
    const close = dialog.getByRole("button", {
      name: "Close tour",
      exact: true,
    });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "Next", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    const targets =
      status === "lobby"
        ? [
            "host-overview",
            "host-lobby-invite",
            "host-lobby-participation",
            "host-lobby-roster",
            "host-lobby-teams",
            "host-lobby-team-names",
            "host-lobby-ready",
          ]
        : [
            "host-overview",
            "host-sections",
            "host-player-game",
            "host-leaderboard",
            "host-side-review",
            "host-controls-tab",
            "host-start-controls",
            "host-review",
            "host-reward",
            "host-final-round",
          ];
    for (let index = 0; index < targets.length; index += 1) {
      await expectTarget(page, `[data-tour="${targets[index]}"]`);
      if (targets[index] === "host-sections")
        await expect(page.locator('[data-tour="host-sections"]')).toHaveCSS(
          "position",
          "fixed",
        );
      await expect(dialog).toContainText(`${index + 1} OF ${targets.length}`);
      await activateByKeyboard(
        page,
        dialog.getByRole("button", {
          name: index === targets.length - 1 ? "Finish" : "Next",
          exact: true,
        }),
      );
    }
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator(".tour-highlight")).toHaveCount(0);
    await activateByKeyboard(page, trigger);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator(".tour-highlight")).toHaveCount(0);
    expect(
      backend.requests
        .slice(initialRequestCount)
        .filter(
          (r) =>
            [
              "cc_host_start_game_session",
              "cc_host_complete_game_session",
              "cc_host_join_as_player",
            ].includes(r.name) ||
            (r.name.startsWith("cc_game_session_") && r.method !== "GET"),
        ),
    ).toEqual([]);
    backend.verify();
  });
}

test("shared tour is modal by keyboard and returns to its local reference trigger", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const trigger = page.getByRole("button", {
    name: "Preview guided tour",
    exact: true,
  });
  await activateByKeyboard(page, trigger);
  const dialog = page.getByRole("dialog", { name: /STYLEGUIDE TOUR/ });
  await expect(
    dialog.getByRole("button", { name: "Close tour", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Next", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("public demo tour opens as a keyboard modal and releases its background on Escape", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/demo/player");
  const dialog = page.getByRole("dialog", { name: /PLAYER DEMO/ });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Close tour", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Anna", exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("a lobby tour closes safely when the session moves into live play", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: true,
    savedPlayer: false,
    lobby: true,
  });
  await page.goto(`#/host/live/${sessionId}`);
  const trigger = page.getByRole("button", { name: /Take the host tour/ });
  await activateByKeyboard(page, trigger);
  const dialog = page.getByRole("dialog", { name: /HOST TOUR/ });
  await expect(dialog).toBeVisible();
  await expectTarget(page, '[data-tour="host-overview"]');
  backend.session.status = "live";
  await expect(dialog).toHaveCount(0, { timeout: 10_000 });
  await expect(trigger).toBeFocused();
  await expect(page.locator(".tour-highlight")).toHaveCount(0);
  backend.verify();
});

test("host frame reference uses shared controls and local tour without backend requests", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const trigger = page.getByRole("button", {
    name: "✦ Take sample tour",
    exact: true,
  });
  await activateByKeyboard(page, trigger);
  const dialog = page.getByRole("dialog", { name: /HOST FRAME EXAMPLE/ });
  await expect(
    dialog.getByRole("button", { name: "Close tour", exact: true }),
  ).toBeFocused();
  await expect(
    page.locator('[data-tour="example-host-tools"]'),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Try local host action", exact: true }),
  );
  await expect(
    page.getByText("Local host action selected.", { exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});
