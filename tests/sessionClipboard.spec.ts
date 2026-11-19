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
    name: "Copy game code",
    exact: true,
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

test("host copies retain persistent success and browser-failure fallback notices", async ({
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
    name: "Copy game code",
    exact: true,
  });
  await activateByKeyboard(page, copy);
  await expect(
    page.getByText("Join code copied.", { exact: true }),
  ).toBeVisible();
  await page.clock.runFor(2000);
  await expect(
    page.getByText("Join code copied.", { exact: true }),
  ).toBeVisible();
  fail = true;
  await activateByKeyboard(page, copy);
  await expect(
    page.getByText("Join code: 123456", { exact: true }),
  ).toBeVisible();
  expect(writes).toEqual(["123456", "123456"]);
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
