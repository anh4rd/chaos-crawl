import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installExploreBackend } from "./support/hostExplore";

function deferredResponse() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

async function openExplore(page: Page) {
  await page.goto("#/host/explore");
  await expect(
    page.getByRole("heading", { name: "Community paper tower", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Checking your saved items…", { exact: true }),
  ).toHaveCount(0);
}

test("overlapping catalogue saves retain each native button's independent busy state", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  const first = deferredResponse();
  const second = deferredResponse();
  await page.route(
    (url) => url.pathname === "/rest/v1/host_favourites",
    async (route) => {
      if (route.request().method() === "POST") {
        const body: unknown = route.request().postDataJSON();
        if (body && typeof body === "object" && "item_id" in body) {
          if (body.item_id === "task-best-thing") await first.promise;
          if (body.item_id === "task-best-noise") await second.promise;
        }
      }
      await route.fallback();
    },
  );
  try {
    await openExplore(page);
    const firstSave = page.getByRole("button", {
      name: "Save Obtain the best thing",
      exact: true,
    });
    const secondSave = page.getByRole("button", {
      name: "Save Make the best noise",
      exact: true,
    });
    await activateByKeyboard(page, firstSave);
    await expect(firstSave).toBeDisabled();
    await activateByKeyboard(page, secondSave);
    await expect
      .poll(
        () => requests.filter((request) => request.method === "POST").length,
      )
      .toBe(2);
    await expect(firstSave).toBeDisabled();
    await expect(secondSave).toBeDisabled();
    first.release();
    await expect(
      page.getByRole("button", {
        name: "Unsave Obtain the best thing",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(secondSave).toBeDisabled();
    second.release();
    await expect(
      page.getByRole("button", {
        name: "Unsave Make the best noise",
        exact: true,
      }),
    ).toBeEnabled();
    expect(
      requests.filter((request) => request.method === "POST"),
    ).toHaveLength(2);
    backend.verify();
  } finally {
    first.release();
    second.release();
  }
});

test("repeated route footer activation cannot issue another save while its request is pending", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  const save = deferredResponse();
  await page.route(
    (url) => url.pathname === "/rest/v1/host_favourites",
    async (route) => {
      if (route.request().method() === "POST") await save.promise;
      await route.fallback();
    },
  );
  try {
    await openExplore(page);
    const tabs = page.getByRole("tablist", { name: "Explore catalogue" });
    await tabTo(page, tabs.getByRole("tab", { selected: true }));
    await page.keyboard.press("End");
    await expect(tabs.getByRole("tab", { name: /^Routes/ })).toBeFocused();
    const card = page.locator(".card--idea").filter({
      has: page.getByRole("heading", {
        name: "The classic three-stop",
        exact: true,
      }),
    });
    const footer = card.getByRole("button", {
      name: "Save route",
      exact: true,
    });
    await activateByKeyboard(page, footer);
    await expect(
      card.getByRole("button", {
        name: "Save The classic three-stop",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(footer).toBeEnabled();
    await page.keyboard.press("Enter");
    await expect
      .poll(
        () => requests.filter((request) => request.method === "POST").length,
      )
      .toBe(1);
    save.release();
    await expect(
      card.getByRole("button", {
        name: "Unsave The classic three-stop",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(
      card.getByRole("button", { name: "Saved route", exact: true }),
    ).toBeEnabled();
    expect(
      requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
    backend.verify();
  } finally {
    save.release();
  }
});
