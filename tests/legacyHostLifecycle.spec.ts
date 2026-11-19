import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installLegacyHostScores } from "./support/legacyHostScores";

async function openScores(page: Page) {
  await page.goto("#/admin");
  await expect(
    page.getByRole("heading", { name: "Run the game", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Scores", exact: true }),
  );
  await page
    .getByRole("combobox", { name: "Player", exact: true })
    .selectOption("p1");
}

test("legacy host lifecycle rejects repeated score activation until the first write settles", async ({
  page,
}) => {
  const { backend, awards } = await installLegacyHostScores(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/score_events",
    async (route) => {
      if (route.request().method() === "POST") await pending;
      await route.fallback();
    },
  );
  try {
    await openScores(page);
    const submit = page.getByRole("button", {
      name: "Award points",
      exact: true,
    });
    const firstRequest = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/rest/v1/score_events"),
    );
    await activateByKeyboard(page, submit);
    await firstRequest;
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel("Points", { exact: true })).toBeEditable();
    const repeat = page
      .waitForRequest(
        (request) =>
          request.method() === "POST" &&
          request.url().includes("/rest/v1/score_events"),
        { timeout: 500 },
      )
      .then(
        () => true,
        () => false,
      );
    await page.keyboard.press("Enter");
    expect(await repeat).toBe(false);
    const completed = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/rest/v1/score_events"),
    );
    release();
    await completed;
    await page.waitForLoadState("networkidle");
    expect(awards).toHaveLength(1);
    await page.keyboard.press("Enter");
    await expect.poll(() => awards.length).toBe(2);
    backend.verify();
  } finally {
    release();
  }
});

test("legacy host lifecycle ignores an obsolete score failure after leaving the workspace", async ({
  page,
}) => {
  const { backend } = await installLegacyHostScores(page);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/rest/v1/score_events",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await pending;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Obsolete award failure" }),
      });
    },
  );
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.accept();
  });
  try {
    await openScores(page);
    const issued = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/rest/v1/score_events"),
    );
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Award points", exact: true }),
    );
    await issued;
    await page.evaluate(() => {
      document.documentElement.dataset.legacyHostDocument = "retained";
      window.location.hash = "/styleguide";
    });
    await expect(page.locator(".styleguide")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-legacy-host-document",
      "retained",
    );
    const completed = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/rest/v1/score_events"),
    );
    release();
    await completed;
    await page.waitForLoadState("networkidle");
    expect(alerts).toEqual([]);
    backend.verify();
  } finally {
    release();
  }
});
