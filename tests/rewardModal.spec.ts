import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedRewardControls } from "./support/rewardControls";

async function openReward(
  page: Page,
  award = false,
  status: "open" | "completed" = "open",
) {
  const backend = await installSessionBackend(page, { host: true });
  if (award) seedRewardControls(backend, "host_awards", "player", status);
  await page.goto("#/host/live/test-session");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  const trigger = page
    .getByRole("region", { name: "Host controls", exact: true })
    .getByRole("button", {
      name: award ? "Continue reward flow" : "Review",
      exact: true,
    });
  await activateByKeyboard(page, trigger);
  const modal = page.getByRole("dialog", {
    name: "Review points and voting",
    exact: true,
  });
  return { backend, trigger, modal };
}

test("reward modal contains keyboard focus, dismisses without writing and restores its trigger", async ({
  page,
}) => {
  const { backend, trigger, modal } = await openReward(page);
  const close = modal.getByRole("button", {
    name: "Return to game",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    modal.getByRole("button", { name: "Start reward flow", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await activateByKeyboard(page, trigger);
  await page.mouse.click(1, 1);
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await activateByKeyboard(page, trigger);
  await activateByKeyboard(page, close);
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    backend.requests.filter(
      (r) => r.name.startsWith("cc_host_") && r.name.includes("reward"),
    ),
  ).toEqual([]);
  backend.verify();
});

for (const operation of ["start", "award"] as const) {
  test(`pending reward ${operation} keeps focus and blocks Escape, close and backdrop dismissal`, async ({
    page,
  }) => {
    const { backend, trigger, modal } = await openReward(
      page,
      operation === "award",
    );
    const rpc =
      operation === "start"
        ? "cc_host_start_session_reward_round"
        : "cc_host_complete_session_reward_round";
    backend.responses[rpc] =
      operation === "start"
        ? { reward_method: "voting" }
        : { winner_count: 1, points_awarded: 20 };
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(`**/rest/v1/rpc/${rpc}`, async (route) => {
      await pending;
      await route.fallback();
    });
    try {
      if (operation === "award") {
        await activateByKeyboard(
          page,
          modal.getByRole("button", { name: "Select winner Pat", exact: true }),
        );
        page.once("dialog", (dialog) => void dialog.accept());
      }
      const action = modal.getByRole("button", {
        name:
          operation === "start"
            ? "Start reward flow"
            : "Confirm winners & award points",
        exact: true,
      });
      await activateByKeyboard(page, action);
      await expect(action).toBeDisabled();
      await expect(
        modal.getByRole("button", { name: "Return to game", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(modal).toBeVisible();
      await page.mouse.click(1, 1);
      await expect(modal).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(modal).toBeFocused();
      release();
      await expect
        .poll(() => backend.requests.filter((r) => r.name === rpc).length)
        .toBe(1);
      await expect(
        modal.getByRole("button", { name: "Return to game", exact: true }),
      ).toBeEnabled();
      await page.keyboard.press("Escape");
      await expect(modal).toHaveCount(0);
      await expect(trigger).toBeFocused();
      backend.verify();
    } finally {
      release();
    }
  });
}

test("reward command errors and notices remain reachable inside the modal and retry preserves the payload", async ({
  page,
}) => {
  const { backend, modal } = await openReward(page);
  backend.responses.cc_host_start_session_reward_round = {
    reward_method: "voting",
  };
  backend.failures.add("cc_host_start_session_reward_round");
  const start = modal.getByRole("button", {
    name: "Start reward flow",
    exact: true,
  });
  await activateByKeyboard(page, start);
  await expect(modal.getByRole("alert")).toContainText(
    "Fixture connection failed",
  );
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Dismiss error", exact: true }),
  );
  await expect(modal.getByRole("alert")).toHaveCount(0);
  backend.failures.delete("cc_host_start_session_reward_round");
  await activateByKeyboard(page, start);
  await expect(modal.getByRole("status")).toContainText(
    "Player voting started",
  );
  const requests = backend.requests.filter(
    (r) => r.name === "cc_host_start_session_reward_round",
  );
  expect(requests).toHaveLength(2);
  expect(requests[1].body).toEqual(requests[0].body);
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Dismiss notice", exact: true }),
  );
  await expect(modal.getByRole("status")).toHaveCount(0);
  backend.verify();
});

for (const operation of ["release", "cancel"] as const) {
  test(`reward ${operation} restores navigation focus when refresh removes the opener`, async ({
    page,
  }) => {
    const { backend, modal } = await openReward(
      page,
      true,
      operation === "release" ? "completed" : "open",
    );
    const round = seedRewardControls(
      backend,
      "host_awards",
      "player",
      operation === "release" ? "completed" : "open",
    );
    const rpc =
      operation === "release"
        ? "cc_host_release_session_reward_round"
        : "cc_host_cancel_session_reward_round";
    backend.responses[rpc] = null;
    await page.route(`**/rest/v1/rpc/${rpc}`, async (route) => {
      backend.rows.cc_game_session_reward_rounds = [
        {
          ...round,
          status: operation === "release" ? "completed" : "cancelled",
          released_at: "2030-01-01T12:02:00Z",
        },
      ];
      await route.fallback();
    });
    if (operation === "cancel")
      page.once("dialog", (dialog) => void dialog.accept());
    await activateByKeyboard(
      page,
      modal.getByRole("button", {
        name:
          operation === "release" ? "Return everyone to game" : "Cancel flow",
        exact: true,
      }),
    );
    await expect(modal).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Continue reward flow", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Host", exact: true }),
    ).toBeFocused();
    expect(backend.requests.find((r) => r.name === rpc)?.body).toEqual({
      p_reward_round_id: "reward-1",
    });
    backend.verify();
  });
}

test("shared overlay reference preserves local frame, busy dismissal and keyboard focus", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const trigger = page.getByRole("button", {
    name: "Open sample reward overlay",
    exact: true,
  });
  await trigger.click();
  const modal = page.getByRole("dialog", {
    name: "Sample reward overlay",
    exact: true,
  });
  const close = modal.getByRole("button", {
    name: "Close sample reward overlay",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    modal.getByRole("button", { name: "Confirm sample reward", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  const busy = modal.getByRole("checkbox", {
    name: "Sample reward busy",
    exact: true,
  });
  await expect(busy).toBeFocused();
  await page.keyboard.press("Space");
  await expect(close).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(modal).toBeVisible();
  await page.keyboard.press("Space");
  await expect(close).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(backend.requests).toEqual([]);
  backend.verify();
});
