import { supabase } from "./sessionSupabase";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import type { JoinResult } from "../types/playerAccess";

export async function readCachedPlayer(joinCode: string, playerToken: string) {
  const { data, error } = await supabase.rpc("cc_get_game_session_view", {
    p_join_code: joinCode,
    p_player_token: playerToken,
  });
  if (error) return { data: null, error };
  const value: unknown = data;
  if (
    !value ||
    typeof value !== "object" ||
    !("player" in value) ||
    !value.player ||
    typeof value.player !== "object" ||
    !("name" in value.player) ||
    typeof value.player.name !== "string"
  )
    throw new Error("The game returned an invalid player session.");
  return {
    data: {
      join_code: joinCode,
      player_token: playerToken,
      player_name: value.player.name,
      resumed: true,
    },
    error: null,
  };
}

export function playerAccessErrorMessage(error: unknown, joining: boolean) {
  if (
    error instanceof FunctionsFetchError ||
    error instanceof FunctionsRelayError
  )
    return "Couldn't connect to player access. Check your connection and try again.";
  if (
    error instanceof FunctionsHttpError &&
    error.context instanceof Response
  ) {
    if (error.context.status === 429)
      return "Too many attempts. Please wait a moment and try again.";
    if (error.context.status === 404 || error.context.status >= 500)
      return "Player access is temporarily unavailable. Please try again or ask the host for help.";
    if (error.context.status === 400 && joining)
      return "Couldn't complete player access. Check your details and try again. You can leave the phone number blank to join as a new player.";
  }
  return "Couldn't complete player access. Check your details and try again.";
}

export function joinGameSession(parameters: {
  action: "register" | "recover";
  join_code: string;
  credential: string;
  name?: string;
  mobile?: string;
}): PromiseLike<{ data: JoinResult | null; error: unknown }> {
  return supabase.functions.invoke("player-identity", { body: parameters });
}
