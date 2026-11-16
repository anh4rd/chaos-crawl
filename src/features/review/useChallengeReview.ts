import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { apiError, runApi } from "../../lib/apiResult";
import type {
  ChallengeCompletion,
  ChallengeType,
  Media,
} from "../../types/database";

interface ReviewData {
  completions: ChallengeCompletion[];
  media: Media[];
}
const emptyReview: ReviewData = { completions: [], media: [] };

async function loadReview(
  type: ChallengeType,
  id: string,
  signal: AbortSignal,
): Promise<ReviewData> {
  const completions = await runApi<ChallengeCompletion[]>(() =>
    supabase
      .from("challenge_completions")
      .select("*")
      .eq("challenge_type", type)
      .eq("challenge_id", id)
      .order("completed_at", { ascending: true })
      .abortSignal(signal),
  );
  if (signal.aborted)
    throw new DOMException("Review request cancelled", "AbortError");
  if (completions.error) throw completions.error;
  const rows = completions.data ?? [];
  const ids = [
    ...new Set(
      rows
        .map((row) => row.photo_id)
        .filter((id): id is string | number => id !== null),
    ),
  ];
  if (!ids.length) return { completions: rows, media: [] };
  const media = await runApi<Media[]>(() =>
    supabase.from("photos").select("*").in("id", ids).abortSignal(signal),
  );
  if (media.error) throw media.error;
  return { completions: rows, media: media.data ?? [] };
}

/** A review snapshot belongs to one challenge; changed routes never expose the
 * previous challenge's rows while their new request is still loading.
 */
export function useChallengeReview(type: ChallengeType, id: string) {
  const key = JSON.stringify([type, id]);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const [snapshot, setSnapshot] = useState({
    key: "",
    ...emptyReview,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setSnapshot({ key, ...emptyReview, loading: true, error: null });
    async function load() {
      try {
        const data = await loadReview(type, id, controller.signal);
        if (!controller.signal.aborted)
          setSnapshot({ key, ...data, loading: false, error: null });
      } catch (cause) {
        if (!controller.signal.aborted)
          setSnapshot({
            key,
            ...emptyReview,
            loading: false,
            error: apiError(cause).message,
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [type, id, key, attempt]);

  const current =
    snapshot.key === key
      ? snapshot
      : { ...emptyReview, loading: true, error: null };
  return { ...current, reload };
}
