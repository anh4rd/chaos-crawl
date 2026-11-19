import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import {
  installLegacySlideshow,
  legacySlideshowMedia,
} from "./support/legacySlideshow";

async function pauseClock(page: Page) {
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
}
async function openSlideshow(page: Page, host = true) {
  await page.goto(`#/slideshow${host ? "?host=true" : ""}`);
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 3",
  );
}

test("legacy slideshow preserves read order, upload metadata, host controls and five-second image cadence", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-17T12:00:00Z") });
  const fixture = await installLegacySlideshow(page);
  await openSlideshow(page);
  await pauseClock(page);
  await expect(
    page.getByRole("img", { name: "Chaos Crawl upload", exact: true }),
  ).toHaveAttribute("src", legacySlideshowMedia()[0].image_url);
  await expect(page.getByText("📍 First pub", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Team portrait", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Pat • Ducks", { exact: true })).toBeVisible();
  const reads = fixture.reads;
  expect(reads.some((read) => read.table === "/rest/v1/photos")).toBe(true);
  for (const read of reads.filter(
    (read) => read.table === "/rest/v1/game_state",
  )) {
    expect(read.query).toEqual({ select: "*", id: "eq.1" });
    expect(read.accept).toBe("application/vnd.pgrst.object+json");
  }
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "⏸ Pause", exact: true }),
  );
  await page.clock.runFor(10000);
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 3",
  );
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "▶ Resume", exact: true }),
  );
  await page.clock.runFor(4999);
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 3",
  );
  await page.clock.runFor(1);
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "2 / 3",
  );
  await expect(page.locator("video")).toHaveAttribute(
    "src",
    legacySlideshowMedia()[1].image_url,
  );
  await expect.poll(() => fixture.subscribers("photos")).toBeGreaterThan(0);
  fixture.notify("photos");
  await expect
    .poll(() => reads.some((read) => read.table === "/rest/v1/photos"))
    .toBe(true);
  expect(
    reads
      .filter((read) => read.table === "/rest/v1/photos")
      .every(
        (read) =>
          JSON.stringify(read.query) ===
          JSON.stringify({ select: "*", order: "uploaded_at.desc" }),
      ),
  ).toBe(true);
  fixture.backend.verify();
});

test("legacy native video controls retain audio, pause/end behavior and keyboard ownership", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await openSlideshow(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next →", exact: true }),
  );
  const video = page.locator("video");
  await expect(video).toBeVisible();
  expect(
    await video.evaluate((element: HTMLVideoElement) => ({
      controls: element.controls,
      muted: element.muted,
      inline: element.playsInline,
    })),
  ).toEqual({ controls: true, muted: false, inline: true });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "⏸ Pause", exact: true }),
    "backward",
  );
  await video.dispatchEvent("ended");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "2 / 3",
  );
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await tabTo(page, video);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "2 / 3",
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "▶ Resume", exact: true }),
    "backward",
  );
  await video.dispatchEvent("ended");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "3 / 3",
  );
  fixture.backend.verify();
});

test("legacy viewers retain keyboard navigation but no host command controls", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await openSlideshow(page, false);
  await expect(
    page.getByRole("button", {
      name: /End Slideshow|Previous|Next →|Pause|Resume/,
    }),
  ).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "3 / 3",
  );
  await page.keyboard.press(" ");
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 3",
  );
  expect(fixture.writes).toEqual([]);
  fixture.backend.verify();
});

test("legacy slideshow reconciles refreshed uploads by numeric index and resets a shortened list", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await openSlideshow(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "← Previous", exact: true }),
  );
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "3 / 3",
  );
  await expect.poll(() => fixture.subscribers("photos")).toBeGreaterThan(0);
  fixture.backend.rows.photos = [legacySlideshowMedia()[0]];
  fixture.notify("photos");
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 1",
  );
  await expect(
    page.getByRole("heading", { name: "Team portrait", exact: true }),
  ).toBeVisible();
  fixture.backend.verify();
});

test("legacy slideshow recovers autoplay rejection and unavailable uploads through native skip", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: () => Promise.reject(new Error("Fixture autoplay blocked")),
    }),
  );
  const fixture = await installLegacySlideshow(page);
  await openSlideshow(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next →", exact: true }),
  );
  await expect(page.getByRole("status")).toHaveText(
    "Use the video controls to start playback.",
  );
  await page.locator("video").dispatchEvent("error");
  await expect(
    page.getByRole("heading", {
      name: "Could not load this upload",
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Skip to next", exact: true }),
  );
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "3 / 3",
  );
  await expect(page.getByRole("status")).toHaveCount(0);
  fixture.backend.verify();
});

