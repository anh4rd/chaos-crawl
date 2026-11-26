import { expect, test } from "@playwright/test";
import { tabTo } from "./support/keyboard";
import { installSessionBackend } from "./support/sessionBackend";

test("host account tabs use one keyboard stop, arrow navigation and named native-form panels", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  const authWrites: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/auth\/v1\/(token|signup)/.test(request.url())
    )
      authWrites.push(request.url());
  });
  await page.goto("#/host/login");
  const login = page.getByRole("tab", { name: "Log in", exact: true });
  const signup = page.getByRole("tab", { name: "Create account", exact: true });
  await tabTo(page, login);
  await page.keyboard.press("ArrowRight");
  await expect(signup).toBeFocused();
  await expect(signup).toHaveAttribute("aria-selected", "true");
  await expect(signup).toHaveJSProperty("tabIndex", 0);
  await expect(login).toHaveJSProperty("tabIndex", -1);
  const panel = page.getByRole("tabpanel", {
    name: "Create account",
    exact: true,
  });
  const panelId = await panel.getAttribute("id");
  expect(panelId).toBeTruthy();
  await expect(signup).toHaveAttribute("aria-controls", panelId ?? "");
  await expect(panel.locator("form")).toHaveCount(1);
  await page.keyboard.press("Tab");
  const name = panel.getByRole("textbox", { name: "Your name", exact: true });
  await expect(name).toBeFocused();
  await page.keyboard.type("Alex");
  await page.keyboard.press("Shift+Tab");
  await expect(signup).toBeFocused();
  await page.keyboard.press("Home");
  await expect(login).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Email address", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(login).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(signup).toBeFocused();
  await expect(name).toHaveValue("Alex");
  await page.keyboard.press("Home");
  await page.keyboard.press("End");
  await expect(signup).toBeFocused();
  expect(authWrites).toEqual([]);
  backend.verify();
});

test("keyboard-selected account mode preserves native signup fields and the existing command payload", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  const writes: unknown[] = [];
  const redirects: (string | null)[] = [];
  await page.route("**/auth/v1/signup**", async (route) => {
    writes.push(route.request().postDataJSON());
    redirects.push(
      new URL(route.request().url()).searchParams.get("redirect_to"),
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        email: "host@example.test",
        identities: [],
        created_at: "2030-01-01T12:00:00Z",
      }),
    });
  });
  await page.goto("#/host/login");
  await tabTo(page, page.getByRole("tab", { name: "Log in", exact: true }));
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Create account", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Your name", exact: true }),
  ).toBeFocused();
  await page.keyboard.type("  Alex Chaos  ");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Email address", exact: true }),
  ).toBeFocused();
  await page.keyboard.type("host@example.test");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: false })).toBeFocused();
  await page.keyboard.type("secret-pass");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Create host account", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Check your email");
  expect(writes).toHaveLength(1);
  expect(redirects).toEqual([
    new URL("/chaos-crawl/?host_confirmation=1", page.url()).href,
  ]);
  expect(writes[0]).toMatchObject({
    email: "host@example.test",
    password: "secret-pass",
    data: { display_name: "Alex Chaos" },
  });

  await expect(page).toHaveURL(/\/host\/login$/);
  backend.verify();
});

test("email confirmation consumes the auth fragment before opening the host hub", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  await page.goto(
    `?host_confirmation=1#access_token=confirmation-token&refresh_token=confirmation-refresh&token_type=bearer&expires_in=3600&expires_at=${expiresAt}&type=signup`,
  );
  await expect(page).toHaveURL(/\/chaos-crawl\/#\/host$/);
  await expect(
    page.getByRole("heading", { name: "Your Host Hub" }),
  ).toBeVisible();
  backend.verify();
});

test("expired confirmation shows feedback and a working login link", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto(
    "?host_confirmation=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
  );
  await expect(page.getByRole("alert")).toHaveText(
    "Email link is invalid or has expired",
  );
  expect(new URL(page.url()).hash).toBe("");
  await page.getByRole("link", { name: "Go to host login" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page).toHaveURL(/#\/host\/login$/);
  backend.verify();
});

test("a confirmation callback without a session offers login instead of reporting success", async ({
  page,
}) => {
  const backend = await installSessionBackend(page, { savedPlayer: false });
  await page.goto("?host_confirmation=1");
  await expect(page.getByRole("alert")).toContainText(
    "No sign-in session was returned",
  );
  await expect(
    page.getByRole("link", { name: "Go to host login" }),
  ).toBeVisible();
  backend.verify();
});

test("local host account tabs submit only local state and preserve keyboard access", async ({
  page,
}) => {
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("supabase.co"))
      backendRequests.push(request.url());
  });
  await page.goto("#/styleguide");
  const reference = page.getByRole("region", {
    name: "Local host account",
    exact: true,
  });
  const login = reference.getByRole("tab", { name: "Log in", exact: true });
  const signup = reference.getByRole("tab", {
    name: "Create account",
    exact: true,
  });
  await tabTo(page, login);
  await page.keyboard.press("ArrowRight");
  await expect(signup).toBeFocused();
  const panel = reference.getByRole("tabpanel", {
    name: "Create account",
    exact: true,
  });
  await page.keyboard.press("Tab");
  await expect(
    panel.getByRole("textbox", { name: "Your name", exact: true }),
  ).toBeFocused();
  await page.keyboard.type("Local Host");
  await page.keyboard.press("Tab");
  await page.keyboard.type("local@example.test");
  await page.keyboard.press("Tab");
  await page.keyboard.type("local-password");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("status")).toHaveText(
    "Account action completed locally. No account was created.",
  );
  await expect(page).toHaveURL(/#\/styleguide$/);
  expect(backendRequests).toEqual([]);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({});
});
