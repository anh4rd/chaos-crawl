import { expect, test } from "@playwright/test";

test("production install assets and offline fallback work at the deployment base", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error("A deployment base URL is required.");
  const manifestResponse = await request.get(
    new URL("manifest.webmanifest", baseURL).href,
  );
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("./");
  expect(manifest.scope).toBe("./");
  expect(manifest.display).toBe("standalone");
  await page.goto("./#/join");
  for (const [name, size] of [
    ["pwa-192.png", 192],
    ["pwa-512.png", 512],
    ["apple-touch-icon.png", 180],
  ] as const) {
    const dimensions = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, new URL(name, baseURL).href);
    expect(dimensions).toEqual([size, size]);
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true);
  const cachedUrls = await page.evaluate(async () => {
    const cache = await caches.open("chaos-crawl-offline-v1");
    return (await cache.keys()).map((entry) => entry.url);
  });
  expect(cachedUrls).toEqual([new URL("offline.html", baseURL).href]);
  await page.context().setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You're offline" }),
  ).toBeVisible();
  await expect(page.getByText(/internet connection to play/)).toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Join the chaos", exact: true }),
  ).toBeVisible();
});