for (const host of [false, true]) {
  test(`legacy empty slideshow refreshes uploads by keyboard (host=${host})`, async ({
    page,
  }) => {
    const fixture = await installLegacySlideshow(page, []);
    await page.goto(`#/slideshow${host ? "?host=true" : ""}`);
    await expect(
      page.getByRole("heading", { name: "Anna's Chaos Crawl", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "End Slideshow", exact: true }),
    ).toHaveCount(host ? 1 : 0);
    fixture.backend.rows.photos = legacySlideshowMedia();
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Check for uploads", exact: true }),
    );
    await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
      "1 / 3",
    );
    fixture.backend.verify();
  });
}

test("legacy end confirmation preserves id-one command body, cancellation and host redirect", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openSlideshow(page);
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("End slideshow for everyone?");
    await dialog.dismiss();
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  );
  expect(fixture.writes).toEqual([]);
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("End slideshow for everyone?");
    await dialog.accept();
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  );
  await expect(page).toHaveURL(/#\/admin$/);
  expect(fixture.writes).toEqual([
    {
      query: { id: "eq.1" },
      body: { slideshow_open: false, updated_at: "2026-11-17T12:00:00.000Z" },
    },
  ]);
  fixture.backend.verify();
});

test("legacy loading and failed photo reads retain a keyboard retry without commands", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  let release = () => {};
  const gate = new Promise<void>((complete) => {
    release = complete;
  });
  let failed = true;
  await page.route(
    (url) => url.pathname === "/rest/v1/photos",
    async (route) => {
      await gate;
      if (route.request().failure()) return;
      if (failed) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Photos unavailable" }),
        });
        return;
      }
      await route.fallback();
    },
  );
  await page.goto("#/slideshow?host=true");
  await expect(
    page.getByText("Loading slideshow...", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  ).toHaveCount(0);
  release();
  await expect(page.getByRole("alert")).toHaveText("Photos unavailable");
  failed = false;
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Try again", exact: true }),
  );
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 3",
  );
  expect(fixture.writes).toEqual([]);
  fixture.backend.verify();
});

test("legacy failed end request preserves its native pending control and allows retry", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  let release = () => {};
  const gate = new Promise<void>((complete) => {
    release = complete;
  });
  let failed = true;
  const attempts: Array<{ query: Record<string, string>; body: unknown }> = [];
  await page.route(
    (url) => url.pathname === "/rest/v1/game_state",
    async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      attempts.push({
        query: Object.fromEntries(new URL(route.request().url()).searchParams),
        body: route.request().postDataJSON(),
      });
      if (failed) {
        await gate;
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "End request unavailable" }),
        });
        return;
      }
      await route.fallback();
    },
  );
  await page.clock.setFixedTime(new Date("2026-11-17T12:00:00Z"));
  await openSlideshow(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  );
  await expect(
    page.getByRole("button", { name: "Ending...", exact: true }),
  ).toBeDisabled();
  release();
  await expect
    .poll(() => dialogs)
    .toEqual([
      "End slideshow for everyone?",
      "Could not end slideshow: End request unavailable",
    ]);
  await expect(
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  ).toBeEnabled();
  failed = false;
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  );
  await expect(page).toHaveURL(/#\/admin$/);
  expect(attempts).toEqual(
    [0, 1].map(() => ({
      query: { id: "eq.1" },
      body: { slideshow_open: false, updated_at: "2026-11-17T12:00:00.000Z" },
    })),
  );
  fixture.backend.verify();
});

