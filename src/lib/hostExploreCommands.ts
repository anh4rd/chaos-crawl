import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  CommunityChallengePayload,
  HostFavourite,
} from "../types/hostExplore";

interface ChallengeInput {
  title: string;
  description: string;
  payload: CommunityChallengePayload;
}

export function saveExploreFavourite({
  hostId,
  itemType,
  itemId,
  itemData,
}: {
  hostId: string;
  itemType: HostFavourite["item_type"];
  itemId: string;
  itemData: Record<string, unknown>;
}): Promise<ApiResult<HostFavourite>> {
  return runApi<HostFavourite>(() =>
    supabase
      .from("host_favourites")
      .insert({
        host_id: hostId,
        item_type: itemType,
        item_id: itemId,
        item_data: itemData,
      })
      .select("id,item_type,item_id,item_data")
      .single(),
  );
}

export function createCommunityChallenge({
  title,
  description,
  payload,
  submittedBy,
}: ChallengeInput & { submittedBy: string }): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase.from("cc_catalog_submissions").insert({
      item_type: "challenge",
      title,
      description,
      payload,
      status: "pending",
      submitted_by: submittedBy,
    }),
  );
}

export function updateApprovedCommunityChallenge({
  id,
  title,
  description,
  payload,
}: ChallengeInput & { id: string }): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_catalog_submissions")
      .update({ title, description, payload })
      .eq("id", id)
      .eq("status", "approved"),
  );
}

export function deleteApprovedCommunityChallenge({
  id,
}: {
  id: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_catalog_submissions")
      .delete()
      .eq("id", id)
      .eq("status", "approved"),
  );
}

export function reviewPendingCommunitySubmission({
  id,
  status,
  reviewedBy,
  reviewedAt,
}: {
  id: string;
  status: "approved" | "rejected";
  reviewedBy: string;
  reviewedAt: string;
}): Promise<ApiResult<unknown>> {
  return runApi<unknown>(() =>
    supabase
      .from("cc_catalog_submissions")
      .update({ status, reviewed_by: reviewedBy, reviewed_at: reviewedAt })
      .eq("id", id)
      .eq("status", "pending"),
  );
}
