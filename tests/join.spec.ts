import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

const credentialKey = "chaos-crawl-session-player:123456";
const missingSession =
  "Couldn't complete player access. Check your details and try again.";
const recoveryCode =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc";

async function enterDetails(page: Page, returning = false) {
  await page.goto(`#/join?code=123456${returning ? "&returning=1" : ""}`);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
}

async function typeField(page: Page, label: string, value: string) {
  await tabTo(page, page.getByLabel(label, { exact: true }));
  await page.keyboard.type(value);
}

function joinRequests(
  backend: Awaited<ReturnType<typeof installSessionBackend>>,
) {
  return backend.requests.filter(
    (request) => request.name === "player-identity",
  );
}

test("join code filters input, preserves details across Back and sends nothing before a valid submit", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?code=12x3456789");
  const progress = page.getByRole("progressbar", { name: "Join progress" });
  await expect(progress).toHaveCount(0);
  const code = page.getByRole("textbox", { name: "Enter six digit game code" });
  await expect(code).toHaveValue("123456");
  await tabTo(page, code);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("a12345");
  await expect(code).toHaveValue("12345");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page.keyboard.type("6");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await expect(page.getByText("Join progress", { exact: true })).toBeVisible();
  await typeField(page, "Your name?", " Pat ");
  await typeField(page, "Your phone number?", "1234567");
  await expect(
    page.getByRole("button", { name: "Join game", exact: true }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "← Back", exact: true }),
  );
  await expect(progress).toHaveCount(0);
  await expect(code).toHaveValue("123456");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveValue(
    " Pat ",
  );
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveAttribute(
    "maxlength",
    "60",
  );
  await expect(
    page.getByLabel("Your phone number?", { exact: true }),
  ).toHaveValue("1234567");
  expect(joinRequests(backend)).toHaveLength(0);
  backend.verify();
});

test("the player waiting screen completes join progress and hides it when play starts", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, {
    savedPlayer: false,
    lobby: true,
  });
  await enterDetails(page);
  await page.getByLabel("Your name?", { exact: true }).fill("Pat");
  await page
    .getByLabel("Your phone number?", { exact: true })
    .fill("0712345678");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await page.getByRole("button", { name: "Continue without saving" }).click();
  const progress = page.getByRole("progressbar", { name: "Join progress" });
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 3 of 3");
  await expect(page.getByText("Join progress", { exact: true })).toBeVisible();
  await expect(
    page.locator(".session-titlebar + .join-progress"),
  ).toBeVisible();
  await expect(page.locator(".session-profile")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Game pages" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Take a tour/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Copy game code" }),
  ).toBeVisible();
  backend.session.status = "live";
  await expect(progress).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(".session-profile")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Game pages" }),
  ).toBeVisible();
  const tour = page.getByRole("button", { name: /Take a tour/ });
  await expect(tour).toBeVisible();
  await tour.click();
  const dialog = page.getByRole("dialog", { name: /PLAYER TOUR/ });
  await expect(dialog).toBeVisible();
  backend.session.status = "lobby";
  await expect(dialog).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(".session-profile")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Game pages" }),
  ).toHaveCount(0);
  backend.session.status = "live";
  await expect(tour).toBeVisible({ timeout: 10_000 });
  await expect(dialog).toHaveCount(0);
  backend.verify();
});

test("embedded host participation does not render player join progress", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { lobby: true });
  await page.goto("#/play/123456/game?hostEmbed=1");
  await expect(page.getByText("Waiting for the host…")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Join progress" }),
  ).toHaveCount(0);
  backend.verify();
});

