import { createClient } from "@supabase/supabase-js";
import { test as base, expect } from "@playwright/test";
import type { Database } from "../../src/types/database";
import { withLiveBackend } from "./liveBackend";

export const test = base.extend<{ liveBackend: void }>({
  liveBackend: [
    async ({}, use) => {
      const url = process.env.SUPABASE_TEST_URL;
      const key = process.env.SUPABASE_TEST_ANON_KEY;
      const runId = process.env.PLAYWRIGHT_LIVE_RUN_ID;
      if (!url || !key || !runId)
        throw new Error(
          "Select the live configuration with explicit disposable-backend credentials.",
        );
      const client = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await withLiveBackend(client, runId, () => use());
    },
    { auto: true },
  ],
});
export { expect };
