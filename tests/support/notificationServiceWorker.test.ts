import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("shows a private push message and opens the correct game", async () => {
  const listeners = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const worker = {
    registration: {
      scope: "https://example.test/chaos-crawl/",
      showNotification,
    },
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow },
    addEventListener: (name: string, handler: (event: unknown) => void) =>
      listeners.set(name, handler),
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: worker,
    URL,
    console,
  });
  let task = Promise.resolve();
  listeners.get("push")?.({
    data: {
      json: () => ({
        title: "Chaos Crawl",
        body: "A game update",
        joinCode: "123456",
      }),
    },
    waitUntil: (promise: Promise<void>) => {
      task = promise;
    },
  });
  await task;
  expect(showNotification).toHaveBeenCalledWith(
    "Chaos Crawl",
    expect.objectContaining({
      body: "A game update",
      data: { joinCode: "123456" },
    }),
  );
  listeners.get("notificationclick")?.({
    notification: { close: vi.fn(), data: { joinCode: "123456" } },
    waitUntil: (promise: Promise<void>) => {
      task = promise;
    },
  });
  await task;
  expect(openWindow).toHaveBeenCalledWith(
    "https://example.test/chaos-crawl/#/play/123456",
  );
});
