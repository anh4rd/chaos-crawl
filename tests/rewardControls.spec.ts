import { expect, test } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedRewardControls } from "./support/rewardControls";

for (const method of ["voting", "host_awards", "audience_cheers"] as const) {
  test(`${method} setup preserves challenge points, target and start payload`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { host: true });
    backend.challenges[1].points = 45;
    backend.responses.cc_host_start_session_reward_round = {
      reward_method: method,
    };
    await page.goto("#/host/live/test-session");
    await page.getByRole("button", { name: "Host", exact: true }).click();
    await page
      .getByRole("region", { name: "Host controls", exact: true })
      .getByRole("button", { name: "Review", exact: true })
      .click();
    const panel = page.getByRole("dialog", {
      name: "Review points and voting",
      exact: true,
    });
    const target = panel.getByRole("combobox", {
      name: "Reward players or teams?",
      exact: true,
    });
    await expect(target.locator('option[value="team"]')).toHaveJSProperty(
      "disabled",
      true,
    );
    await panel
      .getByRole("combobox", { name: "Challenge", exact: true })
      .selectOption("test-side-challenge");
    await expect(
      panel.getByRole("spinbutton", { name: "Points per winner", exact: true }),
    ).toHaveValue("45");
    await panel
      .getByRole("combobox", { name: "Reward method", exact: true })
      .selectOption(method);
    await panel
      .getByRole("spinbutton", { name: "Points per winner", exact: true })
      .fill("37");
    await activateByKeyboard(
      page,
      panel.getByRole("button", { name: "Start reward flow", exact: true }),
    );
    await expect
      .poll(
        () =>
          backend.requests.filter(
            (r) => r.name === "cc_host_start_session_reward_round",
          ).length,
      )
      .toBe(1);
    expect(
      backend.requests.find(
        (r) => r.name === "cc_host_start_session_reward_round",
      )?.body,
    ).toEqual({
      p_session_id: "test-session",
      p_challenge_id: "test-side-challenge",
      p_reward_method: method,
      p_target_kind: "player",
      p_points: 37,
    });
    backend.verify();
  });
}

for (const method of ["host_awards", "audience_cheers"] as const) {
  for (const target of ["player", "team"] as const) {
    test(`${method} ${target} award preserves selection, cancellation and points payload`, async ({
      page,
    }) => {
      const backend = await installSessionBackend(page, { host: true });
      seedRewardControls(backend, method, target);
      backend.responses.cc_host_complete_session_reward_round = {
        winner_count: target === "team" ? 1 : 2,
        points_awarded: 37,
      };
      await page.goto("#/host/live/test-session");
      await page.getByRole("button", { name: "Host", exact: true }).click();
      await page
        .getByRole("button", { name: "Continue reward flow", exact: true })
        .click();
      const panel = page.getByRole("dialog", {
        name: "Review points and voting",
        exact: true,
      });
      const confirm = panel.getByRole("button", {
        name: "Confirm winners & award points",
        exact: true,
      });
      await expect(confirm).toBeDisabled();
      const first = panel.getByRole("button", {
        name: `Select winner ${target === "team" ? "Team Chaos" : "Pat"}`,
        exact: true,
      });
      await activateByKeyboard(page, first);
      await expect(first).toHaveAttribute("aria-pressed", "true");
      if (target === "player")
        await activateByKeyboard(
          page,
          panel.getByRole("button", { name: "Select winner Sam", exact: true }),
        );
      await panel
        .getByRole("spinbutton", {
          name: "Points to award each winner",
          exact: true,
        })
        .fill("37");
      page.once("dialog", (dialog) => void dialog.dismiss());
      await activateByKeyboard(page, confirm);
      expect(
        backend.requests.filter(
          (r) => r.name === "cc_host_complete_session_reward_round",
        ),
      ).toHaveLength(0);
      page.once("dialog", (dialog) => void dialog.accept());
      await page.keyboard.press("Enter");
      await expect
        .poll(
          () =>
            backend.requests.filter(
              (r) => r.name === "cc_host_complete_session_reward_round",
            ).length,
        )
        .toBe(1);
      expect(
        backend.requests.find(
          (r) => r.name === "cc_host_complete_session_reward_round",
        )?.body,
      ).toEqual({
        p_reward_round_id: "reward-1",
        p_winner_player_ids: target === "player" ? ["test-player", "sam"] : [],
        p_winner_team_ids: target === "team" ? ["team-1"] : [],
        p_points: 37,
      });
      backend.verify();
    });
  }
}

test("published reward can return everyone to the game with the existing release command", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { host: true });
  seedRewardControls(backend, "host_awards", "player", "completed");
  backend.responses.cc_host_release_session_reward_round = null;
  await page.goto("#/host/live/test-session");
  await page.getByRole("button", { name: "Host", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue reward flow", exact: true })
    .click();
  const panel = page.getByRole("dialog", {
    name: "Review points and voting",
    exact: true,
  });
  await activateByKeyboard(
    page,
    panel.getByRole("button", { name: "Return everyone to game", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_release_session_reward_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find(
      (r) => r.name === "cc_host_release_session_reward_round",
    )?.body,
  ).toEqual({ p_reward_round_id: "reward-1" });
  await expect(panel).toHaveCount(0);
  backend.verify();
});
