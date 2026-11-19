import { supabase } from "./sessionSupabase";

export function sessionEvidenceUrl(path: string): string {
  return supabase.storage.from("session-evidence").getPublicUrl(path).data
    .publicUrl;
}

export function gameAssetUrl(path: string): string {
  return supabase.storage.from("game-assets").getPublicUrl(path).data.publicUrl;
}
