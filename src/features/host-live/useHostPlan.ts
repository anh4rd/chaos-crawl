import type { PlannedTaskInfo } from "../../types/hostSession";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { supabase } from "../../lib/sessionSupabase";
import { projectLiveHostPlan } from "./liveHostPlanData";
import type { GameSession } from "./types";

interface Options {
  session: GameSession | null;
}
function emptyPlan(hostGameId: string | null) {
  return {
    hostGameId,
    ...projectLiveHostPlan(null),
    loading: false,
    error: "",
  };
}
function planReadError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return "Couldn't load the saved game plan.";
}
export function useHostPlan({ session }: Options) {
  const hostGameId = session?.host_game_id ?? null;
  const identity = useRef(hostGameId);
  identity.current = hostGameId;
  const mounted = useRef(true);
  const request = useRef(0);
  const [state, setState] = useState(() => emptyPlan(hostGameId));
  const current =
    state.hostGameId === hostGameId ? state : emptyPlan(hostGameId);
  const reload = useCallback(async () => {
    if (!mounted.current || identity.current !== hostGameId) return;
    const generation = ++request.current;
    const active = () =>
      mounted.current &&
      identity.current === hostGameId &&
      request.current === generation;
    if (!hostGameId) {
      setState(emptyPlan(null));
      return;
    }
    setState((previous) => ({
      ...(previous.hostGameId === hostGameId
        ? previous
        : emptyPlan(hostGameId)),
      loading: true,
      error: "",
    }));
    try {
      const { data, error } = await supabase
        .from("host_games")
        .select("plan_data")
        .eq("id", hostGameId)
        .maybeSingle();
      if (!active()) return;
      if (error) throw error;
      setState({
        hostGameId,
        ...projectLiveHostPlan(data ? (data.plan_data ?? {}) : null),
        loading: false,
        error: "",
      });
    } catch (error) {
      if (!active()) return;
      const message = planReadError(error);
      setState((previous) => ({ ...previous, loading: false, error: message }));
    }
  }, [hostGameId]);
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, [reload]);
  const setTeamPhotoUrls = useCallback(
    (value: SetStateAction<Record<string, string>>) => {
      if (!mounted.current || identity.current !== hostGameId) return;
      setState((previous) => {
        const active =
          previous.hostGameId === hostGameId ? previous : emptyPlan(hostGameId);
        return {
          ...active,
          teamPhotoUrls:
            typeof value === "function" ? value(active.teamPhotoUrls) : value,
        };
      });
    },
    [hostGameId],
  );
  const setPlannedTasks = useCallback(
    (value: SetStateAction<PlannedTaskInfo[]>) => {
      if (!mounted.current || identity.current !== hostGameId) return;
      setState((previous) => {
        const active =
          previous.hostGameId === hostGameId ? previous : emptyPlan(hostGameId);
        return {
          ...active,
          plannedTasks:
            typeof value === "function" ? value(active.plannedTasks) : value,
        };
      });
    },
    [hostGameId],
  );
  const setError = useCallback(
    (value: SetStateAction<string>) => {
      if (!mounted.current || identity.current !== hostGameId) return;
      setState((previous) => {
        const active =
          previous.hostGameId === hostGameId ? previous : emptyPlan(hostGameId);
        return {
          ...active,
          error: typeof value === "function" ? value(active.error) : value,
        };
      });
    },
    [hostGameId],
  );
  return {
    invitationEnabled: current.invitationEnabled,
    teamPhotoUrls: current.teamPhotoUrls,
    setTeamPhotoUrls,
    gamePhotoUrl: current.gamePhotoUrl,
    autoplayEnabled: current.autoplayEnabled,
    decideRewardInGame: current.decideRewardInGame,
    gameSchedule: current.gameSchedule,
    plannedTasks: current.plannedTasks,
    setPlannedTasks,
    defaultBreakMinutes: current.defaultBreakMinutes,
    reviewFinalDuration: current.reviewFinalDuration,
    plannedSideChallenges: current.plannedSideChallenges,
    plannedSecretMissions: current.plannedSecretMissions,
    loading: current.loading,
    error: current.error,
    reload,
    setError,
  };
}
