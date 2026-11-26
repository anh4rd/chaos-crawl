import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
declare global {
  interface Window {
    testWriteClipboard: (text: string) => Promise<void>;
    testCopyTimers: Set<number>;
  }
}
async function clipboard(page: Page, write: (text: string) => Promise<void>) {
  await page.exposeFunction("testWriteClipboard", write);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (text: string) => window.testWriteClipboard(text) },
    });
    window.testCopyTimers = new Set<number>();
    const set = window.setTimeout.bind(window),
      clear = window.clearTimeout.bind(window);
    Object.defineProperty(window, "setTimeout", {
      configurable: true,
      value: (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        const id = set(handler, delay, ...args);
        if (delay === 1800) window.testCopyTimers.add(id);
        return id;
      },
    });
    Object.defineProperty(window, "clearTimeout", {
      configurable: true,
      value: (id?: number) => {
        if (id !== undefined) window.testCopyTimers.delete(id);
        clear(id);
      },
    });
  });
}
async function player(page: Page) {
  const backend = await installSessionBackend(page);
  await page.goto("#/play/123456/game");
  const copy = page.getByRole("button", {
    name: /^(Copy game code|Game code copied)$/,
  });
  await expect(copy).toBeVisible();
  return { backend, copy };
}

test("a second successful copy retains its full feedback interval", async ({
  page,
}) => {
  await page.clock.install();
  const writes: string[] = [];
  await clipboard(page, async (text) => {
    writes.push(text);
  });
  const { backend, copy } = await player(page);
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
  await activateByKeyboard(page, copy);
  await expect(copy.locator(".lucide-check")).toBeVisible();
  await page.clock.runFor(1000);
  await activateByKeyboard(page, copy);
  await expect.poll(() => writes.length).toBe(2);
  await page.clock.runFor(900);
  await expect(copy.locator(".lucide-check")).toBeVisible();
  await page.clock.runFor(901);
  await expect(copy.locator(".lucide-copy")).toBeVisible();
  expect(writes).toEqual(["123456", "123456"]);
  backend.verify();
});

