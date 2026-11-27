import { expect, test } from "@playwright/test";

test("iOS installation guidance can be dismissed by keyboard", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", { value: "iPhone" });
  });
  await page.goto("./#/join");
  const prompt = page.getByRole("region", { name: "Install Chaos Crawl" });
  await expect(prompt).toContainText("Add to Home Screen");
  const dismiss = prompt.getByRole("button", { name: "Not now" });
  await dismiss.focus();
  await page.keyboard.press("Enter");
  await expect(prompt).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Join the chaos" }),
  ).toBeVisible();
});

test("browser installation and notification permission are separate keyboard actions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "Notification", {
      value: {
        permission: "default",
        requestPermission: () => {
          document.documentElement.dataset.notificationRequested = "yes";
          return Promise.resolve("granted");
        },
      },
    });
  });
  await page.goto("./#/join");
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperty(event, "prompt", {
      value: () => {
        document.documentElement.dataset.installRequested = "yes";
        return Promise.resolve();
      },
    });
    window.dispatchEvent(event);
  });
  const install = page.getByRole("button", { name: "Install app" });
  await install.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-install-requested",
    "yes",
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-notification-requested",
    "yes",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  const allow = page.getByRole("button", { name: "Allow notifications" });
  await allow.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-notification-requested",
    "yes",
  );
});
