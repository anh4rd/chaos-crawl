import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import {
  exploreSubmissions,
  installExploreBackend,
} from "./support/hostExplore";
import { hostId } from "./support/sessionBackend";

const cards = (page: Page) => page.locator(".card--idea");
const card = (page: Page, title: string) =>
  cards(page).filter({
    has: page.getByRole("heading", { name: title, exact: true }),
  });
async function openExplore(page: Page) {
  await page.goto("#/host/explore");
  await expect(
    page.getByRole("heading", { name: "Community paper tower", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Checking your saved items…", { exact: true }),
  ).toHaveCount(0);
}

async function selectCatalogueTab(page: Page, name: RegExp) {
  const list = page.getByRole("tablist", { name: "Explore catalogue" });
  const target = list.getByRole("tab", { name });
  await tabTo(page, list.getByRole("tab", { selected: true }));
  for (let step = 0; step < 3; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement))
      break;
    await page.keyboard.press("ArrowRight");
  }
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute("aria-selected", "true");
}

test("catalogue reads preserve contracts, approved visibility and local search/category/tab behavior", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  await openExplore(page);
  const favouriteRead = requests.find((r) =>
    r.url.pathname.endsWith("host_favourites"),
  );
  const catalogueRead = requests.find((r) =>
    r.url.pathname.endsWith("cc_catalog_submissions"),
  );
  expect(favouriteRead).toBeDefined();
  expect(catalogueRead).toBeDefined();
  expect(Object.fromEntries(favouriteRead?.url.searchParams ?? [])).toEqual({
    select: "id,item_type,item_id,item_data",
    host_id: `eq.${hostId}`,
  });
  expect(Object.fromEntries(catalogueRead?.url.searchParams ?? [])).toEqual({
    select:
      "id,item_type,title,description,payload,status,submitted_by,review_note,created_at",
    order: "created_at.desc",
  });
  await expect(
    page.getByRole("heading", { name: "Your submissions", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".history-row")).toHaveCount(2);
  await expect(
    page.getByText("Please clarify the rules.", { exact: true }),
  ).toBeVisible();
  await expect(
    cards(page).getByRole("heading", {
      name: "Pending contribution",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Community review queue/ }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("  PAPER TOWER  ");
  await expect(cards(page)).toHaveCount(1);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "side", exact: true }),
  );
  await expect(cards(page)).toHaveCount(1);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "main", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "No matches", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Clear filters", exact: true }),
  );
  await expect(
    page.getByRole("textbox", { name: "Search tasks", exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("no-such-idea");
  await selectCatalogueTab(page, /^Locations /);
  await expect(
    page.getByRole("textbox", { name: "Search locations", exact: true }),
  ).toHaveValue("no-such-idea");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Clear search", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Everything", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const hall = card(page, "Community hall");
  await activateByKeyboard(page, hall.locator("summary"));
  await expect(
    hall.getByText("Check access / step-free routes", { exact: true }),
  ).toBeVisible();
  await selectCatalogueTab(page, /^Routes /);
  const route = card(page, "The classic three-stop");
  await activateByKeyboard(
    page,
    route.getByRole("button", { name: "Preview route", exact: true }),
  );
  await expect(
    route.getByRole("button", { name: "Hide route outline", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(route.locator("ol li strong")).toHaveText([
    "Meet-up pub or café",
    "Challenge-friendly second stop",
    "Final venue with space to gather",
  ]);
  await activateByKeyboard(
    page,
    route.getByRole("button", { name: "Hide route outline", exact: true }),
  );
  await expect(route.locator("ol")).toHaveCount(0);
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  backend.verify();
});

test("task favourites retain pending state, exact payloads, deletion failure and retry", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("Obtain the best thing");
  const task = card(page, "Obtain the best thing");
  let release = () => {};
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/host_favourites",
    async (route) => {
      if (route.request().method() === "POST") await gate;
      await route.fallback();
    },
  );
  await activateByKeyboard(
    page,
    task.getByRole("button", {
      name: "Save Obtain the best thing",
      exact: true,
    }),
  );
  await expect(
    task.getByRole("button", {
      name: "Save Obtain the best thing",
      exact: true,
    }),
  ).toBeDisabled();
  release();
  await expect(
    task.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  ).toBeEnabled();
  const insert = requests.find((r) => r.method === "POST");
  expect(insert).toBeDefined();
  expect(Object.fromEntries(insert?.url.searchParams ?? [])).toEqual({
    select: "id,item_type,item_id,item_data",
  });
  expect(insert?.body).toEqual({
    host_id: hostId,
    item_type: "task",
    item_id: "task-best-thing",
    item_data: {
      id: "task-best-thing",
      title: "Obtain the best thing",
      description:
        "Find or make the best small object you can using only what's available at the venue. Present your case to the host.",
      points: 25,
      minutes: 15,
      kind: "main",
      tags: ["indoors", "improv", "no prep"],
      setup: "none",
    },
  });
  backend.failures.add("host_favourites");
  await activateByKeyboard(
    page,
    task.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  );
  await expect(page.getByRole("alert")).toHaveText("Fixture connection failed");
  await expect(
    task.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  ).toBeEnabled();
  backend.failures.delete("host_favourites");
  await activateByKeyboard(
    page,
    task.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  );
  await expect(
    task.getByRole("button", {
      name: "Save Obtain the best thing",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const deletes = requests.filter((r) => r.method === "DELETE");
  expect(deletes).toHaveLength(2);
  for (const r of deletes) {
    expect(Object.fromEntries(r.url.searchParams)).toEqual({
      id: "eq.fav-task-best-thing",
    });
    expect(r.body).toBeNull();
  }
  backend.verify();
});

test("location and route favourites preserve their separate records and route-specific failure feedback", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  await openExplore(page);
  await selectCatalogueTab(page, /^Locations /);
  await page
    .getByRole("textbox", { name: "Search locations", exact: true })
    .fill("Community hall");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save Community hall", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Unsave Community hall", exact: true }),
  ).toBeVisible();
  const venue = requests.find((r) => r.method === "POST");
  expect(venue?.body).toMatchObject({
    host_id: hostId,
    item_type: "venue",
    item_id: "loc-community-hall",
    item_data: {
      id: "loc-community-hall",
      title: "Community hall",
      venueType: "hall",
      cost: "Low",
      oneVenue: true,
    },
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Clear search", exact: true }),
  );
  await selectCatalogueTab(page, /^Routes /);
  await page
    .getByRole("textbox", { name: "Search routes", exact: true })
    .fill("The classic three-stop");
  backend.failures.add("host_favourites");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save route", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText(
    "Route favourites need the latest host catalogue migration. Run 20261023_host_catalog_routes.sql in Supabase, then try again.",
  );
  backend.failures.delete("host_favourites");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Save route", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Saved route", exact: true }),
  ).toBeVisible();
  expect(
    requests.filter((r) => r.method === "POST").at(-1)?.body,
  ).toMatchObject({
    host_id: hostId,
    item_type: "route",
    item_id: "route-classic-three",
    item_data: {
      stops: [
        "Meet-up pub or café",
        "Challenge-friendly second stop",
        "Final venue with space to gather",
      ],
    },
  });
  backend.verify();
});

