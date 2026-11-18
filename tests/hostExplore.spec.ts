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

// Native tab buttons currently retain ordinary Tab navigation; arrow-key behavior
// and the existing modal focus lifecycle need separate accessibility slices.
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
  await expect(page.locator(".host-my-submission")).toHaveCount(2);
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
  await activateByKeyboard(
    page,
    page.getByRole("tab", { name: /^Locations / }),
  );
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
  await activateByKeyboard(page, page.getByRole("tab", { name: /^Routes / }));
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
  await activateByKeyboard(
    page,
    page.getByRole("tab", { name: /^Locations / }),
  );
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
  await activateByKeyboard(page, page.getByRole("tab", { name: /^Routes / }));
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
    dialog.locator('.host-community-tag-option[aria-pressed="true"]'),
  ).toHaveCount(8);
  await expect(
    dialog.locator('.host-community-tag-option[aria-pressed="false"]:enabled'),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Submit for review", exact: true }),
  );
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator(".host-my-submission").filter({ hasText: "New paper dance" }),
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
    .locator(".host-community-review-card")
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
    .locator(".host-community-review-card")
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
  await expect(page).toHaveURL(
    /#\/host\/games\/new\?communityTask=approved-challenge&challengeKind=side$/,
  );
  await expect(page.getByLabel("Game name", { exact: true })).toBeVisible();
  await openExplore(page);
  await activateByKeyboard(
    page,
    page.getByRole("tab", { name: /^Locations / }),
  );
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
  expect(backend.requests).toEqual([]);
  backend.verify();
});
