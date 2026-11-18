import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installExploreBackend } from "./support/hostExplore";

test("an old initial favourite read preserves a completed save and unrelated saved tasks", async ({
  page,
}) => {
  const { backend, requests } = await installExploreBackend(page);
  const initialFavourites = [
    {
      id: "existing-noise",
      item_type: "task",
      item_id: "task-best-noise",
      item_data: {},
    },
  ];
  backend.rows.host_favourites = initialFavourites;
  let release = () => {};
  const read = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/host_favourites",
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await read;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(initialFavourites),
      });
    },
  );
  try {
    await page.goto("#/host/explore");
    await expect(
      page.getByRole("heading", { name: "Community paper tower", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Checking your saved items…", { exact: true }),
    ).toBeVisible();
    await activateByKeyboard(
      page,
      page.getByRole("button", {
        name: "Save Obtain the best thing",
        exact: true,
      }),
    );
    const saved = page.getByRole("button", {
      name: "Unsave Obtain the best thing",
      exact: true,
    });
    await expect(saved).toBeEnabled();
    release();
    await expect(
      page.getByText("Checking your saved items…", { exact: true }),
    ).toHaveCount(0);
    await expect(saved).toBeEnabled();
    await expect(
      page.getByRole("button", {
        name: "Unsave Make the best noise",
        exact: true,
      }),
    ).toBeEnabled();
    expect(
      requests.filter((request) => request.method === "POST"),
    ).toHaveLength(1);
    expect(requests.filter((request) => request.method === "GET")).toHaveLength(
      2,
    );
    backend.verify();
  } finally {
    release();
  }
});
