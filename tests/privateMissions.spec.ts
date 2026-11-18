import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import {
  dismissedMissionKey,
  expectPrivateMissionReadsOnly,
  privateMissionFixture,
  privateMissionReward,
  privateMissionReview,
  seedPrivateMissions,
  selectMissionDescription,
  seenMissionKey,
} from "./support/privateMissions";

function announcement(page: Page, title = "Lead a conga line") {
  return page.getByRole("dialog", { name: title, exact: true });
}

async function refreshPlayer(
  page: Page,
  backend: Awaited<ReturnType<typeof installSessionBackend>>,
) {
  const reads = backend.requests.filter(
    (request) => request.name === "cc_player_get_session_secret_review",
  ).length;
  await page.clock.runFor(3100);
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) => request.name === "cc_player_get_session_secret_review",
        ).length,
    )
    .toBeGreaterThan(reads);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
});

test("mission announcements require Play, preserve incoming order and remember seen assignments after reload", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend, [
    privateMissionFixture(),
    privateMissionFixture({
      assignment_id: "private-two",
      title: "Make a secret toast",
    }),
  ]);
  await page.goto("#/play/123456");
  await expect(announcement(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.mouse.click(1, 1);
  await expect(announcement(page)).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBeNull();
  await activateByKeyboard(
    page,
    announcement(page).getByRole("button", { name: "Play", exact: true }),
  );
  await expect(announcement(page, "Make a secret toast")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBe('["private-one"]');
  await activateByKeyboard(
    page,
    announcement(page, "Make a secret toast").getByRole("button", {
      name: "Play",
      exact: true,
    }),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBe('["private-one","private-two"]');
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expectPrivateMissionReadsOnly(backend);
});

for (const storage of ["malformed", "unavailable"] as const) {
  test(`${storage} mission storage keeps acknowledgement in memory for the current visit`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page);
    seedPrivateMissions(backend);
    await page.addInitScript(
      ({ key, storage }) => {
        if (storage === "malformed") {
          localStorage.setItem(key, "{");
          return;
        }
        const get = Storage.prototype.getItem;
        const set = Storage.prototype.setItem;
        Storage.prototype.getItem = function (this: Storage, name: string) {
          if (name === key) throw new Error("Fixture storage is unavailable");
          return get.call(this, name);
        };
        Storage.prototype.setItem = function (
          this: Storage,
          name: string,
          value: string,
        ) {
          if (name === key) throw new Error("Fixture storage is unavailable");
          set.call(this, name, value);
        };
      },
      { key: seenMissionKey, storage },
    );
    await page.goto("#/play/123456");
    await activateByKeyboard(
      page,
      announcement(page).getByRole("button", { name: "Play", exact: true }),
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await refreshPlayer(page, backend);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(announcement(page)).toBeVisible();
    expectPrivateMissionReadsOnly(backend);
  });
}

test("secret-review takeover removes an unacknowledged announcement and restores it when review closes", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend);
  await page.goto("#/play/123456");
  await expect(announcement(page)).toBeVisible();
  backend.responses.cc_player_get_session_secret_review =
    privateMissionReview();
  await refreshPlayer(page, backend);
  await expect(
    page.getByRole("heading", {
      name: "Secret mission review is loading…",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBeNull();
  backend.responses.cc_player_get_session_secret_review = null;
  await refreshPlayer(page, backend);
  await expect(announcement(page)).toBeVisible();
  await activateByKeyboard(
    page,
    announcement(page).getByRole("button", { name: "Play", exact: true }),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expectPrivateMissionReadsOnly(backend);
});

test("reward takeover defers an unseen announcement until the reward is released", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend);
  backend.responses.cc_player_get_session_reward_round = privateMissionReward();
  await page.goto("#/play/123456");
  await expect(
    page.getByRole("heading", { name: "Judgement is underway…", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Mission pause reward · 20 points at stake", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBeNull();
  backend.responses.cc_player_get_session_reward_round = null;
  await refreshPlayer(page, backend);
  await expect(announcement(page)).toBeVisible();
  expectPrivateMissionReadsOnly(backend);
});

test("announcements wait for the game section and do not repeat after navigating away and back", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend);
  await page.goto("#/play/123456/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const navigation = page.getByRole("navigation", {
    name: "Game pages",
    exact: true,
  });
  await activateByKeyboard(
    page,
    navigation.getByRole("link", { name: "Game", exact: true }),
  );
  await activateByKeyboard(
    page,
    announcement(page).getByRole("button", { name: "Play", exact: true }),
  );
  await activateByKeyboard(
    page,
    navigation.getByRole("link", { name: "Scores", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    navigation.getByRole("link", { name: "Game", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expectPrivateMissionReadsOnly(backend);
});

test("dismissing a completed mission preserves separate seen and card-dismissal stores", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  seedPrivateMissions(backend, [
    privateMissionFixture({
      status: "submitted",
      submitted_at: "2030-01-01T12:00:00Z",
    }),
  ]);
  await page.goto("#/play/123456");
  await activateByKeyboard(
    page,
    announcement(page).getByRole("button", { name: "Play", exact: true }),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Dismiss completed mission",
      exact: true,
    }),
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBe('["private-one"]');
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      dismissedMissionKey,
    ),
  ).toBe('["private-one"]');
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make an entrance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lead a conga line", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expectPrivateMissionReadsOnly(backend);
});

test("native announcement contains focus, blocks implicit dismissal and cleans up across review takeover", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  const [mission] = seedPrivateMissions(backend);
  await page.goto("#/play/123456");
  const dialog = announcement(page);
  const play = dialog.getByRole("button", { name: "Play", exact: true });
  await expect(dialog).toHaveJSProperty("open", true);
  await expect(dialog).toHaveAccessibleDescription(mission.description);
  await expect(play).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(play).toBeFocused();
  await page.locator(".session-navigation a").first().focus();
  await expect(play).toBeFocused();
  await selectMissionDescription(
    page,
    dialog.getByText(mission.description, { exact: true }),
  );
  await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  backend.responses.cc_player_get_session_secret_review =
    privateMissionReview();
  await refreshPlayer(page, backend);
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBeNull();
  backend.responses.cc_player_get_session_secret_review = null;
  await refreshPlayer(page, backend);
  await expect(play).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveJSProperty("open", true);
  await page.mouse.click(1, 1);
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await activateByKeyboard(page, play);
  await expect(dialog).toHaveCount(0);
  await activateByKeyboard(
    page,
    page
      .getByRole("navigation", { name: "Game pages", exact: true })
      .getByRole("link", { name: "Scores", exact: true }),
  );
  await expect(
    page.getByRole("heading", { name: "Leaderboard", exact: true }),
  ).toBeVisible();
  expectPrivateMissionReadsOnly(backend);
});

test("an announcement above an open player tour restores the tour focus after Play", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  await page.goto("#/play/123456");
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "✦ How to play / Take a tour",
      exact: true,
    }),
  );
  const tour = page.getByRole("dialog", { name: /^PLAYER TOUR:/ });
  const close = tour.getByRole("button", { name: "Close tour", exact: true });
  await expect(close).toBeFocused();
  seedPrivateMissions(backend);
  await refreshPlayer(page, backend);
  const play = announcement(page).getByRole("button", {
    name: "Play",
    exact: true,
  });
  await expect(play).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(announcement(page)).toHaveCount(0);
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tour).toHaveCount(0);
  expectPrivateMissionReadsOnly(backend);
});

test("local announcement accepts by keyboard, restores its opener and never stores an acknowledgement", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const opener = page.getByRole("button", {
    name: "Open sample private mission",
    exact: true,
  });
  await activateByKeyboard(page, opener);
  const dialog = announcement(page, "Start a sample conga line");
  const play = dialog.getByRole("button", { name: "Play", exact: true });
  await expect(play).toBeFocused();
  await expect(dialog).toHaveAccessibleDescription(
    "Invite a friend to dance. This preview only changes local state.",
  );
  await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveJSProperty("open", true);
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(
    page.getByText("Sample private mission accepted.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), seenMissionKey),
  ).toBeNull();
  expect(backend.requests).toEqual([]);
  backend.verify();
});