test("community contribution preserves native form bounds, tag limit, trimmed payload and refresh", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  await openExplore(page);
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      backend.rows.cc_catalog_submissions = [
        ...exploreSubmissions(),
        {
          ...exploreSubmissions()[1],
          id: "new-contribution",
          title: "New paper dance",
        },
      ];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create challenge", exact: true }),
  );
  const dialog = page.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await expect(
    dialog.getByLabel("Challenge title", { exact: true }),
  ).toHaveAttribute("maxlength", "80");
  await expect(
    dialog.getByLabel("How does it work?", { exact: true }),
  ).toHaveAttribute("maxlength", "1200");
  await expect(
    dialog.getByLabel("Challenge title", { exact: true }),
  ).toHaveAttribute("required", "");
  await expect(dialog.getByLabel("Points", { exact: true })).toHaveAttribute(
    "min",
    "0",
  );
  await expect(dialog.getByLabel("Points", { exact: true })).toHaveAttribute(
    "max",
    "100",
  );
  await expect(dialog.getByLabel("Minutes", { exact: true })).toHaveAttribute(
    "min",
    "1",
  );
  await expect(dialog.getByLabel("Minutes", { exact: true })).toHaveAttribute(
    "max",
    "180",
  );
  await dialog
    .getByLabel("Challenge title", { exact: true })
    .fill("  New paper dance  ");
  await dialog
    .getByLabel("How does it work?", { exact: true })
    .fill("  Make paper dance.  ");
  await dialog
    .getByRole("combobox", { name: "Challenge type", exact: true })
    .selectOption("secret");
  await dialog.getByLabel("Points", { exact: true }).fill("0");
  await dialog.getByLabel("Minutes", { exact: true }).fill("9");
  await dialog.getByLabel("Player prep (optional)", { exact: true }).fill("3");
  await dialog
    .getByLabel("Player performance (optional)", { exact: true })
    .fill("4");
  await dialog
    .getByRole("combobox", { name: "Equipment", exact: true })
    .selectOption("some");
  const addedTags = [
    "solo",
    "performance",
    "photo",
    "video",
    "quick",
    "social",
  ];
  for (const tag of addedTags) {
    await activateByKeyboard(
      page,
      dialog.getByRole("button", { name: tag, exact: true }),
    );
  }
  await expect(
    dialog.locator('.btn--tag-option[aria-pressed="true"]'),
  ).toHaveCount(8);
  await expect(
    dialog.locator('.btn--tag-option[aria-pressed="false"]:enabled'),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  );
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator(".history-row").filter({ hasText: "New paper dance" }),
  ).toBeVisible();
  expect(requests.find((r) => r.method === "POST")?.body).toEqual({
    item_type: "challenge",
    title: "New paper dance",
    description: "Make paper dance.",
    payload: {
      kind: "secret",
      points: 0,
      minutes: 9,
      prepMinutes: 3,
      performanceMinutes: 4,
      tags: ["creative", "team", ...addedTags],
      setup: "some",
    },
    status: "pending",
    submitted_by: hostId,
  });
  backend.verify();
});

