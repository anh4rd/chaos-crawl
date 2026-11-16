import { supabase } from "./supabase";
import { invalidResult, runApi, type ApiResult } from "./apiResult";
import type { ScoreChallengeType, ScoreEvent } from "../types/database";
export type { ScoreChallengeType, ScoreEvent } from "../types/database";

export interface AwardScoreArgs {
  playerId?: string | null;
  teamName?: string | null;
  challengeType: ScoreChallengeType;
  challengeId: string | number;
  challengeTitle: string;
  points: number;
  reason?: string | null;
}

export function awardScore({
  playerId = null,
  teamName = null,
  challengeType,
  challengeId,
  challengeTitle,
  points,
  reason = null,
}: AwardScoreArgs): Promise<ApiResult<ScoreEvent>> {
  if (Boolean(playerId?.trim()) === Boolean(teamName?.trim())) {
    return Promise.resolve(
      invalidResult("Exactly one player or team is required."),
    );
  }
  if (
    !Number.isFinite(points) ||
    points === 0 ||
    !String(challengeId).trim() ||
    !challengeTitle.trim() ||
    !["main", "side", "bonus", "vote", "manual"].includes(challengeType)
  ) {
    return Promise.resolve(
      invalidResult(
        "A valid challenge and finite, nonzero points are required.",
      ),
    );
  }
  return runApi<ScoreEvent>(() =>
    supabase
      .from("score_events")
      .insert({
        player_id: playerId,
        team_name: teamName,
        challenge_type: challengeType,
        challenge_id: String(challengeId),
        challenge_title: challengeTitle,
        points,
        reason,
      })
      .select()
      .single(),
  );
}

export function getScoreEvents(): Promise<ApiResult<ScoreEvent[]>> {
  return runApi<ScoreEvent[]>(() =>
    supabase
      .from("score_events")
      .select("*")
      .order("awarded_at", { ascending: false }),
  );
}

export function getScoreEventsForChallenge(
  challengeType: ScoreChallengeType,
  challengeId: string | number,
): Promise<ApiResult<ScoreEvent[]>> {
  return runApi<ScoreEvent[]>(() =>
    supabase
      .from("score_events")
      .select("*")
      .eq("challenge_type", challengeType)
      .eq("challenge_id", String(challengeId))
      .order("awarded_at", { ascending: false }),
  );
}

export function removeScoreEvent(
  scoreEventId: string,
): Promise<ApiResult<null>> {
  if (!scoreEventId.trim())
    return Promise.resolve(invalidResult("A score event is required."));
  return runApi<null>(() =>
    supabase.from("score_events").delete().eq("id", scoreEventId),
  );
}
