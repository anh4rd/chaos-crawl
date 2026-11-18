import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
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
  await page.locator(".sa-toolbar select").selectOption("completed");
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
      denied = false;
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

test("game inspector failure leaves the list available and retries without changing the id", async ({
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
  await expect(page.getByRole("dialog")).toHaveCount(0);
  backend.failures.delete("cc_super_admin_game_detail");
  await activateByKeyboard(page, opener);
  const dialog = page.getByRole("dialog", {
    name: "Game inspector",
    exact: true,
  });
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
