import { supabase } from "./supabase";

export type ScoreChallengeType =
  | "main"
  | "side"
  | "bonus"
  | "vote"
  | "manual";

export interface ScoreEvent {
  id: string;

  player_id: string | null;
  team_name: string | null;

  challenge_type: ScoreChallengeType;
  challenge_id: string;
  challenge_title: string;

  points: number;
  reason: string | null;

  awarded_at: string;
}

interface AwardScoreArgs {
  playerId?: string | null;
  teamName?: string | null;

  challengeType: ScoreChallengeType;
  challengeId: string | number;
  challengeTitle: string;

  points: number;
  reason?: string | null;
}

export async function awardScore({
  playerId = null,
  teamName = null,
  challengeType,
  challengeId,
  challengeTitle,
  points,
  reason = null,
}: AwardScoreArgs) {
  if (!playerId && !teamName) {
    return {
      data: null,
      error: new Error(
        "A player or team is required."
      ),
    };
  }

  return supabase
    .from("score_events")
    .insert({
      player_id: playerId,
      team_name: teamName,

      challenge_type:
        challengeType,

      challenge_id:
        String(challengeId),

      challenge_title:
        challengeTitle,

      points,

      reason,
    })
    .select()
    .single();
}

export async function getScoreEvents() {
  return supabase
    .from("score_events")
    .select("*")
    .order("awarded_at", {
      ascending: false,
    });
}

export async function getScoreEventsForChallenge(
  challengeType: ScoreChallengeType,
  challengeId: string | number
) {
  return supabase
    .from("score_events")
    .select("*")
    .eq(
      "challenge_type",
      challengeType
    )
    .eq(
      "challenge_id",
      String(challengeId)
    )
    .order("awarded_at", {
      ascending: false,
    });
}

export async function removeScoreEvent(
  scoreEventId: string
) {
  return supabase
    .from("score_events")
    .delete()
    .eq("id", scoreEventId);
}