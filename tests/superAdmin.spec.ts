import { expect, test, type Locator } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

const games = [
  {
    game_id: "planned-game",
    name: "Garden chaos",
    host_email: "anna@example.test",
    status: "planned",
    event_date: "2030-01-01",
    created_at: "2029-12-01",
    player_count: 7,
    session_count: 2,
    live_sessions: 1,
  },
  {
    game_id: "live-game",
    name: "Night crawl",
    host_email: null,
    status: "live",
    event_date: null,
    created_at: "2029-12-02",
    player_count: 0,
    session_count: 0,
    live_sessions: 0,
  },
  {
    game_id: "completed-game",
    name: "Finished party",
    host_email: "pat@example.test",
    status: "completed",
    event_date: null,
    created_at: "2029-12-03",
    player_count: 5,
    session_count: 1,
    live_sessions: 0,
  },
];
const detail = {
  game: { name: "Garden chaos", host_email: "anna@example.test" },
  sessions: [
    {
      id: "session-one",
      name: "Friday session",
      join_code: "123456",
      status: "live",
      created_at: "2030-01-01",
      players: [
        { name: "Alex", score: 0, team_name: "Lime" },
        { name: "Sam", score: -2, team_name: null },
      ],
    },
  ],
};

test("platform games preserve RPC contracts, full totals, incoming order and local filters", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_super_admin_list_games = games;
  await page.goto("#/host/super-admin");
  await expect(page.getByText("Garden chaos", { exact: true })).toBeVisible();
  await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
    "Garden chaos",
    "Night crawl",
    "Finished party",
  ]);
  await expect(page.locator(".sa-stats strong")).toHaveText(["3", "12", "2"]);
  const request = backend.requests.find(
    (entry) => entry.name === "cc_super_admin_list_games",
  );
  expect(request?.method).toBe("POST");
  expect(request?.body).toEqual({});
  const search = page.getByPlaceholder("Search game or host email");
  await search.fill("ANNA@");
  await expect(page.locator(".sa-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".sa-stats strong")).toHaveText(["3", "12", "2"]);
  await search.fill("");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("completed");
  await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
    "Finished party",
  ]);
  await search.fill("missing");
  await expect(
    page.getByText("No games match this search.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to Host Hub" }),
  ).toHaveAttribute("href", "#/host");
  backend.verify();
});

test("platform access denial clears after a successful refresh", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  let denied = true;
  await page.route(
    (url) => url.pathname === "/rest/v1/rpc/cc_super_admin_list_games",
    async (route) => {
      if (!denied) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not authorised", code: "42501" }),
      });
    },
  );
  await page.goto("#/host/super-admin");
  await expect(page.getByText("Not authorised", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/isn't provisioned as a Super Admin/),
  ).toBeVisible();
  denied = false;
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Refresh", exact: true }),
  );
  await expect(
    page.locator(".sa-table").getByText("Regression party", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Not authorised", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/isn't provisioned as a Super Admin/),
  ).toHaveCount(0);
  backend.verify();
});

