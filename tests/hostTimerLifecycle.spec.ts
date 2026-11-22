import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";
import { seedHostRoundControls } from "./support/hostRoundControls";

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date("2030-01-01T12:00:00Z") });
}
async function saveClock(page: Page, snapshot: Record<string, unknown>) {
  await page.addInitScript((value) => {
    localStorage.setItem(
      "chaos-crawl-host-round-clock:test-session:1",
      JSON.stringify({ ...value, updatedAt: Date.now() }),
    );
  }, snapshot);
}
async function openHost(page: Page) {
  await page.goto("#/host/live/test-session");
  await expect(
    page.getByRole("button", { name: "Host", exact: true }),
  ).toBeVisible();
  const pauseAt = await page.evaluate(() => Date.now() + 100);
  await page.clock.pauseAt(new Date(pauseAt));
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Host", exact: true }),
  );
  return page.getByRole("region", { name: "Host controls", exact: true });
}

test("expired break denial waits for an explicit keyboard retry instead of looping", async ({
  page,
}) => {
  await freezeClock(page);
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend, { onBreak: true });
  backend.failures.add("cc_host_set_game_session_round");
  await saveClock(page, {
    seconds: 0,
    running: false,
    onBreak: true,
    resumeRound: 2,
  });
  const controls = await openHost(page);
  await expect(
    page.getByText("Fixture connection failed", { exact: true }),
  ).toBeVisible();
  const count = () =>
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round")
      .length;
  expect(count()).toBe(1);
  await page.clock.runFor(11000);
  expect(count()).toBe(1);
  backend.failures.delete("cc_host_set_game_session_round");
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Start Now", exact: true }),
  );
  await expect.poll(count).toBe(2);
  await expect(
    controls.getByRole("button", { name: "Start Timer", exact: true }),
  ).toBeVisible();
  expect(
    backend.requests
      .filter((r) => r.name === "cc_host_set_game_session_round")
      .map((r) => r.body),
  ).toEqual([
    { p_session_id: "test-session", p_round_number: 2 },
    { p_session_id: "test-session", p_round_number: 2 },
  ]);
  backend.verify();
});

test("corrupted persisted break cannot publish or navigate with a nonnumeric round", async ({
  page,
}) => {
  await freezeClock(page);
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend);
  await saveClock(page, {
    seconds: 0,
    running: true,
    onBreak: true,
    resumeRound: { round: 2 },
  });
  const controls = await openHost(page);
  await expect(
    controls.getByRole("button", { name: "Start Timer", exact: true }),
  ).toBeVisible();
  await expect(controls.getByText("05:00", { exact: true })).toBeVisible();
  expect(
    backend.requests.filter((r) => r.name === "cc_host_set_game_session_round"),
  ).toEqual([]);
  await expect
    .poll(
      () =>
        backend.requests.filter(
          (r) => r.name === "cc_game_session_timers" && r.method === "POST",
        ).length,
    )
    .toBeGreaterThan(0);
  for (const request of backend.requests.filter(
    (r) => r.name === "cc_game_session_timers" && r.method === "POST",
  )) {
    expect(request.body).toMatchObject({
      is_on_break: false,
      resume_round_number: null,
    });
  }
  backend.verify();
});

test("host edits and extends the shared clock through keyboard controls", async ({
  page,
}) => {
  await freezeClock(page);
  const backend = await installSessionBackend(page, { host: true });
  seedHostRoundControls(backend);
  await saveClock(page, {
    seconds: 300,
    running: false,
    onBreak: false,
    resumeRound: null,
  });
  const controls = await openHost(page);
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Edit Time" }),
  );
  const dialog = page.getByRole("dialog", { name: "Edit round timer" });
  await dialog.getByLabel("Minutes").fill("2");
  await activateByKeyboard(
    page,
    dialog.getByRole("button", { name: "Save timer" }),
  );
  await expect(controls.getByText("02:00", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Start Timer" }),
  );
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "+1 Min" }),
  );
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "+5 Min" }),
  );
  await expect(controls.getByText("08:00", { exact: true })).toBeVisible();
  await expect
    .poll(
      () =>
        backend.requests
          .filter(
            (r) => r.name === "cc_game_session_timers" && r.method === "POST",
          )
          .at(-1)?.body,
    )
    .toMatchObject({
      remaining_seconds: 480,
      is_running: true,
      is_on_break: false,
    });
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Pause" }),
  );
  await expect(controls.getByText("08:00", { exact: true })).toBeVisible();
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "Start Timer" }),
  );
  await activateByKeyboard(
    page,
    controls.getByRole("button", { name: "End Early" }),
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    backend.requests.filter(
      (r) => r.name.includes("award") && r.method !== "GET",
    ),
  ).toEqual([]);
  backend.verify();
});