for (const host of [false, true]) {
  test(`legacy Realtime close returns its viewer to the existing route (host=${host})`, async ({
    page,
  }) => {
    const fixture = await installLegacySlideshow(page);
    await openSlideshow(page, host);
    await expect
      .poll(() => fixture.subscribers("game_state"))
      .toBeGreaterThan(0);
    Object.assign(fixture.game, { slideshow_open: false });
    fixture.notify("game_state");
    await expect(page).toHaveURL(host ? /#\/admin$/ : /#\/game$/);
    expect(fixture.writes).toEqual([]);
    fixture.backend.verify();
  });
}

test("local legacy playback reference uses controlled keyboard actions without global shortcuts or backend", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Legacy slideshow playback",
      exact: true,
    }),
  });
  await expect(example.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 2",
  );
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.keyboard.press("ArrowRight");
  await expect(example.getByLabel("Slide counter", { exact: true })).toHaveText(
    "1 / 2",
  );
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Next →", exact: true }),
  );
  await expect(example.getByLabel("Slide counter", { exact: true })).toHaveText(
    "2 / 2",
  );
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "⏸ Pause", exact: true }),
    "backward",
  );
  await expect(example.getByText("PAUSED", { exact: true })).toBeVisible();
  await tabTo(
    page,
    example.getByRole("checkbox", { name: "Sample end pending", exact: true }),
    "backward",
  );
  await page.keyboard.press(" ");
  await expect(
    example.getByRole("button", { name: "Ending...", exact: true }),
  ).toBeDisabled();
  await tabTo(
    page,
    example.getByRole("checkbox", {
      name: "Show sample host controls",
      exact: true,
    }),
    "backward",
  );
  await page.keyboard.press(" ");
  await expect(
    example.getByRole("button", { name: "Next →", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press(" ");
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Show empty slideshow", exact: true }),
    "backward",
  );
  await expect(
    example.getByRole("heading", { name: "Anna's Chaos Crawl", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Check for uploads", exact: true }),
  );
  await expect(
    example.getByText("Sample uploads refreshed locally.", { exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", {
      name: "Show unavailable upload",
      exact: true,
    }),
  );
  await expect(
    example.getByRole("heading", {
      name: "Could not load this upload",
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Skip to next", exact: true }),
  );
  await expect(
    example.getByRole("img", { name: "Chaos Crawl upload", exact: true }),
  ).toBeVisible();
  expect(fixture.backend.requests).toEqual([]);
  fixture.backend.verify();
});

test("native keyboard playback clears a previous autoplay-blocked notice", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new Error("Fixture autoplay blocked"));
    window.addEventListener(
      "chaos-test-allow-play",
      () => {
        HTMLMediaElement.prototype.play = original;
      },
      { once: true },
    );
  });
  await openSlideshow(page);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next →", exact: true }),
  );
  await expect(page.getByRole("status")).toHaveText(
    "Use the video controls to start playback.",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new Event("chaos-test-allow-play")),
  );
  const video = page.locator("video");
  await tabTo(page, video);
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      video.evaluate(
        (element) => element instanceof HTMLVideoElement && !element.paused,
      ),
    )
    .toBe(true);
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByLabel("Slide counter", { exact: true })).toHaveText(
    "2 / 3",
  );
  fixture.backend.verify();
});

test("an obsolete host end failure cannot alert, redirect or release a newer role command", async ({
  page,
}) => {
  const fixture = await installLegacySlideshow(page);
  const releases: (() => void)[] = [];
  let commands = 0;
  let completed = 0;
  await page.route(
    (url) => url.pathname === "/rest/v1/game_state",
    async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      const index = commands++;
      await new Promise<void>((resolve) => {
        releases[index] = resolve;
      });
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: index === 0 ? "Old failure" : "Current failure",
        }),
      });
      completed += 1;
    },
  );
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "alert") alerts.push(dialog.message());
    await dialog.accept();
  });
  await openSlideshow(page);
  await page
    .getByRole("button", { name: "End Slideshow", exact: true })
    .click();
  await expect.poll(() => commands).toBe(1);
  await page.evaluate(() => {
    window.location.hash = "/slideshow";
  });
  await expect(
    page.getByRole("button", { name: "Ending...", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    window.location.hash = "/slideshow?host=true";
  });
  await page
    .getByRole("button", { name: "End Slideshow", exact: true })
    .click();
  await expect.poll(() => commands).toBe(2);
  releases[0]();
  await expect.poll(() => completed).toBe(1);
  await expect(
    page.getByRole("button", { name: "Ending...", exact: true }),
  ).toBeDisabled();
  expect(alerts).toEqual([]);
  expect(new URL(page.url()).hash).toBe("#/slideshow?host=true");
  releases[1]();
  await expect
    .poll(() => alerts)
    .toEqual(["Could not end slideshow: Current failure"]);
  await expect(
    page.getByRole("button", { name: "End Slideshow", exact: true }),
  ).toBeEnabled();
  fixture.backend.verify();
});
