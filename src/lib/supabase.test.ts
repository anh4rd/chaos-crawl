import { afterEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: sdk.createClient }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("imports without credentials and reports configuration only when used", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  const { getSupabase } = await import("./supabase");
  expect(sdk.createClient).not.toHaveBeenCalled();
  expect(() => getSupabase()).toThrow("VITE_SUPABASE_URL");
});

it("creates one client on first use and retains compatibility method binding", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-key");
  const { getSupabase, supabase } = await import("./supabase");
  expect(sdk.createClient).not.toHaveBeenCalled();
  supabase.from("players");
  expect(sdk.createClient).toHaveBeenCalledOnce();
  expect(getSupabase()).toBe(getSupabase());
});
