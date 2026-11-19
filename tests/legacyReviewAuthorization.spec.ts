import { expect, test } from "@playwright/test";
import { installSessionBackend } from "./support/sessionBackend";

test("anonymous legacy review navigation never mounts award reads or controls", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    host: false,
    savedPlayer: false,
  });
  const reviewReads: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.hostname === "chaos-crawl-test.supabase.co" &&
      [
        "/rest/v1/challenge_completions",
        "/rest/v1/photos",
        "/rest/v1/score_events",
      ].includes(url.pathname)
    )
      reviewReads.push(url.pathname);
  });
  await page.goto("#/challenge-review?type=side&id=11&title=Private%20review");
  await expect(
    page.getByRole("heading", { name: "Welcome back.", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/host\/login$/);
  await expect(
    page.getByRole("button", { name: "Award Points", exact: true }),
  ).toHaveCount(0);
  expect(reviewReads).toEqual([]);
  backend.verify();
});
