import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

test("a player receives and persistently dismisses an in-app notice", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  backend.responses.cc_get_player_notifications = [];
  await page.route("**/rest/v1/rpc/cc_dismiss_player_notification", (route) => {
    backend.responses.cc_get_player_notifications = [];
    return route.fallback();
  });
  await page.goto("#/play/123456/game");
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) => request.name === "cc_get_player_notifications",
        ).length,
    )
    .toBeGreaterThan(0);
  backend.responses.cc_get_player_notifications = [
    { id: "notification-1", body: "A new round has started." },
  ];
  await expect(page.getByText("A new round has started.")).toBeVisible({
    timeout: 10000,
  });
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Dismiss notice" }),
  );
  await expect(page.getByText("A new round has started.")).toHaveCount(0);
  const readsBeforeNavigation = backend.requests.filter(
    (request) => request.name === "cc_get_player_notifications",
  ).length;
  await page.goto("#/play/123456/leaderboard");
  await page.goto("#/play/123456/game");
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (request) => request.name === "cc_get_player_notifications",
        ).length,
      { timeout: 10000 },
    )
    .toBeGreaterThan(readsBeforeNavigation);
  await expect(page.getByText("A new round has started.")).toHaveCount(0);
  expect(
    backend.requests.some(
      (request) =>
        request.name === "cc_dismiss_player_notification" &&
        typeof request.body === "object" &&
        request.body !== null &&
        "p_notification_id" in request.body &&
        request.body.p_notification_id === "notification-1",
    ),
  ).toBe(true);
  backend.verify();
});