test("game inspector preserves the detail payload and nested scores through native keyboard dismissal", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_super_admin_list_games = games;
  backend.responses.cc_super_admin_game_detail = detail;
  await page.goto("#/host/super-admin");
  const opener = page
    .getByRole("row")
    .filter({ has: page.getByText("Garden chaos", { exact: true }) })
    .getByRole("button", { name: "Inspect", exact: true });
  await activateByKeyboard(page, opener);
  const dialog = page.getByRole("dialog", {
    name: "Game inspector",
    exact: true,
  });
  await expect(
    dialog.getByRole("heading", { name: "Garden chaos", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.find(
      (entry) => entry.name === "cc_super_admin_game_detail",
    )?.body,
  ).toEqual({ p_game_id: "planned-game" });
  await expect(
    dialog.getByText("Friday session", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("live · Code 123456", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText("Alex · Lime", { exact: true })).toBeVisible();
  await expect(dialog.getByText("0 pts", { exact: true })).toBeVisible();
  await expect(dialog.getByText("-2 pts", { exact: true })).toBeVisible();
  const close = dialog.getByRole("button", {
    name: "Close game inspector",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await activateByKeyboard(page, close);
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  backend.verify();
});

test("game inspector failure retains its list and retries the same id inside the modal", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.failures.add("cc_super_admin_game_detail");
  await page.goto("#/host/super-admin");
  const opener = page.getByRole("button", { name: "Inspect", exact: true });
  await activateByKeyboard(page, opener);
  await expect(
    page.getByText("Fixture connection failed", { exact: true }),
  ).toBeVisible();
  const dialog = page.getByRole("dialog", {
    name: "Game inspector",
    exact: true,
  });
  await expect(dialog.getByRole("alert")).toHaveText(
    "Fixture connection failed",
  );
  await expect(page.locator(".sa-table")).toBeVisible();
  backend.failures.delete("cc_super_admin_game_detail");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Retry inspection", exact: true }),
  );
  await expect(
    dialog.getByRole("heading", { name: "Regression party", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests
      .filter((entry) => entry.name === "cc_super_admin_game_detail")
      .map((entry) => entry.body),
  ).toEqual([{ p_game_id: "test-plan" }, { p_game_id: "test-plan" }]);
  await page.keyboard.press("Escape");
  backend.verify();
});

for (const dismissal of ["escape", "button", "backdrop"]) {
  test(`pending inspector ${dismissal} dismissal protects a fresh inspection from the obsolete reply`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    backend.responses.cc_super_admin_list_games = games;
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requestedIds: string[] = [];
    await page.route(
      (url) => url.pathname === "/rest/v1/rpc/cc_super_admin_game_detail",
      async (route) => {
        const payload: unknown = route.request().postDataJSON();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("p_game_id" in payload) ||
          typeof payload.p_game_id !== "string"
        )
          throw new Error("Unexpected inspector payload");
        requestedIds.push(payload.p_game_id);
        if (payload.p_game_id === "planned-game") {
          await gate;
          await route.fulfill({
            status: dismissal === "escape" ? 500 : 200,
            contentType: "application/json",
            body: JSON.stringify(
              dismissal === "escape"
                ? { message: "Old inspector failed" }
                : detail,
            ),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            game: { name: "New inspection", host_email: "other@example.test" },
            sessions: [],
          }),
        });
      },
    );
    try {
      await page.goto("#/host/super-admin");
      const oldOpener = page
        .getByRole("row")
        .filter({ has: page.getByText("Garden chaos", { exact: true }) })
        .getByRole("button", { name: "Inspect", exact: true });
      await activateByKeyboard(page, oldOpener);
      const dialog = page.getByRole("dialog", {
        name: "Game inspector",
        exact: true,
      });
      await expect(
        dialog.getByText("Loading game details…", { exact: true }),
      ).toBeVisible();
      if (dismissal === "escape") await page.keyboard.press("Escape");
      else if (dismissal === "button")
        await activateByKeyboard(
          page,
          dialog.getByRole("button", {
            name: "Close game inspector",
            exact: true,
          }),
        );
      else await page.mouse.click(4, 4);
      await expect(dialog).toHaveCount(0);
      await expect(oldOpener).toBeFocused();
      const newOpener = page
        .getByRole("row")
        .filter({ has: page.getByText("Night crawl", { exact: true }) })
        .getByRole("button", { name: "Inspect", exact: true });
      await activateByKeyboard(page, newOpener);
      await expect(
        dialog.getByRole("heading", { name: "New inspection", exact: true }),
      ).toBeVisible();
      const oldResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith("/rpc/cc_super_admin_game_detail") &&
          response.request().postData()?.includes("planned-game") === true,
      );
      release();
      await oldResponse;
      await page.waitForLoadState("networkidle");
      await expect(
        dialog.getByRole("heading", { name: "New inspection", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Old inspector failed", { exact: true }),
      ).toHaveCount(0);
      await expect(
        dialog.getByRole("button", {
          name: "Close game inspector",
          exact: true,
        }),
      ).toBeFocused();
      expect(requestedIds).toEqual(["planned-game", "live-game"]);
      await page.keyboard.press("Escape");
      await expect(newOpener).toBeFocused();
      backend.verify();
    } finally {
      release();
    }
  });
}

test("inspector failure feedback stays modal, dismisses by keyboard and retries the current game", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.failures.add("cc_super_admin_game_detail");
  await page.goto("#/host/super-admin");
  const opener = page.getByRole("button", { name: "Inspect", exact: true });
  await activateByKeyboard(page, opener);
  const dialog = page.getByRole("dialog", {
    name: "Game inspector",
    exact: true,
  });
  await expect(dialog.getByRole("alert")).toHaveText(
    "Fixture connection failed",
  );
  await expect(page.locator(".host-alert")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Back to Host Hub" })
    .evaluate((element) => element.focus());
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Dismiss error", exact: true }),
  );
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  const close = dialog.getByRole("button", {
    name: "Close game inspector",
    exact: true,
  });
  await expect(close).toBeFocused();
  await expect(close).toBeInViewport();
  backend.failures.delete("cc_super_admin_game_detail");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Retry inspection", exact: true }),
  );
  await expect(
    dialog.getByRole("heading", { name: "Regression party", exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  expect(
    backend.requests
      .filter((entry) => entry.name === "cc_super_admin_game_detail")
      .map((entry) => entry.body),
  ).toEqual([{ p_game_id: "test-plan" }, { p_game_id: "test-plan" }]);
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  backend.verify();
});

test("obsolete list denial cannot replace a fresh refresh or its selected filter", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let refreshing = false;
  let initialReads = 0;
  let refreshReads = 0;
  await page.route(
    (url) => url.pathname === "/rest/v1/rpc/cc_super_admin_list_games",
    async (route) => {
      if (!refreshing) {
        initialReads += 1;
        await gate;
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Not authorised", code: "42501" }),
        });
        return;
      }
      refreshReads += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(games),
      });
    },
  );
  try {
    await page.goto("#/host/super-admin");
    await expect(
      page.getByText("Loading platform games…", { exact: true }),
    ).toBeVisible();
    const search = page.getByPlaceholder("Search game or host email");
    await search.fill("Night");
    refreshing = true;
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Refresh", exact: true }),
    );
    await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
      "Night crawl",
    ]);
    const obsolete = page.waitForResponse(
      (response) =>
        response.url().endsWith("/rpc/cc_super_admin_list_games") &&
        response.status() === 403,
    );
    release();
    await obsolete;
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
      "Night crawl",
    ]);
    await expect(search).toHaveValue("Night");
    await expect(page.getByText("Not authorised", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.locator(".sa-denied")).toHaveCount(0);
    expect(initialReads).toBeGreaterThanOrEqual(1);
    expect(refreshReads).toBe(1);
    backend.verify();
  } finally {
    release();
  }
});

