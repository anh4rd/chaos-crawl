import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedSupabase } from "./supabase";

// V2's session and host schema is not covered by the legacy Database model.
// Share the lazy client and auth session while retaining the SDK's dynamic
// schema API at this boundary until deployed V2 types can be generated.
export const supabase = typedSupabase as unknown as SupabaseClient;
