import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

const image = {
  id: "photo-one",
  player_name: "Pat",
  challenge_id: "challenge",
  challenge_title: "Team portrait",
  media_type: "image",
  storage_path: "test/photo.png",
};
const video = {
  ...image,
  id: "video-two",
  player_name: "Alex",
  media_type: "video",
  storage_path: "test/video.webm",
};
const openView = {
  open: true,
  challenge_id: "challenge",
  assignment_id: "assignment",
  evidence_id: "photo-one",
  mission: {
    title: "Secret toast",
    description: "Give a toast without being noticed.",
    player_name: "Pat",
  },
  items: [image, video],
};

async function pauseClock(page: Page) {
  const next = await page.evaluate(() => Date.now() + 100);
  await page.clock.pauseAt(new Date(next));
}

for (const kind of ["final", "secret"] as const) {
  const rpc =
    kind === "final"
      ? "cc_get_session_final_slideshow"
      : "cc_get_session_secret_review_slideshow";
  test(`${kind} TV follows host evidence selection, plays native media and reports fullscreen failures`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses[rpc] = openView;
    await page.route(
      "**/storage/v1/object/public/session-evidence/**",
      (route) => {
        const movie = route.request().url().endsWith(".webm");
        return route.fulfill({
          contentType: movie ? "video/webm" : "image/png",
          body: readFileSync(
            resolve(
              movie
                ? "tests/support/fixtures/review.webm"
                : "public/chaos-logo.png",
            ),
          ),
        });
      },
    );
    await page.addInitScript(() => {
      Object.defineProperty(Element.prototype, "requestFullscreen", {
        configurable: true,
        value: () => Promise.reject(new Error("Fixture fullscreen denied")),
      });
    });
    await page.goto(`#/${kind}-slideshow/test-session`);
    await expect(page.getByRole("img")).toHaveAttribute(
      "alt",
      kind === "final"
        ? "Pat's entry for Team portrait"
        : "Evidence for Secret toast",
    );
    await expect(
      page.getByRole("heading", { name: "Pat", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    await pauseClock(page);
    const initialReads = backend.requests.filter(
      (request) => request.name === rpc,
    );
    expect(initialReads.length).toBeGreaterThan(0);
    for (const request of initialReads) {
      expect(request).toEqual({
        name: rpc,
        method: "POST",
        body: { p_session_id: "test-session" },
      });
    }
    backend.responses[rpc] = { ...openView, evidence_id: "video-two" };
    await page.clock.runFor(1500);
    const media = page.locator("video");
    await expect(media).toHaveAttribute(
      "src",
      /session-evidence\/test\/video.webm$/,
    );
    expect(
      await media.evaluate((element: HTMLVideoElement) => ({
        autoplay: element.autoplay,
        muted: element.muted,
        inline: element.playsInline,
      })),
    ).toEqual({ autoplay: true, muted: true, inline: true });
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
    expect(
      backend.requests.filter((request) => request.name === rpc),
    ).toHaveLength(initialReads.length + 1);
    await media.dispatchEvent("ended");
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Enter fullscreen", exact: true }),
    );
    await expect(page.getByRole("status")).toHaveText(
      "Couldn't enter fullscreen: Fixture fullscreen denied",
    );
    backend.verify();
  });

  test(`${kind} TV keeps closed, empty and missing-mission states private`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses[rpc] = { ...openView, open: false };
    await page.goto(`#/${kind}-slideshow/test-session`);
    await expect(
      page.getByRole("heading", { name: "Slideshow is waiting", exact: true }),
    ).toBeVisible();
    await pauseClock(page);
    await expect(page.locator("img,video")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Enter fullscreen" }),
    ).toHaveCount(0);
    backend.responses[rpc] = { ...openView, items: [] };
    await page.clock.runFor(1500);
    await expect(
      page.getByRole("heading", {
        name: kind === "final" ? "Waiting for submissions" : "Secret toast",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("img,video")).toHaveCount(0);
    if (kind === "secret") {
      await expect(
        page.getByText("No photo or video submitted", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Enter fullscreen" }),
      ).toBeVisible();
      backend.responses[rpc] = { ...openView, mission: null };
      await page.clock.runFor(1500);
      await expect(
        page.getByRole("heading", {
          name: "Slideshow is waiting",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Enter fullscreen" }),
      ).toHaveCount(0);
    }
    backend.verify();
  });
}

test("shared TV reference uses keyboard actions and local feedback without backend requests", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Shared TV slideshow",
      exact: true,
    }),
  });
  await expect(example.getByRole("img")).toHaveAttribute(
    "alt",
    "Pat's sample entry for Team portrait",
  );
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Next sample evidence", exact: true }),
  );
  await expect(
    example.getByRole("heading", { name: "Alex", exact: true }),
  ).toBeVisible();
  await expect(example.getByText("2 / 2", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", {
      name: "Toggle sample TV error",
      exact: true,
    }),
  );
  await expect(
    example.getByText("Sample TV feedback", { exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Enter fullscreen", exact: true }),
  );
  await expect(
    example.getByText("Fullscreen action stays in this local preview.", {
      exact: true,
    }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Show sample waiting", exact: true }),
    "backward",
  );
  await expect(
    example.getByRole("heading", { name: "Slideshow is waiting", exact: true }),
  ).toBeVisible();
  await expect(
    example.getByRole("button", { name: "Enter fullscreen", exact: true }),
  ).toHaveCount(0);
  await expect(
    example.getByText("Sample TV feedback", { exact: true }),
  ).toHaveCount(0);
  await activateByKeyboard(
    page,
    example.getByRole("button", {
      name: "Show sample empty mission",
      exact: true,
    }),
  );
  await expect(
    example.getByText("No photo or video submitted", { exact: true }),
  ).toBeVisible();
  expect(backend.requests).toEqual([]);
  backend.verify();
});

for (const kind of ["final", "secret"] as const) {
  const rpc =
    kind === "final"
      ? "cc_get_session_final_slideshow"
      : "cc_get_session_secret_review_slideshow";

  test(`${kind} TV removes prior-session content and feedback while another identity waits or fails`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses[rpc] = openView;
    await page.route(
      "**/storage/v1/object/public/session-evidence/**",
      (route) =>
        route.fulfill({
          contentType: "image/png",
          body: readFileSync(resolve("public/chaos-logo.png")),
        }),
    );
    let release = () => {};
    const gate = new Promise<void>((complete) => {
      release = complete;
    });
    const blocked: unknown[] = [];
    await page.route(`**/rest/v1/rpc/${rpc}`, async (route) => {
      const body: unknown = route.request().postDataJSON();
      if (
        typeof body !== "object" ||
        body === null ||
        !("p_session_id" in body) ||
        body.p_session_id !== "session-b"
      ) {
        await route.fallback();
        return;
      }
      expect(body).toEqual({ p_session_id: "session-b" });
      expect(route.request().method()).toBe("POST");
      blocked.push(body);
      await gate;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Current session unavailable" }),
      });
    });
    await page.goto(`#/${kind}-slideshow/session-a`);
    await expect(page.getByRole("img")).toBeVisible();
    await pauseClock(page);
    await page.getByRole("img").dispatchEvent("error");
    await expect(page.getByRole("status")).toHaveText(
      "This photo couldn't load on the TV screen.",
    );
    await page.evaluate((next) => {
      window.location.hash = next;
    }, `#/${kind}-slideshow/session-b`);
    await expect(page.getByText(/Connecting to the .*slideshow/)).toBeVisible();
    await expect(page.locator("img,video")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Pat", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect.poll(() => blocked.length).toBeGreaterThan(0);
    release();
    await expect(page.getByRole("alert")).toHaveText(
      kind === "final"
        ? "The TV slideshow couldn't load: Current session unavailable"
        : "The secret mission slideshow couldn't load: Current session unavailable",
    );
    await expect(page.locator("img,video")).toHaveCount(0);
    await page.evaluate((next) => {
      window.location.hash = next;
    }, `#/${kind}-slideshow/session-a`);
    await expect(
      page.getByRole("heading", { name: "Pat", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    backend.verify();
  });

  test(`${kind} TV resets local playback across same-document A-to-B-to-A identity changes`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses[rpc] = {
      ...openView,
      evidence_id: null,
      items: [image, { ...image, id: "photo-two", player_name: "Alex" }],
    };
    await page.route(
      "**/storage/v1/object/public/session-evidence/**",
      (route) =>
        route.fulfill({
          contentType: "image/png",
          body: readFileSync(resolve("public/chaos-logo.png")),
        }),
    );
    await page.goto(`#/${kind}-slideshow/session-a`);
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    await pauseClock(page);
    await page.clock.runFor(6000);
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
    await page.evaluate((next) => {
      window.location.hash = next;
    }, `#/${kind}-slideshow/session-b`);
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    await page.clock.runFor(6000);
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
    await page.evaluate((next) => {
      window.location.hash = next;
    }, `#/${kind}-slideshow/session-a`);
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    backend.verify();
  });

  test(`${kind} TV ignores obsolete read and fullscreen outcomes after navigating to another session`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses[rpc] = openView;
    await page.route(
      "**/storage/v1/object/public/session-evidence/**",
      (route) =>
        route.fulfill({
          contentType: "image/png",
          body: readFileSync(resolve("public/chaos-logo.png")),
        }),
    );
    await page.addInitScript(() => {
      Object.defineProperty(Element.prototype, "requestFullscreen", {
        configurable: true,
        value: () =>
          new Promise<void>((_resolve, reject) => {
            window.addEventListener(
              "reject-tv-fullscreen",
              () => reject(new Error("Obsolete fullscreen request")),
              { once: true },
            );
          }),
      });
    });
    let holdOld = false;
    let release = () => {};
    const gate = new Promise<void>((complete) => {
      release = complete;
    });
    const blocked: unknown[] = [];
    await page.route(`**/rest/v1/rpc/${rpc}`, async (route) => {
      const body: unknown = route.request().postDataJSON();
      if (
        !holdOld ||
        typeof body !== "object" ||
        body === null ||
        !("p_session_id" in body) ||
        body.p_session_id !== "session-a"
      ) {
        await route.fallback();
        return;
      }
      expect(body).toEqual({ p_session_id: "session-a" });
      blocked.push(body);
      await gate;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(openView),
      });
    });
    await page.goto(`#/${kind}-slideshow/session-a`);
    await expect(page.getByRole("img")).toBeVisible();
    await pauseClock(page);
    holdOld = true;
    await page.clock.runFor(1500);
    await expect.poll(() => blocked.length).toBeGreaterThan(0);
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Enter fullscreen", exact: true }),
    );
    backend.responses[rpc] = {
      ...openView,
      mission: { ...openView.mission, player_name: "New player" },
      items: openView.items.map((item) => ({
        ...item,
        player_name: "New player",
      })),
    };
    await page.evaluate((next) => {
      window.location.hash = next;
    }, `#/${kind}-slideshow/session-b`);
    await expect(
      page.getByRole("heading", { name: "New player", exact: true }),
    ).toBeVisible();
    const oldResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(rpc) &&
        response.request().postData() ===
          JSON.stringify({ p_session_id: "session-a" }),
    );
    release();
    await oldResponse;
    await page.evaluate(() =>
      window.dispatchEvent(new Event("reject-tv-fullscreen")),
    );
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "New player", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    backend.verify();
  });
}
