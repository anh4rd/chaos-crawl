import { expect, test } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend, sessionCode } from "./support/sessionBackend";
import { seedPrivateMissions, seenMissionKey } from "./support/privateMissions";

test("participant lobby feedback and keyboard recovery preserve the current join target and credential", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { lobby: true });
  await page.goto(`#/play/${sessionCode}`);
  await expect(
    page.getByRole("heading", { name: "Waiting for the host…", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("0 players in teams · 12 player limit", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Live updates enabled", { exact: false }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Need to rejoin on this device?",
      exact: true,
    }),
  );
  await expect(page).toHaveURL(/\/join\?code=123456&returning=1$/);
  await expect(
    page.getByRole("heading", { name: "Back for more chaos", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-session-player:123456"),
    ),
  ).toBe("test-player-token");
  expect(
    backend.requests.filter((request) =>
      request.name.includes("join_game_session"),
    ),
  ).toEqual([]);
  backend.verify();
});

test("completed participants open the existing final leaderboard through the native keyboard link", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.session.status = "completed";
  await page.goto(`#/play/${sessionCode}`);
  const link = page.getByRole("link", {
    name: "See the final leaderboard →",
    exact: true,
  });
  await expect(link).toHaveAttribute(
    "href",
    `#/play/${sessionCode}/leaderboard`,
  );
  await activateByKeyboard(page, link);
  await expect(page).toHaveURL(/\/play\/123456\/leaderboard$/);
  await expect(page.getByText("Pat", { exact: true }).first()).toBeVisible();
  expect(
    backend.requests.filter(
      (request) =>
        request.name.includes("vote") || request.name.includes("submit"),
    ),
  ).toEqual([]);
  backend.verify();
});

test("acknowledged private mission feed survives section navigation without another announcement or write", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const missions = seedPrivateMissions(backend);
  await page.addInitScript(
    ({ key, ids }) => localStorage.setItem(key, JSON.stringify(ids)),
    {
      key: seenMissionKey,
      ids: missions.map((mission) => mission.assignment_id),
    },
  );
  await page.goto(`#/play/${sessionCode}`);
  const feed = page.getByRole("region", {
    name: "Your private secret missions",
    exact: true,
  });
  await expect(
    feed.getByRole("heading", { name: "Lead a conga line", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: /SECRET MISSION/ }),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("link", { name: "Scores", exact: true }).first(),
  );
  await expect(feed).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("link", { name: "Game", exact: true }).first(),
  );
  await expect(
    feed.getByRole("heading", { name: "Lead a conga line", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: /SECRET MISSION/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBe('["private-one"]');
  expect(
    backend.requests.filter(
      (request) =>
        request.name.includes("submit") || request.name.includes("vote"),
    ),
  ).toEqual([]);
  backend.verify();
});

test("local participant status reference keeps recovery and final links in local state", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const reference = page
    .getByRole("heading", {
      name: "Shared participant status and recovery",
      exact: true,
    })
    .locator("xpath=ancestor::article[1]");
  await expect(
    reference.getByText("4 players in teams · 12 player limit", {
      exact: true,
    }),
  ).toBeVisible();
  await tabTo(
    page,
    reference.getByRole("checkbox", { name: "Sample sync time", exact: true }),
  );
  await page.keyboard.press("Space");
  await expect(
    reference.getByText("· synced 12:34:56", { exact: true }),
  ).toBeVisible();
  await tabTo(
    page,
    reference.getByRole("checkbox", {
      name: "Sample completed state",
      exact: true,
    }),
    "backward",
  );
  await page.keyboard.press("Space");
  await activateByKeyboard(
    page,
    reference.getByRole("link", {
      name: "See the final leaderboard →",
      exact: true,
    }),
  );
  await expect(
    reference.getByText("Sample leaderboard action stays local.", {
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    reference.getByRole("button", {
      name: "Need to rejoin on this device?",
      exact: true,
    }),
  );
  await expect(
    reference.getByText("Sample recovery action stays local.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/styleguide$/);
  expect(backend.requests).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  backend.verify();
});
