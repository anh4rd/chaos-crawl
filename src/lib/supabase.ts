import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

let client: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to the game.",
      );
    }
    client = createClient<Database>(url, key);
  }
  return client;
}

// Preserve the existing SDK-shaped API while deferring environment validation
// and client creation until the first operation, rather than module import.
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    const instance = getSupabase();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
