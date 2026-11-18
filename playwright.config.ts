import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PLAYWRIGHT_PORT must be a valid port number.");
const baseURL = `http://127.0.0.1:${port}/chaos-crawl/`;

export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "**/smoke.spec.ts",
    "**/session.spec.ts",
    "**/hostHub.spec.ts",
    "**/planning.spec.ts",
    "**/lobby.spec.ts",
    "**/tour.spec.ts",
    "**/hostDialogs.spec.ts",
    "**/reviewControls.spec.ts",
    "**/votingPrivacy.spec.ts",
    "**/rewardControls.spec.ts",
    "**/rewardModal.spec.ts",
    "**/hostRoundControls.spec.ts",
    "**/participantTeams.spec.ts",
    "**/privateMissions.spec.ts",
    "**/join.spec.ts",
    "**/playerDemo.spec.ts",
    "**/hostSaved.spec.ts",
    "**/hostExplore.spec.ts",
    "**/hostExploreConcurrency.spec.ts",
    "**/hostExploreReads.spec.ts",
    "**/hostIdentity.spec.ts",
    "**/legacyHostChallenges.spec.ts",
    "**/legacyHostScores.spec.ts",
    "**/legacyPages.spec.ts",
    "**/legacyVotingPrivacy.spec.ts",
    "**/legacyPlayerWorkspace.spec.ts",
    "**/superAdmin.spec.ts",
    "**/sessionSlideshow.spec.ts",
  ],

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

    url: baseURL,

    reuseExistingServer: false,

    timeout: 120_000,
  },
});
