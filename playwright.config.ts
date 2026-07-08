import {
  defineConfig,
  devices,
} from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: false,

  retries: 0,

  workers: 1,

  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
      },
    ],
  ],

  use: {
    baseURL:
      "http://127.0.0.1:5173/chaos-crawl",

    trace:
      "retain-on-failure",

    screenshot:
      "only-on-failure",

    video:
      "retain-on-failure",
  },

  projects: [
    {
      name: "desktop-chromium",

      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "mobile-chrome",

      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  webServer: {
    command:
      "npm run dev -- --host 127.0.0.1",

    url:
      "http://127.0.0.1:5173/chaos-crawl/",

    reuseExistingServer: true,

    timeout: 120_000,
  },
});