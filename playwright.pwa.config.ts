import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5191);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PLAYWRIGHT_PORT must be a valid port number.");

export default defineConfig({
  testDir: "./tests",
  testMatch: "pwa-production.spec.ts",
  use: { baseURL: `http://127.0.0.1:${port}/chaos-crawl/` },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    env: {
      VITE_SENTRY_DSN: "",
      SENTRY_AUTH_TOKEN: "",
      VITE_SUPABASE_URL: "https://chaos-crawl-test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    url: `http://127.0.0.1:${port}/chaos-crawl/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