test("join trims its payload, stores only the V2 credential and replaces the join history entry", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.addInitScript(() =>
    localStorage.setItem("chaos-crawl-player-id", "legacy-player"),
  );
  await enterDetails(page);
  await typeField(page, "Your name?", "  Pat  ");
  await typeField(page, "Your phone number?", "  0712345678  ");
  const historyIndex = await page.evaluate(() => window.history.state.idx);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join game", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Continue without saving" }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)).toHaveLength(1);
  expect(joinRequests(backend)[0].body).toMatchObject({
    action: "register",
    join_code: "123456",
    name: "Pat",
    mobile: "0712345678",
  });
  expect(
    await page.evaluate((key) => localStorage.getItem(key), credentialKey),
  ).toBe("test-player-token");
  expect(
    await page.evaluate(() => localStorage.getItem("chaos-crawl-player-id")),
  ).toBe("legacy-player");
  expect(await page.evaluate(() => window.history.state)).toMatchObject({
    idx: historyIndex,
    usr: { welcomeBack: false },
  });
  backend.verify();
});

test("join automatically recovers an existing player by phone", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses["player-identity"] = {
    player_token: "returning-token",
    join_code: "123456",
    player_name: "Pat",
    resumed: true,
  };
  let registrations = 0;
  await page.route("**/functions/v1/player-identity", async (route) => {
    if (route.request().postDataJSON().action === "register") {
      registrations += 1;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ error: "Unable to complete this request." }),
      });
    } else {
      await route.fallback();
    }
  });
  await enterDetails(page);
  await typeField(page, "Your name?", "Pat");
  await typeField(page, "Your phone number?", "0712345678");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join game", exact: true }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(registrations).toBe(1);
  expect(joinRequests(backend)).toHaveLength(1);
  expect(joinRequests(backend)[0].body).toMatchObject({
    action: "recover_phone",
    join_code: "123456",
    mobile: "0712345678",
  });
  expect(await page.evaluate(() => window.history.state.usr)).toMatchObject({
    welcomeBack: true,
  });
  expect(
    await page.evaluate((key) => localStorage.getItem(key), credentialKey),
  ).toBe("returning-token");
  backend.verify();
});

test("rejoin uses the recovery credential and preserves the resumed redirect state", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses["player-identity"] = {
    player_token: "test-player-token",
    join_code: "123456",
    player_name: "Pat",
    resumed: true,
  };
  await page.goto("#/join?code=123456&returning=1");
  const progress = page.getByRole("progressbar", { name: "Join progress" });
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 1 of 3");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(
    page.getByRole("progressbar", { name: "Join progress" }),
  ).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Use recovery code instead",
      exact: true,
    }),
  );
  await typeField(page, "Recovery code", recoveryCode);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Rejoin game", exact: true }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)[0].body).toEqual({
    action: "recover",
    join_code: "123456",
    credential: recoveryCode,
  });
  expect(await page.evaluate(() => window.history.state.usr)).toEqual({
    welcomeBack: true,
  });
  backend.verify();
});

test("failed join retains details, clears its error on mode change and retries with the selected mode", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.failures.add("player-identity");
  await enterDetails(page);
  await page.getByLabel("Your name?", { exact: true }).fill("Pat");
  await page
    .getByLabel("Your phone number?", { exact: true })
    .fill("0712345678");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join game", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText(
    "Player access is temporarily unavailable. Please try again or ask the host for help.",
  );
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveValue(
    "Pat",
  );
  await expect(
    page.getByLabel("Your phone number?", { exact: true }),
  ).toHaveValue("0712345678");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), credentialKey),
  ).toBeNull();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "← Back", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Already joined? Rejoin", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await activateByKeyboard(
    page,
    page.getByRole("button", {
      name: "Use recovery code instead",
      exact: true,
    }),
  );
  await typeField(page, "Recovery code", recoveryCode);
  backend.failures.delete("player-identity");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Rejoin game", exact: true }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)).toHaveLength(2);
  expect(joinRequests(backend)[1].body).toMatchObject({
    action: "recover",
    credential: recoveryCode,
  });
  backend.verify();
});

