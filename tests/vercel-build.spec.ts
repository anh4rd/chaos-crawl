import { expect, test } from "@playwright/test";

test("Vercel root build loads the app and its assets", async ({
  page,
  request,
}) => {
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    if (
      new URL(response.url()).origin === new URL(page.url()).origin &&
      response.status() >= 400
    ) {
      failedAssets.push(response.url());
    }
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await page.goto("/#/join");
  await expect(
    page.getByRole("heading", { name: "Join the chaos", exact: true }),
  ).toBeVisible();
  await expect(page.locator('img[src="/chaos-logo.png"]')).toBeVisible();
  const emoji = await request.get("/openmoji/1F600.svg");
  expect(emoji.status()).toBe(200);
  expect(emoji.headers()["content-type"]).toContain("image/svg+xml");

  await page.goto("/#/invite/123456");
  const invitation = page.locator(".invitation");
  await expect(invitation).toHaveCSS(
    "background-image",
    `url("${new URL("/swirl.jpg", page.url()).href}")`,
  );
  expect((await request.get("/swirl.jpg")).status()).toBe(200);
  expect(failedAssets).toEqual([]);
});
