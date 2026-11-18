import { expect, test, type Page } from "@playwright/test";
import { activateByKeyboard, tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

const credentialKey = "chaos-crawl-session-player:123456";
const missingSession =
  "The game didn't return a player session. Try again or ask the host for a new code.";

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
    (request) => request.name === "cc_join_game_session",
  );
}

test("join code filters input, preserves details across Back and sends nothing before a valid submit", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?code=12x3456789");
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
  await typeField(page, "Your name?", " Pat ");
  await typeField(page, "Your phone number?", "1234567");
  await expect(
    page.getByRole("button", { name: "Join game", exact: true }),
  ).toBeDisabled();
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "← Back", exact: true }),
  );
  await expect(code).toHaveValue("123456");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Next", exact: true }),
  );
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
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)).toHaveLength(1);
  expect(joinRequests(backend)[0].body).toEqual({
    p_join_code: "123456",
    p_name: "Pat",
    p_mobile: "0712345678",
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

test("rejoin uses the original mobile number and no name, preserving the resumed redirect state", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses.cc_join_game_session = {
    player_token: "test-player-token",
    join_code: "123456",
    player_name: "Pat",
    resumed: true,
  };
  await enterDetails(page, true);
  await expect(page.getByLabel("Your name?", { exact: true })).toHaveCount(0);
  await typeField(page, "Your phone number?", " 0712345678 ");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Rejoin game", exact: true }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)[0].body).toEqual({
    p_join_code: "123456",
    p_name: null,
    p_mobile: "0712345678",
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
  backend.failures.add("cc_join_game_session");
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
    "Couldn't join this game. Check the code and try again.",
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
  await expect(
    page.getByLabel("Your phone number?", { exact: true }),
  ).toHaveValue("0712345678");
  backend.failures.delete("cc_join_game_session");
  await activateByKeyboard(
    page,
    page.getByRole("button", { name: "Rejoin game", exact: true }),
  );
  await expect(page).toHaveURL(/\/play\/123456$/);
  expect(joinRequests(backend)).toHaveLength(2);
  expect(joinRequests(backend)[1].body).toMatchObject({ p_name: null });
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
  await page.route("**/rest/v1/rpc/cc_join_game_session", async (route) => {
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
    await expect(page).toHaveURL(/\/play\/123456$/);
    expect(joinRequests(backend)).toHaveLength(1);
    expect(joinRequests(backend)[0].body).toMatchObject({ p_name: "Pat" });
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
    backend.responses.cc_join_game_session = result;
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
  await expect(page.getByRole("alert")).toHaveText(
    "Credential storage unavailable",
  );
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
  await tabTo(
    page,
    example.getByRole("textbox", { name: "Enter six digit game code" }),
  );
  await page.keyboard.type("123456");
  await activateByKeyboard(
    page,
    example.getByRole("button", { name: "Next", exact: true }),
  );
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
  expect(backend.requests).toHaveLength(0);
  backend.verify();
});
