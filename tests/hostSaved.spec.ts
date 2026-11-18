import { expect, test } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSavedBackend } from "./support/hostSaved";
import { hostId } from "./support/sessionBackend";

const queryFailure =
  "Couldn't load saved items. Check that the host planning migration has been run.";

test("saved items preserve read filters/order, fallback copy and native keyboard filtering", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  await page.goto("#/host/saved");
  const cards = page.locator(".saved-item-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.getByRole("heading")).toHaveText([
    "Conga challenge",
    "The Corner",
    "Two stops",
    "Saved idea",
  ]);
  await expect(
    page.getByText("First pub → Last pub", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("★ 0 points", { exact: true })).toBeVisible();
  const filters = page.getByRole("group", {
    name: "Saved items filter",
    exact: true,
  });
  await expect(
    filters.getByRole("button", { name: "Everything 4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const reads = requests.filter((request) => request.method === "GET");
  expect(reads.length).toBeGreaterThan(0);
  for (const read of reads)
    expect(Object.fromEntries(read.url.searchParams)).toEqual({
      select: "*",
      host_id: `eq.${hostId}`,
      order: "created_at.desc",
    });
  const firstIdentity = backend.requests.findIndex(
    (request) => request.name === "user",
  );
  const firstSavedRead = backend.requests.findIndex(
    (request) => request.name === "host_favourites",
  );
  expect(firstIdentity).toBeGreaterThanOrEqual(0);
  expect(firstSavedRead).toBeGreaterThan(firstIdentity);
  for (const [label, count] of [
    ["Tasks", 1],
    ["Locations", 2],
    ["Routes", 1],
  ] as const) {
    const filter = filters.getByRole("button", { name: label, exact: true });
    await activateByKeyboard(page, filter);
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(cards).toHaveCount(count);
  }
  await activateByKeyboard(
    page,
    filters.getByRole("button", { name: "Everything 4", exact: true }),
  );
  await expect(cards).toHaveCount(4);
  expect(requests.every((request) => request.method === "GET")).toBe(true);
  backend.verify();
});

test("pending saved-item reads show loading and retain a filter selected before completion", async ({
  page,
}) => {
  const { backend } = await installSavedBackend(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/host_favourites?**", async (route) => {
    if (route.request().method() === "GET") await gate;
    await route.fallback();
  });
  try {
    await page.goto("#/host/saved");
    await expect(
      page.getByText("Loading saved items…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nothing saved yet", exact: true }),
    ).toHaveCount(0);
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Tasks", exact: true }),
    );
    release();
    await expect(
      page.getByRole("heading", { name: "Conga challenge", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".saved-item-card")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Tasks", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    backend.verify();
  } finally {
    release();
  }
});

test("saved-item removal waits for the response, keeps its filter and changes only the chosen item", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let removing = false;
  await page.route("**/rest/v1/host_favourites?**", async (route) => {
    if (route.request().method() === "DELETE") {
      removing = true;
      await gate;
    }
    await route.fallback();
  });
  try {
    await page.goto("#/host/saved");
    await expect(page.locator(".saved-item-card")).toHaveCount(4);
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Tasks", exact: true }),
    );
    const remove = page.getByRole("button", {
      name: "Remove Conga challenge from saved items",
      exact: true,
    });
    await activateByKeyboard(page, remove);
    await expect.poll(() => removing).toBe(true);
    await expect(
      page.getByRole("heading", { name: "Conga challenge", exact: true }),
    ).toBeVisible();
    await expect(remove).toBeEnabled();
    release();
    await expect(
      page.getByRole("heading", { name: "Nothing saved yet", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tasks", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Everything 3", exact: true }),
    );
    await expect(
      page.locator(".saved-item-card").getByRole("heading"),
    ).toHaveText(["The Corner", "Two stops", "Saved idea"]);
    const deletes = requests.filter((request) => request.method === "DELETE");
    expect(deletes).toHaveLength(1);
    expect(Object.fromEntries(deletes[0].url.searchParams)).toEqual({
      id: "eq.saved-task",
    });
    expect(
      backend.requests.find(
        (request) =>
          request.name === "host_favourites" && request.method === "DELETE",
      )?.body,
    ).toBeNull();
    backend.verify();
  } finally {
    release();
  }
});