test("platform filters have visible native labels and named table columns", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  backend.responses.cc_super_admin_list_games = games;
  await page.goto("#/host/super-admin");
  await expect(page.getByText("Garden chaos", { exact: true })).toBeVisible();
  const search = page.getByRole("textbox", {
    name: "Search games",
    exact: true,
  });
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(search).toBeVisible();
  await expect(status).toBeVisible();
  const searchLabel = page.locator("label").filter({ has: search });
  const statusLabel = page.locator("label").filter({ has: status });
  await expect(searchLabel).toContainText("Search games");
  await expect(statusLabel).toContainText("Status");
  await expect(page.getByRole("columnheader")).toHaveText([
    "Game",
    "Host",
    "Status",
    "Players",
    "Sessions",
    "Date",
    "Actions",
  ]);
  expect(
    await page
      .getByRole("columnheader")
      .evaluateAll((headers) =>
        headers.every((header) => header.getAttribute("scope") === "col"),
      ),
  ).toBe(true);
  await tabTo(page, search);
  await page.keyboard.type("ANNA@");
  await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
    "Garden chaos",
  ]);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Tab");
  await expect(status).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(status).toHaveValue("completed");
  await expect(page.locator(".sa-table tbody tr td:first-child")).toHaveText([
    "Finished party",
  ]);
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(status).toHaveValue("all");
  await searchLabel.getByText("Search games", { exact: true }).click();
  await expect(search).toBeFocused();
  await statusLabel.getByText("Status", { exact: true }).click();
  await expect(status).toBeFocused();
  await expect(search).toHaveAttribute(
    "placeholder",
    "Search game or host email",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  backend.verify();
});