test("local host control stages remain usable without horizontal overflow", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("#/styleguide");
  const stage = page.getByLabel("Preview host control stage");
  const controls = page.getByRole("region", {
    name: "Host controls",
    exact: true,
  });
  for (const [value, heading] of [
    ["ready", "START TIMER"],
    ["running", "ROUND IN PROGRESS"],
    ["expired", "TIME'S UP – REVIEW"],
    ["reviewing", "REVIEW IN PROGRESS"],
    ["awarded", "ROUND COMPLETE"],
    ["break", "BREAK IN PROGRESS"],
    ["complete", "GAME COMPLETE"],
  ]) {
    await stage.selectOption(value);
    await expect(
      controls.getByRole("heading", { name: heading }),
    ).toBeVisible();
    const sizes = await controls.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        width: box.width,
        scrollWidth: element.scrollWidth,
        buttons: [...element.querySelectorAll("button")]
          .filter((button) => button.getBoundingClientRect().height > 0)
          .map((button) => button.getBoundingClientRect().height),
      };
    });
    expect(sizes.scrollWidth).toBeLessThanOrEqual(Math.ceil(sizes.width));
    expect(sizes.buttons.every((height) => height >= 44)).toBe(true);
  }
  backend.verify();
});

test("fractional saved lobby step recovers to usable invite content", async ({
  page,
}) => {
  await freezeClock(page);
  const backend = await installSessionBackend(page, {
    host: true,
    lobby: true,
  });
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-host-flow:test-session", "2.5"),
  );
  await page.goto("#/host/live/test-session");
  await expect(
    page.getByRole("heading", { name: "Share the invite", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("123456", { exact: true })).toBeVisible();
  backend.verify();
});

for (const state of ["paused", "running", "break", "completed"] as const) {
  test(`preserves ${state} timer presentation`, async ({ page }, testInfo) => {
    await freezeClock(page);
    const backend = await installSessionBackend(page, { host: true });
    seedHostRoundControls(backend, { completed: state === "completed" });
    if (state !== "completed")
      await saveClock(page, {
        seconds: state === "break" ? 90 : 240,
        running: false,
        onBreak: state === "break",
        resumeRound: state === "break" ? 2 : null,
      });
    const controls = await openHost(page);
    if (state === "running")
      await activateByKeyboard(
        page,
        controls.getByRole("button", { name: "Start Timer", exact: true }),
      );
    if (state === "completed")
      await expect(
        controls.getByText(
          "Game complete. Your players can review the final scores.",
          { exact: true },
        ),
      ).toBeVisible();
    else
      await expect(
        controls
          .getByText(state === "break" ? "01:30" : "04:00", { exact: true })
          .first(),
      ).toBeVisible();
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.fonts.ready);
    const capture = process.env.TIMER_CAPTURE_DIR;
    if (capture) {
      mkdirSync(capture, { recursive: true });
      const name = `${testInfo.project.name}-${state}`;
      const result = await page.evaluate(() => {
        const root = document.querySelector("main");
        if (!root) throw new Error("Missing main");
        return {
          dom: root.outerHTML,
          styles: [root, ...root.querySelectorAll("*")].map((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              classes: element.className,
              box: [box.x, box.y, box.width, box.height],
              styles: Object.fromEntries(
                [...style].map((key) => [key, style.getPropertyValue(key)]),
              ),
            };
          }),
        };
      });
      writeFileSync(`${capture}/${name}.json`, JSON.stringify(result));
      await page.screenshot({
        path: `${capture}/${name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    backend.verify();
  });
}
