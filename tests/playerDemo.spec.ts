import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

async function openDemo(page: Page) {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/demo/player");
  const tour = page.getByRole("dialog", { name: /PLAYER DEMO/ });
  await expect(tour).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tour).toHaveCount(0);
  await expect(page.getByText("0/6 files", { exact: true })).toBeVisible();
  return backend;
}

function navigation(page: Page) {
  return page.getByRole("navigation", { name: "Demo game pages", exact: true });
}

async function expectLocalOnly(
  page: Page,
  backend: Awaited<ReturnType<typeof installSessionBackend>>,
) {
  await expect(page).toHaveURL(/\/demo\/player$/);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(backend.requests).toEqual([]);
  backend.verify();
}

test("demo navigation keeps all pages local and preserves the static score reference", async ({
  page,
}) => {
  const backend = await openDemo(page);
  await activateByKeyboard(
    page,
    navigation(page).getByRole("button", { name: "Scores", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  const ranks = page.locator(".standings-row");
  await expect(ranks).toHaveCount(5);
  await expect(ranks.locator(".standings-row__score strong")).toHaveText([
    "120",
    "110",
    "90",
    "80",
    "70",
  ]);
  await activateByKeyboard(
    page,
    navigation(page).getByRole("button", { name: "Challenges", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Side challenges", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Best team entrance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Make your team laugh", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Open the final vote", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Fan favourite", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    navigation(page).getByRole("button", { name: "Game", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Obtain the best thing", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("0/6 files", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Copy sample game code", exact: true }),
  );
  await expectLocalOnly(page, backend);
});

for (const action of ["complete", "challenge", "vote"] as const) {
  test(`demo ${action} action changes only its local sample flag and survives section changes`, async ({
    page,
  }) => {
    const backend = await openDemo(page);
    if (action !== "complete") {
      await activateByKeyboard(
        page,
        navigation(page).getByRole("button", {
          name: "Challenges",
          exact: true,
        }),
      );
    }
    if (action === "vote") {
      await activateByKeyboard(
        page,
        page.getByRole("button", { name: "Open the final vote", exact: true }),
      );
      await activateByKeyboard(
        page,
        page.getByRole("button", { name: "Vote for this entry", exact: true }),
      );
    } else if (action === "challenge") {
      await activateByKeyboard(
        page,
        page
          .getByRole("button", { name: "View challenge", exact: true })
          .first(),
      );
    } else {
      await activateByKeyboard(
        page,
        page.getByRole("button", {
          name: "Mark challenge complete",
          exact: true,
        }),
      );
    }
    await activateByKeyboard(
      page,
      navigation(page).getByRole("button", { name: "Game", exact: true }),
    );
    await expect(page.getByText("1/6 files", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Sample upload selected — demo only.", { exact: true }),
    ).toBeVisible();
    await activateByKeyboard(
      page,
      navigation(page).getByRole("button", { name: "Scores", exact: true }),
    );
    await activateByKeyboard(
      page,
      navigation(page).getByRole("button", { name: "Game", exact: true }),
    );
    await expect(page.getByText("1/6 files", { exact: true })).toBeVisible();
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Restart tour", exact: true }),
    );
    await expect(
      page.getByRole("dialog", { name: /PLAYER DEMO/ }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("1/6 files", { exact: true })).toBeVisible();
    await expectLocalOnly(page, backend);
  });
}

test("demo file input opens by keyboard, accepts a local selection and resets on reload", async ({
  page,
}) => {
  const backend = await openDemo(page);
  const input = page.locator('input[type="file"]');
  await expect(input).toHaveAttribute("accept", "image/*,video/*");
  await tabTo(page, input);
  const choosing = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await choosing).setFiles("public/chaos-logo.png");
  await expect(input).toHaveValue(/chaos-logo\.png$/);
  await expect(page.getByText("1/6 files", { exact: true })).toBeVisible();
  await expectLocalOnly(page, backend);
  await page.reload();
  await expect(page.getByRole("dialog", { name: /PLAYER DEMO/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("0/6 files", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Sample upload selected — demo only.", { exact: true }),
  ).toHaveCount(0);
  await expectLocalOnly(page, backend);
});

test("demo tour reaches every visible target by keyboard and restores the restart trigger", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/demo/player");
  const tour = page.getByRole("dialog", { name: /PLAYER DEMO/ });
  await expect(
    tour.getByRole("button", { name: "Close tour", exact: true }),
  ).toBeFocused();
  const targets = [
    "demo-profile",
    "demo-navigation",
    "demo-challenge",
    "demo-upload",
    "demo-leaderboard",
    "demo-side",
    "demo-final",
  ];
  for (let index = 0; index < targets.length; index += 1) {
    const target = page.locator(`[data-tour="${targets[index]}"]`);
    await expect(target).toHaveClass(/tour-highlight/);
    await expect(target).toBeVisible();
    await expect(target).toBeInViewport();
    await expect(tour).toContainText(`${index + 1} OF ${targets.length}`);
    await activateByKeyboard(
      page,
      tour.getByRole("button", {
        name: index === targets.length - 1 ? "Finish" : "Next",
        exact: true,
      }),
    );
  }
  await expect(tour).toHaveCount(0);
  await expect(page.locator(".tour-highlight")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Fan favourite", exact: true }),
  ).toBeVisible();
  const restart = page.getByRole("button", {
    name: "Restart tour",
    exact: true,
  });
  await activateByKeyboard(page, restart);
  await expect(tour).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(restart).toBeFocused();
  await expect(page.locator(".tour-highlight")).toHaveCount(0);
  await expectLocalOnly(page, backend);
});
