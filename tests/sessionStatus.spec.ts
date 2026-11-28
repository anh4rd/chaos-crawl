import { expect, test } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend, sessionCode } from "./support/sessionBackend";
import { seedPrivateMissions, seenMissionKey } from "./support/privateMissions";

test("the local session preview hides player chrome during the lobby only", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const preview = page
    .locator('[data-tour="example-session-content"]')
    .locator("..");
  await page.getByLabel("Phase", { exact: true }).selectOption("lobby");
  await expect(preview.locator(".session-profile")).toHaveCount(0);
  await expect(
    preview.getByRole("navigation", { name: "Game pages" }),
  ).toHaveCount(0);
  await expect(preview.locator(".session-titlebar")).toBeVisible();
  await expect(
    preview.getByRole("progressbar", { name: "Join progress" }),
  ).toBeVisible();
  await page.getByLabel("Preview as", { exact: true }).selectOption("host");
  await expect(preview.locator(".session-profile")).toBeVisible();
  await expect(
    preview.getByRole("navigation", { name: "Game pages" }),
  ).toBeVisible();
  await page.getByLabel("Preview as", { exact: true }).selectOption("player");
  await page.getByLabel("Phase", { exact: true }).selectOption("live");
  await expect(preview.locator(".session-profile")).toBeVisible();
  await expect(
    preview.getByRole("navigation", { name: "Game pages" }),
  ).toBeVisible();
  backend.verify();
});

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
      name: "Reconnect",
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

for (const section of [
  "game",
  "leaderboard",
  "side-challenges",
  "final",
  "recap",
] as const) {
  test(`reconnect is available on the player ${section} page`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page);
    if (section === "final") {
      backend.session.final_gallery_open = true;
      backend.responses.cc_player_get_session_final_round_gallery = null;
    }
    if (section === "recap") backend.session.status = "completed";
    await page.goto(`#/play/${sessionCode}/${section}`);
    await expect(
      page.getByRole("button", { name: "Reconnect", exact: true }),
    ).toBeVisible();
    backend.verify();
  });
}

test("reconnect remains available during secret review but not in host mode", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.responses.cc_player_get_session_secret_review = {
    open: true,
    voting_open: true,
    mission: null,
    my_final_reviews: [],
  };
  await page.goto(`#/play/${sessionCode}/game`);
  await expect(
    page.getByRole("heading", {
      name: "Secret mission review is loading…",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reconnect", exact: true }),
  ).toBeVisible();
  await page.goto(`#/play/${sessionCode}/game?hostEmbed=1`);
  await expect(
    page.getByRole("heading", {
      name: "Secret mission review is loading…",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reconnect", exact: true }),
  ).toHaveCount(0);
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
  const statusCard = reference.locator(".session-state").first();
  const banner = page.locator(".feature-banner").first();
  const frameStyles = (element: Element) => {
    const style = getComputedStyle(element);
    const rays = getComputedStyle(element, "::after");
    return {
      background: style.backgroundImage,
      border: style.border,
      radius: style.borderRadius,
      shadow: style.boxShadow,
      rays: rays.backgroundImage,
      mask: rays.maskImage,
    };
  };
  expect(await statusCard.evaluate(frameStyles)).toEqual(
    await banner.evaluate(frameStyles),
  );
  const headingStyles = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      font: style.font,
      color: style.color,
      shadow: style.textShadow,
    };
  };
  expect(await statusCard.locator("h2").evaluate(headingStyles)).toEqual(
    await banner.locator("h2").evaluate(headingStyles),
  );
  const recovery = reference.locator(".session-state").filter({
    has: page.getByRole("heading", { name: "Rejoin the chaos" }),
  });
  const copyBox = await recovery.locator("p").boundingBox();
  const rejoin = recovery.getByRole("link", { name: "Rejoin game" });
  const linkBox = await rejoin.boundingBox();
  expect(copyBox).not.toBeNull();
  expect(linkBox).not.toBeNull();
  if (!copyBox || !linkBox) throw new Error("Missing recovery content");
  expect(linkBox.y).toBeGreaterThanOrEqual(copyBox.y + copyBox.height);
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
      name: "Reconnect",
      exact: true,
    }),
  );
  await expect(
    reference.getByText("Sample recovery action stays local.", { exact: true }),
  ).toBeVisible();
  await activateByKeyboard(page, rejoin, "backward");
  await expect(
    reference.getByText("Sample rejoin action stays local.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/styleguide$/);
  expect(backend.requests).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  backend.verify();
});
