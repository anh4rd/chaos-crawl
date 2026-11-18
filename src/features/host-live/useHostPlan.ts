import { useEffect, useState } from "react";
import { supabase } from "../../lib/sessionSupabase";
import type { GameScheduleItem, GameSession, PlannedTaskInfo } from "./types";

interface Options {
  session: GameSession | null;
}
export function useHostPlan({ session }: Options) {
  const [teamPhotoUrls, setTeamPhotoUrls] = useState<Record<string, string>>(
    {},
  );

  const [gamePhotoUrl, setGamePhotoUrl] = useState<string | null>(null);

  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  const [gameSchedule, setGameSchedule] = useState<GameScheduleItem[]>([]);

  const [plannedTasks, setPlannedTasks] = useState<PlannedTaskInfo[]>([]);

  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(0);

  useEffect(() => {
    if (!session?.host_game_id) return;
    let alive = true;
    void supabase
      .from("host_games")
      .select("plan_data")
      .eq("id", session.host_game_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        const planData = data?.plan_data as {
          gamePhotoUrl?: string | null;
          teamPhotoUrls?: Record<string, string>;
          autoplay?: boolean;
          breakMinutes?: number;
          schedule?: GameScheduleItem[];
          selectedTasks?: PlannedTaskInfo[];
        } | null;
        setGamePhotoUrl(planData?.gamePhotoUrl ?? null);
        setTeamPhotoUrls(planData?.teamPhotoUrls ?? {});
        setAutoplayEnabled(Boolean(planData?.autoplay));
        setDefaultBreakMinutes(
          Math.max(0, Number(planData?.breakMinutes) || 0),
        );
        setGameSchedule(
          Array.isArray(planData?.schedule) ? planData.schedule : [],
        );
        setPlannedTasks(
          Array.isArray(planData?.selectedTasks) ? planData.selectedTasks : [],
        );
      });
    return () => {
      alive = false;
    };
  }, [session?.host_game_id]);
  return {
    teamPhotoUrls,
    setTeamPhotoUrls,
    gamePhotoUrl,
    autoplayEnabled,
    gameSchedule,
    plannedTasks,
    setPlannedTasks,
    defaultBreakMinutes,
  };
}