test("platform moderation preserves pending filters, reviewer timestamp and refresh visibility", async ({
  page,
}) => {
  const now = "2026-11-17T12:00:00.000Z";
  await page.clock.setFixedTime(new Date(now));
  const { backend, requests } = await installExploreBackend(page, true);
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      backend.rows.cc_catalog_submissions = exploreSubmissions().map((row) =>
        row.id === "pending-challenge" ? { ...row, status: "approved" } : row,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  await openExplore(page);
  const queue = page
    .locator(".content-panel--moderation-item")
    .filter({ hasText: "Pending contribution" });
  await activateByKeyboard(
    page,
    queue.getByRole("button", { name: "Approve", exact: true }),
  );
  await expect(card(page, "Pending contribution")).toBeVisible();
  await expect(queue).toHaveCount(0);
  const write = requests.find((r) => r.method === "PATCH");
  expect(write?.body).toEqual({
    status: "approved",
    reviewed_by: hostId,
    reviewed_at: now,
  });
  expect(Object.fromEntries(write?.url.searchParams ?? [])).toEqual({
    id: "eq.pending-challenge",
    status: "eq.pending",
  });
  backend.verify();
});

test("moderation failures retain the pending item for a reject retry", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page, true);
  await openExplore(page);
  const pending = page
    .locator(".content-panel--moderation-item")
    .filter({ hasText: "Pending contribution" });
  backend.failures.add("cc_catalog_submissions");
  await activateByKeyboard(
    page,
    pending.getByRole("button", { name: "Reject", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText("Fixture connection failed");
  await expect(
    pending.getByRole("button", { name: "Reject", exact: true }),
  ).toBeEnabled();
  expect(requests.find((r) => r.method === "PATCH")?.body).toMatchObject({
    status: "rejected",
    reviewed_by: hostId,
  });
  expect(
    Object.fromEntries(
      requests.find((r) => r.method === "PATCH")?.url.searchParams ?? [],
    ),
  ).toEqual({ id: "eq.pending-challenge", status: "eq.pending" });
  backend.failures.delete("cc_catalog_submissions");
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      backend.rows.cc_catalog_submissions = exploreSubmissions().map((row) =>
        row.id === "pending-challenge" ? { ...row, status: "rejected" } : row,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  await activateByKeyboard(
    page,
    pending.getByRole("button", { name: "Reject", exact: true }),
  );
  await expect(pending).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(requests.filter((r) => r.method === "PATCH")).toHaveLength(2);
  backend.verify();
});

test("read failures retain existing feedback and admin failures hide moderation", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  backend.failures.add("host_favourites");
  backend.failures.add("cc_is_platform_admin");
  await openExplore(page);
  await expect(page.getByRole("alert")).toHaveText(
    "Couldn't load your saved items. Check that the host planning migration has been run.",
  );
  await expect(
    page.getByRole("heading", { name: /Community review queue/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit challenge", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("approved challenge editing and confirmed deletion retain separate status filters", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page, true);
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fallback();
        return;
      }
      expect(["PATCH", "DELETE"]).toContain(method);
      backend.rows.cc_catalog_submissions =
        method === "DELETE"
          ? exploreSubmissions().filter(
              (row) => row.id !== "approved-challenge",
            )
          : exploreSubmissions().map((row) =>
              row.id === "approved-challenge"
                ? { ...row, title: "Updated paper tower" }
                : row,
            );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("paper tower");
  await activateByKeyboard(
    page,
    card(page, "Community paper tower").getByRole("button", {
      name: "Edit challenge",
      exact: true,
    }),
  );
  const dialog = page.getByRole("dialog", {
    name: "Edit challenge",
    exact: true,
  });
  await expect(
    dialog.getByLabel("Challenge title", { exact: true }),
  ).toHaveValue("Community paper tower");
  await expect(
    dialog.getByRole("combobox", { name: "Challenge type", exact: true }),
  ).toHaveValue("side");
  await expect(dialog.getByLabel("Points", { exact: true })).toHaveValue("12");
  await expect(
    dialog.getByRole("combobox", { name: "Equipment", exact: true }),
  ).toHaveValue("basic");
  await dialog
    .getByLabel("Challenge title", { exact: true })
    .fill("  Updated paper tower  ");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Save changes", exact: true }),
  );
  await expect(dialog).toHaveCount(0);
  const updated = card(page, "Updated paper tower");
  await expect(updated).toBeVisible();
  const patch = requests.find((r) => r.method === "PATCH");
  expect(Object.fromEntries(patch?.url.searchParams ?? [])).toEqual({
    id: "eq.approved-challenge",
    status: "eq.approved",
  });
  expect(patch?.body).toEqual({
    title: "Updated paper tower",
    description: "Build a paper tower together.",
    payload: {
      kind: "side",
      points: 12,
      minutes: 6,
      prepMinutes: 0,
      performanceMinutes: 0,
      tags: ["team"],
      setup: "basic",
    },
  });
  page.once("dialog", async (confirmation) => {
    expect(confirmation.message()).toBe(
      "Delete “Updated paper tower” from the shared challenge library?",
    );
    await confirmation.dismiss();
  });
  await activateByKeyboard(
    page,
    updated.getByRole("button", { name: "Delete", exact: true }),
  );
  await expect(updated).toBeVisible();
  expect(requests.filter((r) => r.method === "DELETE")).toEqual([]);
  page.once("dialog", (confirmation) => confirmation.accept());
  await activateByKeyboard(
    page,
    updated.getByRole("button", { name: "Delete", exact: true }),
  );
  await expect(updated).toHaveCount(0);
  const deletion = requests.find((r) => r.method === "DELETE");
  expect(Object.fromEntries(deletion?.url.searchParams ?? [])).toEqual({
    id: "eq.approved-challenge",
    status: "eq.approved",
  });
  expect(deletion?.body).toBeNull();
  backend.verify();
});

test("built-in, community and venue plan imports preserve route query contracts", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  backend.rows.host_games = [];
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("Obtain the best thing");
  await activateByKeyboard(
    page,
    card(page, "Obtain the best thing").getByRole("button", {
      name: "Add as main",
      exact: true,
    }),
  );
  await activateByKeyboard(
    page,
    page
      .getByRole("dialog", { name: "Add challenge to a game" })
      .getByRole("button", { name: "Create game" }),
  );
  await expect(page).toHaveURL(
    /#\/host\/games\/new\?exploreTask=.*&challengeKind=main$/,
  );
  await expect(page.getByLabel("Game name", { exact: true })).toBeVisible();
  const query = new URLSearchParams(new URL(page.url()).hash.split("?")[1]);
  const payload: unknown = JSON.parse(query.get("exploreTask") ?? "null");
  expect(payload).toMatchObject({
    id: "task-best-thing",
    title: "Obtain the best thing",
    kind: "main",
    points: 25,
  });
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("Community paper tower");
  await activateByKeyboard(
    page,
    card(page, "Community paper tower").getByRole("button", {
      name: "Add as side",
      exact: true,
    }),
  );
  await activateByKeyboard(
    page,
    page
      .getByRole("dialog", { name: "Add challenge to a game" })
      .getByRole("button", { name: "Create game" }),
  );
  await expect(page).toHaveURL(
    /#\/host\/games\/new\?communityTask=approved-challenge&challengeKind=side$/,
  );
  await expect(page.getByLabel("Game name", { exact: true })).toBeVisible();
  await openExplore(page);
  await selectCatalogueTab(page, /^Locations /);
  await page
    .getByRole("textbox", { name: "Search locations", exact: true })
    .fill("Community hall");
  await activateByKeyboard(
    page,
    card(page, "Community hall").getByRole("button", {
      name: "Use this venue idea",
      exact: true,
    }),
  );
  await expect(page).toHaveURL(
    /#\/host\/games\/new\?venueIdea=loc-community-hall$/,
  );
  await expect(page.getByLabel("Game name", { exact: true })).toBeVisible();
  backend.verify();
});

test("adds to one game directly and asks which game when there are several", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  const initialPlan = {
    customTasks: [],
    selectedTasks: [],
    selectedTaskIds: [],
    selectedMain: [],
    selectedSide: [],
    selectedSecret: [],
    schedule: [],
    sideChallenges: false,
    secretMissions: false,
    secretRevealMode: "scheduled",
    untouched: { retained: true },
  };
  const games = [
    {
      id: "one",
      name: "First game",
      status: "planned",
      plan_data: structuredClone(initialPlan),
      updated_at: "2030-01-01T00:00:00Z",
    },
  ];
  const writes: Array<{
    id: string | null;
    status: string | null;
    updatedAt: string | null;
    body: { plan_data: typeof initialPlan };
  }> = [];
  await page.route("**/rest/v1/cc_game_sessions**", async (route) => {
    if (route.request().method() === "GET") await route.fulfill({ json: [] });
    else await route.fallback();
  });
  await page.route("**/rest/v1/host_games**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    if (request.method() === "GET") {
      await route.fulfill({
        json: id ? games.filter((game) => game.id === id) : games,
      });
    } else if (request.method() === "PATCH") {
      const body = request.postDataJSON();
      writes.push({
        id: id ?? null,
        status: url.searchParams.get("status"),
        updatedAt: url.searchParams.get("updated_at"),
        body,
      });
      const game = games.find((item) => item.id === id);
      if (game) game.plan_data = body.plan_data;
      await route.fulfill({ json: game ? [{ id: game.id }] : [] });
    } else await route.fallback();
  });
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("Obtain the best thing");
  await activateByKeyboard(
    page,
    card(page, "Obtain the best thing").getByRole("button", {
      name: "Add as main",
      exact: true,
    }),
  );
  await expect(
    page.getByRole("status").filter({
      hasText: "Added “Obtain the best thing” to First game as main.",
    }),
  ).toBeVisible();
  expect(writes[0]).toMatchObject({
    id: "one",
    status: "eq.planned",
    updatedAt: "eq.2030-01-01T00:00:00Z",
    body: {
      plan_data: {
        selectedMain: ["explore-task-best-thing"],
        untouched: { retained: true },
        schedule: expect.arrayContaining([
          expect.objectContaining({
            type: "challenge",
            taskId: "explore-task-best-thing",
          }),
        ]),
      },
    },
  });
  expect(page.url()).toContain("#/host/explore");
  games.push({
    id: "two",
    name: "Second game",
    status: "draft",
    plan_data: structuredClone(initialPlan),
    updated_at: "2030-01-01T00:00:00Z",
  });
  await activateByKeyboard(
    page,
    card(page, "Obtain the best thing").getByRole("button", {
      name: "Add as secret",
      exact: true,
    }),
  );
  const dialog = page.getByRole("dialog", { name: "Add challenge to a game" });
  await expect(
    dialog.getByRole("button", { name: "Second game (draft)" }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Second game (draft)" }),
  );
  await expect(
    page.getByRole("status").filter({
      hasText: "Added “Obtain the best thing” to Second game as secret.",
    }),
  ).toBeVisible();
  expect(writes[1]).toMatchObject({
    id: "two",
    body: {
      plan_data: {
        secretMissions: true,
        selectedSecret: ["explore-task-best-thing"],
      },
    },
  });
  backend.verify();
});

