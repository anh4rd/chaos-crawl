import { randomUUID } from "node:crypto";
import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_ANON_KEY;
if (!url || !key) {
  throw new Error(
    "Live journeys require SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY for a disposable test backend. The default browser suite uses mocks.",
  );
}
process.env.PLAYWRIGHT_LIVE_RUN_ID ??= randomUUID();
const server = base.webServer;
if (!server || Array.isArray(server)) {
  throw new Error(
    "Live journeys require the configured single Vite test server.",
  );
}

export default defineConfig({
  ...base,
  testMatch: "**/live/*.spec.ts",
  workers: 1,
  webServer: {
    ...server,
    // Start a dedicated server with the explicit test connection, rather than
    // reusing a developer's server that could point at an actual event.
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key,
      VITE_SENTRY_DSN: "",
    },
  },
});
