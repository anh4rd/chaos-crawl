import { supabase } from "./supabase";
import { runApi, type ApiResult } from "./apiResult";
import type { LegacyHostTeam } from "../types/legacyHost";

export async function readLegacyHostTeams(): Promise<
  ApiResult<LegacyHostTeam[]>
> {
  return runApi<LegacyHostTeam[]>(() =>
    supabase.from("teams").select("id, name").order("name"),
  );
}

export function subscribeLegacyHostTeams(onChange: () => void) {
  const channel = supabase
    .channel("host-v2-teams")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "teams" },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
