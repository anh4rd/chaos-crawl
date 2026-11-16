import { supabase } from "./supabase";
import { runApi, invalidResult, type ApiResult } from "./apiResult";

import type { GameState, Challenge, Pub } from "../types/database";

export function getGameState(): Promise<ApiResult<GameState>> {
  return runApi<GameState>(() =>
    supabase.from("game_state").select("*").eq("id", 1).single(),
  );
}

export function updateGameState(values: {
  current_pub?: string;
  current_challenge?: string;
  current_challenge_id?: number | null;
  current_challenge_order?: number;
  challenge_description?: string;
  voting_open?: boolean;
  voting_target?: "player" | "team";
  show_vote_results?: boolean;
  slideshow_open?: boolean;
  scheduled_challenge_id?: number | null;
  scheduled_reveal_at?: string | null;
  join_open?: boolean;
  game_status?: "lobby" | "live" | "finished";
}): Promise<ApiResult<null>> {
  return runApi<null>(() =>
    supabase
      .from("game_state")
      .update({
        ...("current_pub" in values || "current_challenge_id" in values
          ? { scheduled_challenge_id: null, scheduled_reveal_at: null }
          : {}),
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1),
  );
}

/** Reveal only the schedule observed by the caller. A cancelled/replaced
 * schedule, or one already revealed by another client, produces no updated row.
 */
export async function revealScheduledChallenge(
  challengeId: number,
  scheduledAt: string,
  signal: AbortSignal = new AbortController().signal,
): Promise<ApiResult<GameState>> {
  const deadline = Date.parse(scheduledAt);
  if (!Number.isFinite(challengeId) || !Number.isFinite(deadline)) {
    return invalidResult("The scheduled challenge or reveal time is invalid.");
  }
  if (deadline > Date.now())
    return invalidResult("The scheduled reveal is not due yet.");
  if (signal.aborted) return { data: null, error: null };
  const challenge = await runApi<Challenge>(() =>
    supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .abortSignal(signal)
      .single(),
  );
  if (signal.aborted) return { data: null, error: null };
  if (challenge.error) return { data: null, error: challenge.error };
  if (!challenge.data)
    return invalidResult("The scheduled challenge no longer exists.");
  const row = challenge.data;
  let pubName: string | undefined;
  const pubId = row.pub_id;
  if (pubId !== null) {
    const pub = await runApi<Pub>(() =>
      supabase
        .from("pubs")
        .select("*")
        .eq("id", pubId)
        .abortSignal(signal)
        .maybeSingle(),
    );
    if (signal.aborted) return { data: null, error: null };
    if (pub.error) return { data: null, error: pub.error };
    pubName = pub.data?.name;
  }
  return runApi<GameState>(() =>
    supabase
      .from("game_state")
      .update({
        ...(pubName ? { current_pub: pubName } : {}),
        current_challenge_id: row.id,
        current_challenge: row.title,
        challenge_description: row.description ?? "",
        current_challenge_order: row.reveal_order,
        scheduled_challenge_id: null,
        scheduled_reveal_at: null,
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .eq("scheduled_challenge_id", challengeId)
      .eq("scheduled_reveal_at", scheduledAt)
      .select("*")
      .abortSignal(signal)
      .maybeSingle(),
  );
}
