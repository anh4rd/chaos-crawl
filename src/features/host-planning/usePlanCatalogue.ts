import { useEffect, useState } from "react";
import { readApprovedPlanningChallenges } from "../../lib/hostPlanApi";
import { failedResult } from "../../lib/apiResult";
import { communityTasksFromSubmissions } from "../host-explore/catalogueModel";
import { tasks as builtInTasks } from "../host-explore/catalogue";
import { cataloguePlanTask } from "./planImports";
import type { CommunitySubmission } from "../../types/hostExplore";

const builtIn = builtInTasks.map(cataloguePlanTask);
export function usePlanCatalogue() {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void readApprovedPlanningChallenges()
      .catch(failedResult)
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error || !data)
          setError(error?.message ?? "Couldn't load community challenges.");
        else setSubmissions(data);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    tasks: [
      ...builtIn,
      ...communityTasksFromSubmissions(submissions).map(cataloguePlanTask),
    ],
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