test("adds built-in and community challenges as secret missions to a new plan", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  backend.rows.host_games = [];
  for (const [title, expectedId] of [
    ["Obtain the best thing", "explore-task-best-thing"],
    ["Community paper tower", "community-approved-challenge"],
  ] as const) {
    await openExplore(page);
    await page
      .getByRole("textbox", { name: "Search tasks", exact: true })
      .fill(title);
    await activateByKeyboard(
      page,
      card(page, title).getByRole("button", {
        name: "Add as secret",
        exact: true,
      }),
    );
    if (title === "Community paper tower") {
      backend.rows.cc_catalog_submissions = [exploreSubmissions()[0]];
    }
    await activateByKeyboard(
      page,
      page
        .getByRole("dialog", { name: "Add challenge to a game" })
        .getByRole("button", { name: "Create game" }),
    );
    await expect(page).toHaveURL(/challengeKind=secret$/);
    await expect(
      page.getByText(
        `Added “${title}” as a secret challenge. Finish the game details, then find it in Secret missions.`,
      ),
    ).toBeVisible();
    await page.getByLabel("Game name", { exact: true }).fill("Secret import");
    await page
      .getByRole("button", { name: /Next: Players/i })
      .first()
      .click();
    await activateByKeyboard(
      page,
      page
        .getByRole("navigation", { name: "Game setup steps" })
        .getByRole("button")
        .filter({ has: page.getByText("Secret missions", { exact: true }) }),
    );
    await expect(
      page.getByRole("heading", { name: "Selected secret missions" }),
    ).toBeVisible();
    await expect(
      page.locator(".selected-challenge").filter({ hasText: title }),
    ).toBeVisible();
    const previousWrites = backend.requests.filter(
      (r) => r.name === "host_games" && r.method === "POST",
    ).length;
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect
      .poll(
        () =>
          backend.requests.filter(
            (r) => r.name === "host_games" && r.method === "POST",
          ).length,
      )
      .toBe(previousWrites + 1);
    const writes = backend.requests.filter(
      (r) => r.name === "host_games" && r.method === "POST",
    );
    expect(writes[previousWrites]?.body).toMatchObject({
      plan_data: {
        secretMissions: true,
        selectedSecret: [expectedId],
        customTasks: [
          expect.objectContaining({
            id: expectedId,
            kind: "secret",
            evidenceRequired: true,
          }),
        ],
        schedule: expect.arrayContaining([
          expect.objectContaining({ type: "secret-reveal" }),
        ]),
      },
    });
  }
  backend.verify();
});

