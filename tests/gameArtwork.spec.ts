import { expect, test, type Page } from "@playwright/test";
import { installSessionBackend, sessionId } from "./support/sessionBackend";

async function expectMascotBesideArtwork(page: Page, selector: string) {
  const wrapper = page.locator(selector).locator(".game-artwork");
  const mascot = wrapper.locator(".mascot-art--game");
  const artwork = wrapper.locator(".image-well--badge, .session-titlebar__art");
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveAttribute("alt", "");
  await expect(mascot).toHaveAttribute("aria-hidden", "true");
  await expect(mascot).toHaveAttribute(
    "src",
    "/chaos-crawl/chaos-monster-peek.png",
  );
  await expect(mascot).toHaveCSS("z-index", "1");
  await expect
    .poll(() =>
      mascot.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const mascotBox = await mascot.boundingBox();
  const artworkBox = await artwork.boundingBox();
  expect(mascotBox).not.toBeNull();
  expect(artworkBox).not.toBeNull();
  if (!mascotBox || !artworkBox) throw new Error("Game artwork is not visible");
  expect(mascotBox.x).toBeLessThan(artworkBox.x);
  expect(mascotBox.x + mascotBox.width).toBeGreaterThan(artworkBox.x);
  expect(mascotBox.y + mascotBox.height).toBeGreaterThan(artworkBox.y);
}

test("mascot overlaps lobby and shared game artwork", async ({ page }) => {
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  await page.goto(`#/host/live/${sessionId}`);
  await expectMascotBesideArtwork(page, ".lobby-game-heading");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Enter your details" }),
  ).toBeVisible();
  await expectMascotBesideArtwork(page, ".lobby-game-heading");
  backend.session.status = "live";
  await expect(page.locator(".session-titlebar")).toBeVisible({
    timeout: 10_000,
  });
  await expectMascotBesideArtwork(page, ".session-titlebar");
  await page.goto("#/play/123456/game");
  await expectMascotBesideArtwork(page, ".session-titlebar");
  backend.verify();
});