test("shared filter toolbar uses local native controls without backend reads", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Shared filter toolbar",
      exact: true,
    }),
  });
  const search = example.getByRole("textbox", {
    name: "Search games",
    exact: true,
  });
  const status = example.getByRole("combobox", { name: "Status", exact: true });
  await tabTo(page, search);
  await page.keyboard.type("garden");
  await expect(example.locator("output")).toHaveText("1 result");
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await expect(example.locator("output")).toHaveText("3 results");
  await page.keyboard.press("Tab");
  await expect(status).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(status).toHaveValue("completed");
  await expect(example.locator("output")).toHaveText("1 result");
  await expect(example.getByRole("listitem")).toHaveText(["Finished party"]);
  const disabled = example.getByRole("checkbox", {
    name: "Disable filters",
    exact: true,
  });
  await tabTo(page, disabled);
  await page.keyboard.press("Space");
  await expect(search).toBeDisabled();
  await expect(status).toBeDisabled();
  await expect(disabled).toBeFocused();
  await page.keyboard.press("Space");
  await expect(search).toBeEnabled();
  await expect(status).toBeEnabled();
  await expect(status).toHaveValue("completed");
  expect(backend.requests).toHaveLength(0);
  backend.verify();
});

for (const local of [false, true]) {
  test(`filter controls expose visible keyboard focus${local ? " in the local reference" : ""}`, async ({
    page,
  }, testInfo) => {
    const backend = await installSessionBackend(page, { host: true });
    await page.goto(local ? "#/styleguide" : "#/host/super-admin");
    const scope = local
      ? page
          .locator(".component-example")
          .filter({
            has: page.getByRole("heading", {
              name: "Shared filter toolbar",
              exact: true,
            }),
          })
      : page.locator("main");
    const search = scope.getByRole("textbox", {
      name: "Search games",
      exact: true,
    });
    const status = scope.getByRole("combobox", { name: "Status", exact: true });
    await expect(search).toBeVisible();
    await expect(status).toBeVisible();
    const size = (control: Locator) =>
      control.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      });
    await page.evaluate(() => document.fonts.ready);
    const initialSearch = await size(search);
    const initialStatus = await size(status);
    async function ring(control: Locator, keyboard: boolean) {
      const state = await control.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          visible: element.matches(":focus-visible"),
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
          color: style.outlineColor,
        };
      });
      if (keyboard) expect(state.visible).toBe(true);
      expect.soft(state.style).toBe(state.visible ? "solid" : "none");
      if (state.visible) {
        expect.soft(state.width).toBeGreaterThan(0);
        expect.soft(state.color).not.toBe("rgba(0, 0, 0, 0)");
      } else expect.soft(state.width).toBe(0);
    }
    await tabTo(page, search);
    await expect(search).toBeFocused();
    await expect(search).toBeInViewport();
    await ring(search, true);
    await page.screenshot({
      path: testInfo.outputPath("search-keyboard-focus.png"),
      animations: "disabled",
    });
    await page.keyboard.press("Tab");
    await expect(status).toBeFocused();
    await expect(status).toBeInViewport();
    await ring(status, true);
    await page.screenshot({
      path: testInfo.outputPath("status-keyboard-focus.png"),
      animations: "disabled",
    });
    await search.click();
    await expect(search).toBeFocused();
    await ring(search, false);
    await status.click();
    await expect(status).toBeFocused();
    await ring(status, false);
    await page.keyboard.press("Escape");
    expect(await size(search)).toEqual(initialSearch);
    expect(await size(status)).toEqual(initialStatus);
    if (local) {
      const disable = scope.getByRole("checkbox", {
        name: "Disable filters",
        exact: true,
      });
      await tabTo(page, disable);
      await page.keyboard.press("Space");
      await expect(search).toBeDisabled();
      await expect(status).toBeDisabled();
      await ring(search, false);
      await ring(status, false);
      await page.keyboard.press("Shift+Tab");
      expect(
        await search.evaluate((element) => element === document.activeElement),
      ).toBe(false);
      expect(
        await status.evaluate((element) => element === document.activeElement),
      ).toBe(false);
      await tabTo(page, disable);
      await page.keyboard.press("Space");
      await expect(search).toBeEnabled();
      await expect(status).toBeEnabled();
      await page.keyboard.press("Shift+Tab");
      await expect(status).toBeFocused();
      await ring(status, true);
      expect(backend.requests).toHaveLength(0);
    }
    backend.verify();
  });
}