test("local game picker uses only local data", async ({ page }) => {
  const { backend } = await installExploreBackend(page);
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", { name: "Local catalogue", exact: true }),
  });
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Preview game selection" }),
  );
  const dialog = page.getByRole("dialog", { name: "Add challenge to a game" });
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Local crawl (planned)" }),
  );
  await expect(example.getByRole("status")).toHaveText(
    "Selected Local crawl locally.",
  );
  expect(
    backend.requests.filter((request) => request.name === "host_games"),
  ).toEqual([]);
  backend.verify();
});

test("local catalogue uses controlled views for saves, moderation and forms without backend access", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", { name: "Local catalogue", exact: true }),
  });
  await activateByKeyboard(
    page,
    example.getByRole("button", {
      name: "Save Obtain the best thing",
      exact: true,
    }),
  );
  await expect(
    example.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example
      .locator(".card--idea")
      .filter({
        has: page.getByRole("heading", {
          name: "Obtain the best thing",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Add as side", exact: true }),
  );
  await expect(example.getByRole("status")).toHaveText(
    "Selected Obtain the best thing as side locally.",
  );
  await activateByKeyboard(
    page,
    example
      .locator(".card--idea")
      .filter({
        has: page.getByRole("heading", {
          name: "Obtain the best thing",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Add as secret", exact: true }),
  );
  await expect(example.getByRole("status")).toHaveText(
    "Selected Obtain the best thing as secret locally.",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  const moderation = example.getByRole("checkbox", {
    name: "Show catalogue moderation",
    exact: true,
  });
  await tabTo(page, moderation, "backward");
  await page.keyboard.press("Space");
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Approve", exact: true }),
  );
  await expect(
    example.getByRole("heading", {
      name: "Local pending contribution",
      exact: true,
    }),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Create challenge", exact: true }),
  );
  const dialog = example.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await tabTo(
    page,
    dialog.getByRole("textbox", { name: "Challenge title", exact: true }),
  );
  await page.keyboard.type("Local paper dance");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Make paper dance together.");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  );
  await expect(dialog).toHaveCount(0);
  await expect(example.getByRole("status")).toHaveText(
    "Contribution saved locally.",
  );
  const pending = example.getByRole("checkbox", {
    name: "Simulate catalogue action pending",
    exact: true,
  });
  await tabTo(page, pending, "backward");
  await page.keyboard.press("Space");
  await expect(
    example.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Create challenge", exact: true }),
  );
  await expect(
    dialog.getByRole("button", { name: "Submitting…", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("textbox", { name: "Challenge title", exact: true }),
  ).toBeEnabled();
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  );
  const loading = example.getByRole("checkbox", {
    name: "Simulate catalogue loading",
    exact: true,
  });
  await tabTo(page, loading, "backward");
  await page.keyboard.press("Space");
  await expect(
    example.getByText("Checking your saved items…", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(example.getByRole("alert")).toHaveText("Local catalogue error");
  const shared = page.locator(".component-example").filter({
    has: page.getByRole("heading", { name: "Shared idea card", exact: true }),
  });
  await activateByKeyboard(
    page,
    shared.getByRole("button", { name: "Choose locally", exact: true }),
  );
  await expect(shared.getByRole("status")).toHaveText("Idea chosen locally.");
  await expect(
    shared.getByText("Side challenge", { exact: true }),
  ).toBeVisible();
  await expect(
    shared.getByText("Secret mission", { exact: true }),
  ).toBeVisible();
  await expect(shared.getByText("Outdoor idea", { exact: true })).toBeVisible();
  await expect(
    shared.getByText("Walking route", { exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("shared idea primitives preserve local save, disclosure, outline and pending keyboard paths", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  await page.goto("#/styleguide");
  const shared = page.locator(".component-example").filter({
    has: page.getByRole("heading", { name: "Shared idea card", exact: true }),
  });
  await activateByKeyboard(
    page,
    shared.getByRole("button", { name: "Save local idea", exact: true }),
  );
  await expect(
    shared.getByRole("button", { name: "Unsave local idea", exact: true }),
  ).toHaveAttribute("title", "Saved");
  const checks = shared
    .locator("summary")
    .filter({ hasText: "Local practical checks" });
  await activateByKeyboard(page, checks);
  await expect(
    shared.getByText("Choose a safe local place.", { exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    shared.getByRole("button", { name: "Preview local outline", exact: true }),
  );
  await expect(
    shared.getByRole("button", { name: "Hide local outline", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    shared.getByText("Meet the team", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(shared.getByText("Meet the team", { exact: true })).toHaveCount(
    0,
  );
  await tabTo(
    page,
    shared.getByRole("checkbox", {
      name: "Simulate local idea pending",
      exact: true,
    }),
  );
  await page.keyboard.press("Space");
  await expect(
    shared.getByRole("button", { name: "Unsave local idea", exact: true }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    shared.getByRole("button", { name: "Close local preview", exact: true }),
  );
  await expect(shared.getByRole("status")).toHaveText(
    "Preview close requested.",
  );
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("local shared review and history preserve keyboard actions, statuses and pending state without a backend", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Shared review and history",
      exact: true,
    }),
  });
  const approve = example.getByRole("button", {
    name: "Approve locally",
    exact: true,
  });
  const reject = example.getByRole("button", {
    name: "Reject locally",
    exact: true,
  });
  await activateByKeyboard(page, approve);
  await expect(example.getByRole("status")).toHaveText(
    "Local decision: approved.",
  );
  const pending = example.getByRole("checkbox", {
    name: "Simulate local review pending",
    exact: true,
  });
  await tabTo(page, pending, "backward");
  await page.keyboard.press("Space");
  await expect(approve).toBeDisabled();
  await expect(reject).toBeDisabled();
  await page.keyboard.press("Space");
  await activateByKeyboard(page, reject);
  await expect(example.getByRole("status")).toHaveText(
    "Local decision: rejected.",
  );
  await expect(
    example.getByText("The caller owns this review note.", { exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

test("contribution modal contains focus, restores its opener and exposes a reachable close action", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  await openExplore(page);
  const opener = page.getByRole("button", {
    name: "Create challenge",
    exact: true,
  });
  await activateByKeyboard(page, opener);
  const dialog = page.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await expect(dialog).toHaveJSProperty("tagName", "DIALOG");
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  expect(
    await close.evaluate((button) => {
      const r = button.getBoundingClientRect();
      return button.contains(
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
      );
    }),
  ).toBe(true);
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  backend.verify();
});

test("contribution modal shows and dismisses failed submission feedback inside the modal", async ({
  page,
}) => {
  const { backend } = await installExploreBackend(page);
  await openExplore(page);
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Contribution unavailable" }),
      });
    },
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create challenge", exact: true }),
  );
  const dialog = page.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await tabTo(page, dialog.getByLabel("Challenge title", { exact: true }));
  await page.keyboard.type("Local retry");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Retryable rules.");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  );
  await expect(dialog.getByRole("alert")).toHaveText(
    "Contribution unavailable",
  );
  await page
    .locator(".host-navigation a")
    .first()
    .evaluate((link) => link.focus());
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Dismiss error", exact: true }),
    "backward",
  );
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  );
  backend.verify();
});

test("contribution modal cancellation keeps a fresh draft safe from an old pending write", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  await openExplore(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/cc_catalog_submissions",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await gate;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "null",
      });
    },
  );
  const opener = page.getByRole("button", {
    name: "Create challenge",
    exact: true,
  });
  await activateByKeyboard(page, opener);
  const dialog = page.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await dialog
    .getByLabel("Challenge title", { exact: true })
    .fill("Old pending draft");
  await dialog
    .getByLabel("How does it work?", { exact: true })
    .fill("Old rules.");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  );
  await expect(
    dialog.getByRole("button", { name: "Submitting…", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByLabel("Challenge title", { exact: true }),
  ).toBeEnabled();
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeFocused();
  await expect(close).toBeInViewport();
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  );
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await dialog
    .getByLabel("Challenge title", { exact: true })
    .fill("Fresh draft");
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().includes("cc_catalog_submissions"),
  );
  release();
  await response;
  await page.waitForLoadState("networkidle");
  await expect(
    dialog.getByLabel("Challenge title", { exact: true }),
  ).toHaveValue("Fresh draft");
  await expect(
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  ).toBeEnabled();
  expect(
    requests.filter(
      (r) =>
        r.method === "GET" && r.url.pathname.endsWith("cc_catalog_submissions"),
    ),
  ).toHaveLength(1);
  await page.keyboard.press("Escape");
  backend.verify();
});

test("contribution modal backdrop dismissal clears edit identity before a new create", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page, true);
  await openExplore(page);
  await page
    .getByRole("textbox", { name: "Search tasks", exact: true })
    .fill("paper tower");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Edit challenge", exact: true }),
  );
  const edit = page.getByRole("dialog", {
    name: "Edit challenge",
    exact: true,
  });
  await expect(edit.getByLabel("Challenge title", { exact: true })).toHaveValue(
    "Community paper tower",
  );
  await page.mouse.click(4, 4);
  await expect(edit).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Create challenge", exact: true }),
  );
  const create = page.getByRole("dialog", {
    name: "Create a challenge",
    exact: true,
  });
  await expect(
    create.getByLabel("Challenge title", { exact: true }),
  ).toHaveValue("");
  await expect(
    create.getByRole("combobox", { name: "Challenge type", exact: true }),
  ).toHaveValue("main");
  await page.keyboard.press("Escape");
  expect(requests.every((r) => r.method === "GET")).toBe(true);
  backend.verify();
});

for (const local of [false, true]) {
  test(`catalogue tabs support keyboard selection and linked panels${local ? " in the local reference" : ""}`, async ({
    page,
  }) => {
    const { backend, requests } = await installExploreBackend(page);
    if (local) await page.goto("#/styleguide");
    else await openExplore(page);
    const scope = local
      ? page.locator(".component-example").filter({
          has: page.getByRole("heading", {
            name: "Local catalogue",
            exact: true,
          }),
        })
      : page.locator("main");
    const list = scope.getByRole("tablist", { name: "Explore catalogue" });
    const tasks = list.getByRole("tab", { name: /^Tasks/ });
    const locations = list.getByRole("tab", { name: /^Locations/ });
    const routes = list.getByRole("tab", { name: /^Routes/ });
    await expect(tasks).toHaveAttribute("tabindex", "0");
    await expect(locations).toHaveAttribute("tabindex", "-1");
    await expect(routes).toHaveAttribute("tabindex", "-1");
    const panels = scope.getByRole("tabpanel", { includeHidden: true });
    await expect(panels).toHaveCount(3);
    for (const tab of [tasks, locations, routes]) {
      const id = await tab.getAttribute("id");
      const controlled = await tab.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      expect(controlled).toBeTruthy();
      expect(
        await panels.evaluateAll(
          (elements, relationship) =>
            elements.some(
              (element) =>
                element.id === relationship.controlled &&
                element.getAttribute("aria-labelledby") === relationship.id,
            ),
          { id, controlled },
        ),
      ).toBe(true);
    }
    await tabTo(page, tasks);
    await page.keyboard.press("Tab");
    await expect(
      scope.getByRole("textbox", { name: "Search tasks" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(tasks).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(routes).toBeFocused();
    await expect(routes).toHaveAttribute("aria-selected", "true");
    await expect(
      scope.getByRole("tabpanel", { name: /^Routes/ }),
    ).toBeVisible();
    await expect(
      scope.getByRole("heading", { name: "Route templates", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(tasks).toBeFocused();
    await expect(tasks).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowRight");
    await expect(locations).toBeFocused();
    await expect(locations).toHaveAttribute("tabindex", "0");
    await expect(tasks).toHaveAttribute("tabindex", "-1");
    await expect(
      scope.getByRole("tabpanel", { name: /^Locations/ }),
    ).toBeVisible();
    await page.keyboard.press("Home");
    await expect(tasks).toBeFocused();
    await page.keyboard.press("End");
    await expect(routes).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(locations).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(locations).toBeFocused();
    await expect(locations).toHaveAttribute("aria-selected", "true");
    const activePanel = scope.getByRole("tabpanel");
    await tabTo(page, activePanel);
    await expect(activePanel).toBeFocused();
    expect(
      await activePanel.evaluate(
        (element) => getComputedStyle(element).outlineStyle,
      ),
    ).toBe("solid");
    await tasks.click();
    await expect(tasks).toHaveAttribute("tabindex", "0");
    await expect(tasks).toHaveAttribute("aria-selected", "true");
    await expect(scope.getByRole("tabpanel", { name: /^Tasks/ })).toBeVisible();
    if (local) expect(requests).toHaveLength(0);
    backend.verify();
  });
}