test("a pending copy resolved after leaving the player creates no reset timer", async ({
  page,
}) => {
  let release = () => {};
  let attempted = false;
  await clipboard(
    page,
    () =>
      new Promise<void>((done) => {
        attempted = true;
        release = done;
      }),
  );
  const { backend, copy } = await player(page);
  await activateByKeyboard(page, copy);
  await expect.poll(() => attempted).toBe(true);
  await page.evaluate(() => {
    window.location.hash = "/join";
  });
  await expect(
    page.getByRole("heading", { name: "Join the chaos", exact: true }),
  ).toBeVisible();
  release();
  await page.evaluate(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
  await expect
    .poll(() => page.evaluate(() => window.testCopyTimers.size))
    .toBe(0);
  backend.verify();
});

test("host copies show a temporary check and retain browser-failure fallback", async ({
  page,
}) => {
  await page.clock.install();
  let fail = false;
  const writes: string[] = [];
  await clipboard(page, async (text) => {
    writes.push(text);
    if (fail) throw new Error("Clipboard denied");
  });
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/live/test-session");
  const copy = page.getByRole("button", {
    name: /^(Copy game code|Game code copied)$/,
  });
  await activateByKeyboard(page, copy);
  await expect(copy.locator(".lucide-check")).toBeVisible();
  await expect(
    page.getByText("Join code copied.", { exact: true }),
  ).toHaveCount(0);
  await page.clock.runFor(2000);
  await expect(copy.locator(".lucide-copy")).toBeVisible();
  fail = true;
  await activateByKeyboard(page, copy);
  await expect(
    page.getByText("Copy isn't available. Join code: 123456", { exact: true }),
  ).toBeVisible();
  expect(writes).toEqual(["123456", "123456"]);
  backend.verify();
});

test("host game details follow game navigation but stay hidden on host controls", async ({
  page,
}) => {
  const writes: string[] = [];
  await clipboard(page, async (text) => {
    writes.push(text);
  });
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/live/test-session");
  const details = page.getByRole("region", { name: "Game details" });
  const navigation = page.getByRole("navigation", { name: "Game pages" });
  for (const name of ["Game", "Scores", "Challenges"]) {
    await navigation.getByRole("button", { name, exact: true }).click();
    await expect(details).toBeVisible();
    await expect(details).toContainText("Regression party");
    await expect(details).toContainText("123456");
  }
  await details.getByRole("button", { name: "Copy game code" }).click();
  await expect(
    details.getByRole("button", { name: "Game code copied" }),
  ).toBeVisible();
  expect(writes).toEqual(["123456"]);

  await navigation.getByRole("button", { name: "Host", exact: true }).click();
  await expect(details).toHaveCount(0);
  for (const name of ["Controls", "Review", "Teams", "Schedule", "Settings"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(details).toHaveCount(0);
  }
  await navigation.getByRole("button", { name: "Game", exact: true }).click();
  await expect(details).toBeVisible();
  backend.verify();
});

test("lobby code and link copy feedback reset independently", async ({
  page,
}) => {
  await page.clock.install();
  const writes: string[] = [];
  let fail = false;
  await clipboard(page, async (text) => {
    writes.push(text);
    if (fail) throw new Error("Clipboard denied");
  });
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  await page.goto("#/host/live/test-session");
  const codeButton = page.locator(".lobby-join-info__code button");
  await activateByKeyboard(page, codeButton);
  await expect(codeButton.locator(".lucide-check")).toBeVisible();
  await expect(codeButton).toHaveAttribute("aria-label", "Game code copied");
  await expect(
    page.getByText("Join code copied.", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByText("Show Join Info", { exact: true }).click();
  const detailCode = page.locator(".lobby-join-info__code button");
  const detailLink = page.locator(".lobby-join-info__link button");
  await expect(detailCode.locator(".lucide-check")).toBeVisible();
  await expect(detailLink.locator(".lucide-copy")).toBeVisible();
  await activateByKeyboard(page, detailLink);
  await expect(detailLink.locator(".lucide-check")).toBeVisible();
  await expect(detailCode.locator(".lucide-check")).toBeVisible();
  await expect(
    page.getByText("Game link copied.", { exact: true }),
  ).toHaveCount(0);
  fail = true;
  await activateByKeyboard(page, detailLink);
  await expect(
    page.getByText(/Copy isn't available\. Game link:/),
  ).toBeVisible();
  await expect(detailLink.locator(".lucide-copy")).toBeVisible();
  fail = false;
  await activateByKeyboard(page, detailLink);
  await expect(detailLink.locator(".lucide-check")).toBeVisible();
  await expect(page.getByText(/Copy isn't available\. Game link:/)).toHaveCount(
    0,
  );
  expect(writes[0]).toBe("123456");
  expect(writes.slice(1)).toEqual([
    expect.stringMatching(/#\/join\?code=123456$/),
    expect.stringMatching(/#\/join\?code=123456$/),
    expect.stringMatching(/#\/join\?code=123456$/),
  ]);
  backend.verify();
});

test("host invitation copy changes only its own icon", async ({ page }) => {
  const writes: string[] = [];
  await clipboard(page, async (text) => {
    writes.push(text);
  });
  const backend = await installSessionBackend(page, { host: true });
  await page.goto("#/host/live/test-session");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.locator(".control-console__panel > summary").filter({
      hasText: "Invite players",
    }),
  );
  const invite = page.getByRole("button", {
    name: /^(Copy join code|Join code copied)$/,
  });
  await activateByKeyboard(page, invite);
  await expect(invite.locator(".lucide-check")).toBeVisible();
  await expect(page.getByRole("region", { name: "Game details" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Game", exact: true }).click();
  await expect(
    page
      .getByRole("button", { name: "Copy game code" })
      .locator(".lucide-copy"),
  ).toBeVisible();
  await expect(
    page.getByText("Join code copied.", { exact: true }),
  ).toHaveCount(0);
  expect(writes).toEqual(["123456"]);
  backend.verify();
});

test("styleguide copy examples show checks without success notices", async ({
  page,
}) => {
  const writes: string[] = [];
  await clipboard(page, async (text) => {
    writes.push(text);
  });
  const backend = await installSessionBackend(page);
  await page.goto("#/styleguide");
  const example = page
    .getByRole("heading", { name: "Host join information", exact: true })
    .locator("xpath=ancestor::article[1]");
  await example.getByText("Usage example", { exact: true }).click();
  const codeButton = example.locator(".component-example__copy-button");
  await activateByKeyboard(page, codeButton);
  await expect(codeButton.locator(".lucide-check")).toBeVisible();
  await expect(example.getByRole("status")).toHaveText("");
  expect(writes[0]).toContain("LobbyGameHeading");
  const localButton = example.getByRole("button", {
    name: "Copy game code",
    exact: true,
  });
  await activateByKeyboard(page, localButton);
  await expect(
    example
      .getByRole("button", { name: "Game code copied" })
      .locator(".lucide-check"),
  ).toBeVisible();
  expect(writes).toHaveLength(1);
  backend.verify();
});

test("participant clipboard failure retains its fallback code and can recover", async ({
  page,
}) => {
  let fail = true;
  await clipboard(page, async () => {
    if (fail) throw new Error("Denied");
  });
  const { backend, copy } = await player(page);
  await activateByKeyboard(page, copy);
  await expect(
    page.getByText("Copy isn't available in this browser. Game code: 123456", {
      exact: true,
    }),
  ).toBeVisible();
  fail = false;
  await activateByKeyboard(page, copy);
  await expect(copy.locator(".lucide-check")).toBeVisible();
  backend.verify();
});
