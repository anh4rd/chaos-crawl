import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

test("saved player sessions resume before asking for join details", async ({
  page,
}) => {
  const backend = await installSessionBackend(page);
  await page.goto("#/join?code=123456&returning=1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/#\/play\/123456/);
  expect(
    backend.requests.filter((r) => r.name === "player-identity"),
  ).toHaveLength(0);
  expect(
    backend.requests.filter((r) => r.name === "cc_get_game_session_view")
      .length,
  ).toBeGreaterThan(0);
  backend.verify();
});

test("phone recovery reuses the existing player and saves the replacement token", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  backend.responses["player-identity"] = {
    player_token: "recovered-token",
    join_code: "123456",
    player_name: "Pat",
    resumed: true,
  };
  await page.goto("#/join?code=123456&returning=1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Anyone who knows your game code/)).toBeVisible();
  const country = page.getByLabel("Country calling code");
  await tabTo(page, country);
  await page.keyboard.type("United");
  await expect(country).toHaveValue("44");
  await tabTo(page, page.getByLabel("Your phone number?"));
  await page.keyboard.type("07123 456789");
  await tabTo(
    page,
    page.getByRole("button", { name: "Rejoin game", exact: true }),
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/play\/123456/);
  expect(
    backend.requests.find((r) => r.name === "player-identity")?.body,
  ).toEqual({
    action: "recover_phone",
    join_code: "123456",
    mobile: "+447123456789",
  });
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-session-player:123456"),
    ),
  ).toBe("recovered-token");
  expect(await page.evaluate(() => window.history.state.usr)).toEqual({
    welcomeBack: true,
  });
  backend.verify();
});

test("players can select an international calling code", async ({ page }) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?code=123456");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Your name?").fill("Pat");
  const phone = page.getByLabel("Your phone number?");
  await expect(page.getByRole("button", { name: "Join game" })).toBeEnabled();
  const country = page.getByLabel("Country calling code");
  await tabTo(page, country);
  await country.selectOption("44");
  await phone.fill("07123 456789");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(page.getByLabel("Your recovery code")).toBeVisible();
  expect(
    backend.requests.find((r) => r.name === "player-identity")?.body,
  ).toMatchObject({
    action: "register",
    mobile: "+447123456789",
  });
  backend.verify();
});

test("players can join as a new player without a phone number", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?code=123456");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Your name?").fill("Pat");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  await expect(page.getByLabel("Your recovery code")).toBeVisible();
  expect(
    backend.requests.find((r) => r.name === "player-identity")?.body,
  ).toMatchObject({ action: "register", mobile: "" });
  await page.getByRole("button", { name: "Continue without saving" }).click();
  await expect(page).toHaveURL(/#\/play\/123456/);
  backend.verify();
});

test("an interrupted registration can resume with the same encrypted pending credential", async ({
  page,
}) => {
  await installSessionBackend(page, { savedPlayer: false });
  let firstCredential = "";
  let attempts = 0;
  await page.route("**/functions/v1/player-identity", async (route) => {
    const body = route.request().postDataJSON();
    attempts += 1;
    if (attempts === 1) {
      firstCredential = body.credential;
      await route.abort("connectionreset");
      return;
    }
    expect(body.credential).toBe(firstCredential);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        join_code: "123456",
        player_token: "resumed-token",
        player_name: "Pat",
        resumed: false,
      }),
    });
  });
  async function submit() {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Your name?").fill("Pat");
    await page.getByLabel("Your phone number?").fill("07123456789");
    await page.getByRole("button", { name: "Join game", exact: true }).click();
  }
  await page.goto("#/join?code=123456");
  await submit();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(firstCredential).toMatch(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("chaos-crawl-session-player:123456"),
    ),
  ).toBeNull();
  await page.reload();
  await submit();
  await expect(page.getByLabel("Your recovery code")).toHaveValue(
    firstCredential,
  );
  await page.getByRole("button", { name: "Continue without saving" }).click();
  await expect(page).toHaveURL(/#\/play\/123456/);
  expect(attempts).toBe(2);
});

test("recovery setup supports keyboard copy, download and continuation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("#/join?code=123456");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Your name?").fill("Pat");
  await page.getByLabel("Your phone number?").fill("07123456789");
  await page.getByRole("button", { name: "Join game", exact: true }).click();
  const credential = await page.getByLabel("Your recovery code").inputValue();
  const copy = page.getByRole("button", { name: "Copy code" });
  await tabTo(page, copy);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Code copied.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    credential,
  );
  await tabTo(page, page.getByRole("button", { name: "Save code" }));
  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await downloadPromise;
  expect(await readFile(await download.path(), "utf8")).toBe(credential);
  await tabTo(
    page,
    page.getByRole("button", { name: "Continue without saving" }),
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/play\/123456/);
  backend.verify();
});