test("failed saved-item removal retains the card and allows retrying the same delete", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  await page.goto("#/host/saved");
  await expect(page.locator(".saved-item-card")).toHaveCount(4);
  backend.failures.add("host_favourites");
  const remove = page.getByRole("button", {
    name: "Remove Two stops from saved items",
    exact: true,
  });
  await activateByKeyboard(page, remove);
  await expect(
    page.getByText("Fixture connection failed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".saved-item-card")).toHaveCount(4);
  backend.failures.delete("host_favourites");
  await activateByKeyboard(page, remove);
  await expect(page.locator(".saved-item-card")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Two stops", exact: true }),
  ).toHaveCount(0);
  const deletes = requests.filter((request) => request.method === "DELETE");
  expect(deletes).toHaveLength(2);
  for (const request of deletes)
    expect(Object.fromEntries(request.url.searchParams)).toEqual({
      id: "eq.saved-route",
    });
  backend.verify();
});

test("saved-item read errors keep the existing migration feedback and filter controls", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  backend.failures.add("host_favourites");
  await page.goto("#/host/saved");
  await expect(page.getByText(queryFailure, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nothing saved yet", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Locations", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Locations", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(requests.every((request) => request.method === "GET")).toBe(true);
  backend.verify();
});

test("missing current host identity avoids reading saved rows", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  backend.failures.add("user");
  await page.goto("#/host/saved");
  await expect(
    page.getByText("Please log in again.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading saved items…", { exact: true }),
  ).toHaveCount(0);
  expect(requests).toEqual([]);
  backend.verify();
});

test("an empty saved collection remains a read-only filterable empty state", async ({
  page,
}) => {
  const { backend, requests } = await installSavedBackend(page);
  backend.rows.host_favourites = [];
  await page.goto("#/host/saved");
  await expect(
    page.getByRole("heading", { name: "Nothing saved yet", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Routes", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Nothing saved yet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Everything 0", exact: true }),
  ).toBeVisible();
  expect(requests.every((request) => request.method === "GET")).toBe(true);
  backend.verify();
});

test("local saved-item reference filters, removes and toggles loading by keyboard without backend access", async ({
  page,
}) => {
  const { backend } = await installSavedBackend(page);
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Local saved items",
      exact: true,
    }),
  });
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Tasks", exact: true }),
  );
  await expect(
    example.getByRole("heading", { name: "Sample task", exact: true }),
  ).toBeVisible();
  await expect(
    example.getByRole("heading", { name: "Sample venue", exact: true }),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    example.getByRole("button", {
      name: "Remove Sample task from saved items",
      exact: true,
    }),
  );
  await expect(
    example.getByRole("heading", { name: "Nothing saved yet", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Everything 2", exact: true }),
  );
  await expect(example.locator(".saved-item-card")).toHaveCount(2);
  const pending = example.getByRole("checkbox", {
    name: "Simulate saved-items loading",
    exact: true,
  });
  await tabTo(page, pending, "backward");
  await page.keyboard.press("Space");
  await expect(
    example.getByText("Loading saved items…", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(example.locator(".saved-item-card")).toHaveCount(2);
  const feedback = example.getByRole("checkbox", {
    name: "Simulate saved-items error",
    exact: true,
  });
  await tabTo(page, feedback);
  await page.keyboard.press("Space");
  await expect(
    example.getByText("Local saved-items error", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    example.getByText("Local saved-items error", { exact: true }),
  ).toHaveCount(0);
  expect(backend.requests).toEqual([]);
  backend.verify();
});
