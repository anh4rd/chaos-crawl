import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";
import type {
  FinalSlideshowView,
  SecretSlideshowView,
} from "../types/sessionSlideshow";

export function readFinalSlideshow(
  sessionId: string,
): Promise<ApiResult<FinalSlideshowView>> {
  return runApi<FinalSlideshowView>(() =>
    supabase.rpc("cc_get_session_final_slideshow", { p_session_id: sessionId }),
  );
}

export function readSecretSlideshow(
  sessionId: string,
): Promise<ApiResult<SecretSlideshowView>> {
  return runApi<SecretSlideshowView>(() =>
    supabase.rpc("cc_get_session_secret_review_slideshow", {
      p_session_id: sessionId,
    }),
  );
}
