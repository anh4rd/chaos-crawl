import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import {
  readPlanFavourites,
  readHostPlan,
  readApprovedPlanTask,
} from "../../lib/hostPlanApi";
import { hydratePlan } from "./planModel";
import {
  attachPlanTask,
  communityPlanTask,
  explorePlanTask,
} from "./planImports";
import type { SetupForm, TaskKind, Favourite } from "./types";
export function usePlanSource({
  id,
  communityTaskId,
  exploreTaskJson,
  requestedChallengeKind,
  setForm,
  setStage,
  setFavourites,
  setError,
  setNotice,
}: {
  id?: string;
  communityTaskId: string | null;
  exploreTaskJson: string | null;
  requestedChallengeKind: TaskKind;
  setForm: Dispatch<SetStateAction<SetupForm>>;
  setStage: Dispatch<SetStateAction<"create" | "build">>;
  setFavourites: Dispatch<SetStateAction<Favourite[]>>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const [loading, setLoading] = useState(
    Boolean(id || communityTaskId || exploreTaskJson),
  );
  useEffect(() => {
    let live = true;
    async function load() {
      const { data: auth } = await readHostIdentity();
      if (!live) return;
      if (!auth.user) {
        setError("Your host session has expired. Please log in again.");
        setLoading(false);
        return;
      }
      const { data: favs } = await readPlanFavourites(auth.user.id);
      if (!live) return;
      setFavourites(favs ?? []);
      if (id) {
        const { data, error: loadError } = await readHostPlan(id, auth.user.id);
        if (!live) return;
        if (loadError || !data) setError("Couldn't load this game plan.");
        else {
          setForm(hydratePlan(data));
          setStage("build");
        }
      } else if (communityTaskId) {
        const { data: submission, error: communityError } =
          await readApprovedPlanTask(communityTaskId);
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
    id,
    communityTaskId,
    exploreTaskJson,
    requestedChallengeKind,
    setForm,
    setStage,
    setFavourites,
    setError,
    setNotice,
  ]);
  return { loading };
}
