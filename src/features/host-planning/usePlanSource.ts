import type { User } from "@supabase/supabase-js";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { failedResult, runApi } from "../../lib/apiResult";
import { readHostIdentity } from "../../lib/hostAuth";
import { readHostPlan, readApprovedPlanTask } from "../../lib/hostPlanApi";
import { hydratePlan } from "./planModel";
import {
  attachPlanTask,
  communityPlanTask,
  explorePlanTask,
} from "./planImports";
import type { SetupForm, TaskKind } from "./types";
export function usePlanSource({
  id,
  communityTaskId,
  exploreTaskJson,
  requestedChallengeKind,
  setForm,
  setStage,
  loadFavourites,
  setError,
  setNotice,
}: {
  id?: string;
  communityTaskId: string | null;
  exploreTaskJson: string | null;
  requestedChallengeKind: TaskKind;
  setForm: Dispatch<SetStateAction<SetupForm>>;
  setStage: Dispatch<SetStateAction<"create" | "build">>;
  loadFavourites: (hostId: string) => Promise<void>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(
    Boolean(id || communityTaskId || exploreTaskJson),
  );
  useEffect(() => {
    let live = true;
    async function load() {
      setError("");
      setLoading(Boolean(id || communityTaskId || exploreTaskJson));
      const { data: auth, error: authError } = await runApi<{
        user: User | null;
      }>(readHostIdentity);
      if (!live) return;
      if (authError || !auth?.user) {
        setError("Your host session has expired. Please log in again.");
        setLoading(false);
        return;
      }
      const userId = auth.user.id;
      await loadFavourites(userId);
      if (!live) return;
      if (id) {
        const { data, error: loadError } = await readHostPlan(id, userId).catch(
          failedResult,
        );
        if (!live) return;
        if (loadError || !data) setError("Couldn't load this game plan.");
        else {
          setForm(hydratePlan(data));
          setStage("build");
        }
      } else if (communityTaskId) {
        const { data: submission, error: communityError } =
          await readApprovedPlanTask(communityTaskId).catch(failedResult);
        if (!live) return;
        if (communityError || !submission)
          setError(
            "That community challenge is no longer available. Return to Explore and choose another one.",
          );
        else {
          const task = communityPlanTask(submission, requestedChallengeKind);
          setForm((current) => attachPlanTask(current, task));
          setNotice(
            `Added “${task.title}” as a ${task.kind} challenge. Finish the game details, then find it in ${task.kind === "main" ? "Main Challenges" : "Side challenges"}.`,
          );
        }
      } else if (exploreTaskJson) {
        try {
          const task = explorePlanTask(exploreTaskJson, requestedChallengeKind);
          setForm((current) => attachPlanTask(current, task));
          setNotice(
            `Added “${task.title}” as a ${task.kind} challenge. Finish the game details, then find it in ${task.kind === "main" ? "Main Challenges" : "Side challenges"}.`,
          );
        } catch {
          setError(
            "Couldn't add that Explore challenge. Return to Explore and try again.",
          );
        }
      }
      if (live) setLoading(false);
    }
    void load();
    return () => {
      live = false;
    };
  }, [
    attempt,
    id,
    communityTaskId,
    exploreTaskJson,
    requestedChallengeKind,
    setForm,
    setStage,
    loadFavourites,
    setError,
    setNotice,
  ]);
  return { loading, reload: () => setAttempt((value) => value + 1) };
}