test("pending join disables submit, keeps fields editable and preserves the captured request values", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route("**/functions/v1/player-identity", async (route) => {
    received = true;
    await gate;
    await route.fallback();
  });
  try {
    await enterDetails(page);
    await page.getByLabel("Your name?", { exact: true }).fill("Pat");
    await page
      .getByLabel("Your phone number?", { exact: true })
      .fill("0712345678");
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Join game", exact: true }),
    );
    await expect.poll(() => received).toBe(true);
    await expect(
      page.getByRole("button", { name: "Joining…", exact: true }),
    ).toBeDisabled();
    await page
      .getByLabel("Your name?", { exact: true })
      .fill("Changed while pending");
    await expect(
      page.getByLabel("Your phone number?", { exact: true }),
    ).toBeEditable();
    release();
    await page.getByRole("button", { name: "Continue without saving" }).click();
    await expect(page).toHaveURL(/\/play\/123456$/);
    expect(joinRequests(backend)).toHaveLength(1);
    expect(joinRequests(backend)[0].body).toMatchObject({ name: "Pat" });
    backend.verify();
  } finally {
    release();
  }
});

for (const result of [null, { join_code: "123456", player_token: "" }]) {
  test(`incomplete join response ${result === null ? "null" : "missing token"} stays recoverable without storing credentials`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { savedPlayer: false });
    backend.responses["player-identity"] = result;
    await enterDetails(page);
    await page.getByLabel("Your name?", { exact: true }).fill("Pat");
    await page
      .getByLabel("Your phone number?", { exact: true })
      .fill("0712345678");
    await activateByKeyboard(
      page,
      page.getByRole("button", { name: "Join game", exact: true }),
    );
    await expect(page.getByRole("alert")).toHaveText(missingSession);
    await expect(
      page.getByRole("button", { name: "Join game", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), credentialKey),
    ).toBeNull();
    await expect(page).toHaveURL(/\/join\?code=123456$/);
    backend.verify();
  });
}

test("credential storage failure reports its error and leaves the join form recoverable", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("chaos-crawl-session-player:"))
        throw new Error("Credential storage unavailable");
      setItem.call(this, key, value);
    };
  });
  await enterDetails(page);
  await page.getByLabel("Your name?", { exact: true }).fill("Pat");
  await page
    .getByLabel("Your phone number?", { exact: true })
    .fill("0712345678");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join game", exact: true }),
  );
  await expect(page.getByRole("alert")).toHaveText(missingSession);
  await expect(
    page.getByRole("button", { name: "Join game", exact: true }),
  ).toBeEnabled();
  await expect(page).toHaveURL(/\/join\?code=123456$/);
  backend.verify();
});

test("query code updates hydrate the existing form while returning mode remains an entry choice", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?returning=1&code=111111");
  await expect(
    page.getByRole("heading", { name: "Back for more chaos" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = "/join?code=123456";
  });
  await expect(
    page.getByRole("textbox", { name: "Enter six digit game code" }),
  ).toHaveValue("123456");
  await expect(
    page.getByRole("heading", { name: "Back for more chaos" }),
  ).toBeVisible();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveCount(0);
  expect(joinRequests(backend)).toHaveLength(0);
  backend.verify();
});

