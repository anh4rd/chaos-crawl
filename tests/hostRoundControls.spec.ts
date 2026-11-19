import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedHostRoundControls } from "./support/hostRoundControls";

async function openRounds(
  page: Page,
  options: Parameters<typeof seedHostRoundControls>[1] = {},
) {
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, options);
  if (options.onBreak)
    await page.addInitScript(() => {
      localStorage.setItem(
        "chaos-crawl-host-round-clock:test-session:1",
        JSON.stringify({
          seconds: 60,
          running: true,
          onBreak: true,
          resumeRound: 2,
          updatedAt: Date.now(),
        }),
      );
    });
  await page.goto("#/host/live/test-session");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  const plan = page.locator(".content-panel").filter({
    has: page.getByRole("heading", { name: "Your challenges", exact: true }),
  });
  return { backend, plan };
}

for (const currentRound of [1, 2]) {
  test(`round plan permits keyboard navigation ${currentRound === 1 ? "forward" : "backward"} with the existing payload`, async ({
    page,
  }) => {
    const { backend, plan } = await openRounds(page, { currentRound });
    if (currentRound === 1) {
      const preview = page.locator("article").filter({
        has: page.getByText("▶ NEXT CHALLENGE · ROUND 2", { exact: true }),
      });
      await expect(
        preview.getByText("Second entrance", { exact: true }),
      ).toBeVisible();
      await expect(
        preview.getByText("Follow the next challenge.", { exact: true }),
      ).toBeVisible();
    }
    const selectedTitle =
      currentRound === 1 ? "Make an entrance" : "Second entrance";
    const nextTitle =
      currentRound === 1 ? "Second entrance" : "Make an entrance";
    await expect(
      plan.getByRole("button", { name: new RegExp(selectedTitle) }),
    ).toBeDisabled();
    let release = () => {};
    let requests = 0;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "**/rest/v1/rpc/cc_host_set_game_session_round",
      async (route) => {
        requests += 1;
        await pending;
        await route.fallback();
      },
    );
    try {
      const target = plan.getByRole("button", { name: new RegExp(nextTitle) });
      await activateByKeyboard(page, target);
      await expect(target).toBeDisabled();
      await expect(
        plan.getByRole("button", { name: new RegExp(selectedTitle) }),
      ).toBeDisabled();
      await page.keyboard.press("Enter");
      expect(requests).toBe(1);
    } finally {
      release();
    }
    await expect
      .poll(
        () =>
          backend.requests.filter(
            (r) => r.name === "cc_host_set_game_session_round",
          ).length,
      )
      .toBe(1);
    expect(
      backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
        ?.body,
    ).toEqual({
      p_session_id: "test-session",
      p_round_number: currentRound === 1 ? 2 : 1,
    });
    backend.verify();
  });
}

test("round plan retains autoplay confirmation before changing the round", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page, { autoplay: true });
  const next = plan.getByRole("button", { name: /Second entrance/ });
  await activateByKeyboard(page, next);
  const modal = page.getByRole("alertdialog", {
    name: "Override autoplay?",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(next).toBeFocused();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  await activateByKeyboard(page, next);
  await activateByKeyboard(
    page,
    modal.getByRole("button", { name: "Override & move round", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_set_game_session_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
      ?.body,
  ).toEqual({ p_session_id: "test-session", p_round_number: 2 });
  backend.verify();
});

test("planned break preview and round-plan selection preserve the break before the round command", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page, { breakMinutes: 1 });
  const preview = page.locator("article").filter({
    has: page.getByText("▶ NEXT UP · BREAK · 1 MIN", { exact: true }),
  });
  await expect(
    preview.getByText("Break · 1 minutes", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByText("After the break: Second entrance", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "Edit next challenge", exact: true }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    plan.getByRole("button", { name: /Second entrance/ }),
  );
  await expect(
    page.getByText("BREAK IN PROGRESS", { exact: true }),
  ).toBeVisible();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toHaveLength(0);
  const writes = backend.requests.filter(
    (r) => r.name === "cc_game_session_timers" && r.method === "POST",
  );
  expect(
    writes.some(
      (r) =>
        typeof r.body === "object" &&
        r.body !== null &&
        "is_on_break" in r.body &&
        r.body.is_on_break === true &&
        "resume_round_number" in r.body &&
        r.body.resume_round_number === 2,
    ),
  ).toBe(true);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Start Now", exact: true }),
  );
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_host_set_game_session_round",
        ).length,
    )
    .toBe(1);
  expect(
    backend.requests.find((r) => r.name === "cc_host_set_game_session_round")
      ?.body,
  ).toEqual({ p_session_id: "test-session", p_round_number: 2 });
  backend.verify();
});

test("active break preview takes precedence over the next challenge and hides its edit action", async ({
  page,
}) => {
  const { backend } = await openRounds(page, {
    onBreak: true,
    breakMinutes: 1,
  });
  const preview = page
    .locator("article")
    .filter({ has: page.getByText("BREAK IN PROGRESS", { exact: true }) });
  await expect(
    preview.getByText("Round 2 follows the break", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByText(
      "Players will be moved to the next challenge when the break ends.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "Edit next challenge", exact: true }),
  ).toHaveCount(0);
  backend.verify();
});

test("completed round plan is read-only and has no upcoming-stage preview", async ({
  page,
}) => {
  const { backend, plan } = await openRounds(page, { completed: true });
  await expect(
    plan.getByRole("button", { name: /Make an entrance/ }),
  ).toBeDisabled();
  await expect(
    plan.getByRole("button", { name: /Second entrance/ }),
  ).toBeDisabled();
  await expect(
    page.getByText(/▶ NEXT CHALLENGE|▶ NEXT UP|BREAK IN PROGRESS/),
  ).toHaveCount(0);
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  backend.verify();
});

test("shared stage/plan reference selects local rounds and preserves read-only and break states", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const exampleHeading = page.getByRole("heading", {
    name: "Shared stage preview and round plan",
    exact: true,
  });
  const example = page
    .locator("article.component-example")
    .filter({ has: exampleHeading });
  const second = example.getByRole("button", { name: /Team portrait.*40 pts/ });
  await second.click();
  await expect(second).toBeDisabled();
  await expect(example.getByRole("status")).toHaveText(
    "Sample plan round 2 selected locally.",
  );
  await example
    .getByRole("checkbox", { name: "Sample round plan read-only", exact: true })
    .check();
  await expect(
    example.getByRole("button", { name: /Make an entrance.*20 pts/ }),
  ).toBeDisabled();
  await expect(second).toBeDisabled();
  await example
    .getByRole("checkbox", { name: "Sample round plan read-only", exact: true })
    .uncheck();
  await example
    .getByRole("button", { name: "Edit sample stage", exact: true })
    .click();
  await expect(example.getByRole("status")).toHaveText(
    "Sample stage edit selected locally.",
  );
  await example
    .getByRole("checkbox", { name: "Sample stage break active", exact: true })
    .check();
  await expect(
    example.getByText("Round 2 follows the break", { exact: true }),
  ).toBeVisible();
  await expect(
    example.getByRole("button", { name: "Edit sample stage", exact: true }),
  ).toHaveCount(0);
  expect(backend.requests).toEqual([]);
  backend.verify();
});
