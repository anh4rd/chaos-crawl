import { runApi } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  StoredPlan,
  CommunityPlanTask,
  Favourite,
  Task,
  PlanWrite,
} from "../types/hostPlanning";
export function readPlanFavourites(hostId: string) {
  return runApi<Favourite[]>(() =>
    supabase
      .from("host_favourites")
      .select("id,item_type,item_id")
      .eq("host_id", hostId),
  );
}
export function readHostPlan(id: string, hostId: string) {
  return runApi<StoredPlan>(() =>
    supabase
      .from("host_games")
      .select("*")
      .eq("id", id)
      .eq("host_id", hostId)
      .maybeSingle(),
  );
}
export function readApprovedPlanTask(id: string) {
  return runApi<CommunityPlanTask>(() =>
    supabase
      .from("cc_catalog_submissions")
      .select("id,title,description,payload,status")
      .eq("id", id)
      .eq("item_type", "challenge")
      .eq("status", "approved")
      .maybeSingle(),
  );
}
export function removePlanFavourite(id: string) {
  return runApi<unknown>(() =>
    supabase.from("host_favourites").delete().eq("id", id),
  );
}
export function addPlanFavourite(hostId: string, task: Task) {
  return runApi<Favourite>(() =>
    supabase
      .from("host_favourites")
      .insert({
        host_id: hostId,
        item_type: "task",
        item_id: task.id,
        item_data: task,
      })
      .select("id,item_type,item_id")
      .single(),
  );
}
export function createHostPlan(payload: PlanWrite) {
  return runApi<{ id: string | number }>(() =>
    supabase.from("host_games").insert(payload).select("id").single(),
  );
}
export function updateHostPlan({
  hostGameId,
  hostId,
  values,
}: {
  hostGameId: string;
  hostId: string;
  values: Omit<PlanWrite, "host_id">;
}) {
  return runApi<unknown>(() =>
    supabase
      .from("host_games")
      .update(values)
      .eq("id", hostGameId)
      .eq("host_id", hostId),
  );
}
export function uploadPlanCover(path: string, file: File) {
  return runApi<unknown>(() =>
    supabase.storage
      .from("game-assets")
      .upload(path, file, { upsert: true, contentType: file.type }),
  );
}
export function planCoverUrl(path: string) {
  return supabase.storage.from("game-assets").getPublicUrl(path).data.publicUrl;
}