test("local join reference advances by keyboard, exposes pending controls and never stores a credential", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/styleguide");
  const example = page.locator(".component-example").filter({
    has: page.getByRole("heading", {
      name: "Local join and rejoin",
      exact: true,
    }),
  });
  await activateByKeyboard(
    page,
    example.locator("summary", { hasText: "Open local join form" }),
  );
  const progress = example.getByRole("progressbar", { name: "Join progress" });
  await expect(progress).toHaveCount(0);
  await tabTo(
    page,
    example.getByRole("textbox", { name: "Enter six digit game code" }),
  );
  await page.keyboard.type("123456");
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Next", exact: true }),
  );
  await expect(progress).toHaveAttribute("aria-valuetext", "Step 2 of 3");
  await tabTo(page, example.getByLabel("Your name?", { exact: true }));
  await page.keyboard.type("Local Pat");
  await tabTo(page, example.getByLabel("Your phone number?", { exact: true }));
  await page.keyboard.type("0712345678");
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Join game", exact: true }),
  );
  await expect(
    example
      .getByText("Sample join submitted locally.", { exact: true })
      .first(),
  ).toBeVisible();
  const pending = example.getByRole("checkbox", {
    name: "Simulate pending join",
  });
  await tabTo(page, pending, "backward");
  await page.keyboard.press("Space");
  await expect(
    example.getByRole("button", { name: "Joining…", exact: true }),
  ).toBeDisabled();
  await expect(
    example.getByLabel("Your name?", { exact: true }),
  ).toBeEditable();
  await expect(
    example.getByLabel("Your phone number?", { exact: true }),
  ).toBeEditable();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), credentialKey),
  ).toBeNull();
  const sampleError = example.getByRole("checkbox", {
    name: "Show sample join error",
  });
  await tabTo(page, sampleError);
  await page.keyboard.press("Space");
  await expect(example.getByRole("alert")).toHaveText(
    "Sample join error. This reference remains local.",
  );
  await page.keyboard.press("Space");
  await expect(example.getByRole("alert")).toHaveCount(0);
  expect(backend.requests).toHaveLength(0);
  backend.verify();
});

async function holdJoin(page: Page) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route("**/functions/v1/player-identity", async (route) => {
    received = true;
    await gate;
    await route.fallback();
  });
  return {
    received: () => received,
    release,
    complete: async () => {
      const response = page.waitForResponse("**/functions/v1/player-identity");
      release();
      await (await response).finished();
    },
  };
}

async function beginPendingJoin(
  page: Page,
  held: Awaited<ReturnType<typeof holdJoin>>,
) {
  await enterDetails(page);
  await typeField(page, "Your name?", "Pat");
  await typeField(page, "Your phone number?", "0712345678");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Join game", exact: true }),
  );
  await expect.poll(held.received).toBe(true);
  await expect(
    page.getByRole("button", { name: "Joining…", exact: true }),
  ).toBeDisabled();
}

test("a join finishing after leaving the form cannot store credentials or redirect away from the chosen page", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  const held = await holdJoin(page);
  try {
    await beginPendingJoin(page, held);
    await page.evaluate(() => {
      window.location.hash = "/styleguide";
    });
    await expect(
      page.getByRole("heading", { name: "Local join and rejoin", exact: true }),
    ).toBeVisible();
    await held.complete();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page).toHaveURL(/\/styleguide$/);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), credentialKey),
    ).toBeNull();
    expect(joinRequests(backend)).toHaveLength(1);
    backend.verify();
  } finally {
    held.release();
  }
});

for (const outcome of ["success", "failure"] as const) {
  test(`an obsolete join ${outcome} cannot overwrite a changed query target or its feedback`, async ({
    page,
  }) => {
    const backend = await installSessionBackend(page, { savedPlayer: false });
    if (outcome === "failure") backend.failures.add("player-identity");
    const held = await holdJoin(page);
    try {
      await beginPendingJoin(page, held);
      await page.evaluate(() => {
        window.location.hash = "/join?code=654321";
      });
      await expect(page.locator(".form-stack__code strong")).toHaveText(
        "654321",
      );
      await held.complete();
      await expect(
        page.getByRole("button", { name: "Join game", exact: true }),
      ).toBeEnabled();
      await expect(page).toHaveURL(/\/join\?code=654321$/);
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(
        await page.evaluate((key) => localStorage.getItem(key), credentialKey),
      ).toBeNull();
      expect(joinRequests(backend)).toHaveLength(1);
      expect(joinRequests(backend)[0].body).toMatchObject({
        action: "register",
        join_code: "123456",
        name: "Pat",
        mobile: "0712345678",
      });
      backend.verify();
    } finally {
      held.release();
    }
  });
}
