import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PLAYWRIGHT_PORT must be a valid port number.");
const baseURL = `http://127.0.0.1:${port}/chaos-crawl/`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/live/**", "**/vercel-build.spec.ts"],

  fullyParallel: false,

  // Full styleguide keyboard journeys traverse hundreds of native controls.
  timeout: 60_000,

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
    baseURL,

    trace: "retain-on-failure",

    screenshot: "only-on-failure",

    video: "retain-on-failure",
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
    env: {
      VITE_SENTRY_DSN: "",
      VITE_SUPABASE_URL: "https://chaos-crawl-test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,

    wait: { stdout: /Local:/ },

    reuseExistingServer: false,

    timeout: 120_000,
  },
});
