import { supabase } from "./supabase";
import { invalidResult, runApi, type ApiResult } from "./apiResult";
import type { Player, ScoreEvent } from "../types/database";
import { awardScore } from "./scoreApi";

export function createPlayer(
  name: string,
  team: string | null = null,
): Promise<ApiResult<Player>> {
  if (!name.trim())
    return Promise.resolve(invalidResult("A name is required."));
  return runApi<Player>(() =>
    supabase
      .from("players")
      .insert({ name: name.trim(), team: team?.trim() || null, score: 0 })
      .select()
      .single(),
  );
}

export function addPoints(
  playerId: string,
  points: number,
): Promise<ApiResult<ScoreEvent>> {
  if (!playerId.trim() || !Number.isFinite(points) || points <= 0) {
    return Promise.resolve(
      invalidResult("A player and positive finite points are required."),
    );
  }
  return awardScore({
    playerId,
    challengeType: "manual",
    challengeId: crypto.randomUUID(),
    challengeTitle: "Manual adjustment",
    points,
    reason: "Points added by host",
  });
}

export function renamePlayer(
  id: string,
  name: string,
): Promise<ApiResult<null>> {
  if (!id.trim() || !name.trim())
    return Promise.resolve(invalidResult("A player and name are required."));
  return runApi<null>(() =>
    supabase.from("players").update({ name: name.trim() }).eq("id", id),
  );
}

export function deletePlayer(id: string): Promise<ApiResult<null>> {
  if (!id.trim())
    return Promise.resolve(invalidResult("A player is required."));
  return runApi<null>(() => supabase.from("players").delete().eq("id", id));
}

export function changeTeam(id: string, team: string): Promise<ApiResult<null>> {
  if (!id.trim())
    return Promise.resolve(invalidResult("A player is required."));
  return runApi<null>(() =>
    supabase
      .from("players")
      .update({ team: team.trim() || null })
      .eq("id", id),
  );
}

export async function removePoints(
  id: string,
  amount: number,
): Promise<ApiResult<ScoreEvent>> {
  if (!id.trim() || !Number.isFinite(amount) || amount <= 0) {
    return invalidResult("A player and positive finite points are required.");
  }
  const result = await runApi<Pick<ScoreEvent, "points">[]>(() =>
    supabase.from("score_events").select("points").eq("player_id", id),
  );
  if (result.error) return { data: null, error: result.error };
  const score = (result.data ?? []).reduce(
    (sum, event) => sum + event.points,
    0,
  );
  const deduction = Math.min(amount, Math.max(0, score));
  if (deduction === 0) return { data: null, error: null };
  // Appends never lose another adjustment. This snapshot cap cannot enforce a
  // zero floor against simultaneous deductions without a database transaction.
  return awardScore({
    playerId: id,
    challengeType: "manual",
    challengeId: crypto.randomUUID(),
    challengeTitle: "Manual adjustment",
    points: -deduction,
    reason: "Points removed by host",
  });
}
