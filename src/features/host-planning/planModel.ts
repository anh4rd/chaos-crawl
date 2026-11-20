import type { SetupForm, ScheduleItem } from "./types";
import type {
  StoredPlan,
  PlanSnapshot,
  PlanWrite,
} from "../../types/hostPlanning";
import { defaultForm, taskLibrary } from "./catalog";
import { timePlus, today } from "../../utils/dateTime";

function stringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function derivePlan(form: SetupForm) {
  const allTasks = [...taskLibrary, ...form.customTasks];
  const selectedTasks = allTasks.filter(
    (t) =>
      form.selectedMain.includes(t.id) ||
      form.selectedSide.includes(t.id) ||
      form.selectedSecret.includes(t.id) ||
      (form.preGameEnabled && form.preGameTaskId === t.id),
  );
  const selectedMainTasks = form.selectedMain
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter((task) => task !== undefined);
  const sideTasks = form.selectedSide
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter((task) => task !== undefined);
  const secretTasks = form.selectedSecret
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter((task) => task !== undefined);
  const equipment = [...new Set(selectedTasks.flatMap((t) => t.equipment))];
  const preparation = selectedTasks.filter(
    (t) => t.prep && !/no preparation required/i.test(t.prep),
  );
  const sideReviewCount = form.sideChallenges ? sideTasks.length : 0;
  const sideReviewMinutes = sideReviewCount * 5;
  const sideRewardPoints = form.sideChallenges
    ? sideTasks.reduce((sum, task) => sum + task.points, 0)
    : 0;
  const liveFinalMinutes = form.sideChallenges
    ? form.finalDuration + sideReviewMinutes
    : 0;
  function scheduleTotal() {
    return (
      form.schedule.reduce((sum, item) => sum + item.duration, 0) +
      liveFinalMinutes
    );
  }
  const calculatedEnd = timePlus(form.startTime, scheduleTotal());
  return {
    allTasks,
    selectedTasks,
    selectedMainTasks,
    sideTasks,
    secretTasks,
    equipment,
    preparation,
    sideReviewCount,
    sideReviewMinutes,
    sideRewardPoints,
    liveFinalMinutes,
    calculatedEnd,
  };
}
export function validatePlan(form: SetupForm) {
  if (!form.name.trim()) return "Add a game name.";
  if (!form.eventDate) return "Choose the event date.";
  if (form.playerCount < 2 || form.playerCount > 100)
    return "Choose an approximate player count between 2 and 100.";
  if (!form.schedule.some((item) => item.type === "challenge"))
    return "Add at least one main challenge to the Schedule.";
  if (form.sideChallenges && !form.selectedSide.length)
    return "Add at least one side challenge or turn side challenges off.";
  if (form.secretMissions && !form.selectedSecret.length)
    return "Add at least one secret mission or turn secret missions off.";
  if (form.sideChallenges && (!form.liveFinal || !form.slideshow))
    return "Side challenges require a live final and slideshow. These have been enabled automatically.";
  return "";
}

export function createPlanWrite(
  form: SetupForm,
  hostId: string,
  status: "draft" | "planned",
): PlanWrite {
  const projection = derivePlan(form);
  const planData: PlanSnapshot = {
    version: 3,
    ...form,
    selectedTasks: projection.selectedTasks,
    selectedTaskIds: [
      ...form.selectedMain,
      ...form.selectedSide,
      ...form.selectedSecret,
    ],
    locationMode: "single-venue",
    noVenueChanges: true,
    estimatedEndTime: projection.calculatedEnd,
    generatedEquipment: projection.equipment,
    generatedPreparation: projection.preparation.map((t) => ({
      title: t.title,
      prep: t.prep,
    })),
  };
  const payload: PlanWrite = {
    name: form.name.trim() || "Untitled chaos",
    host_id: hostId,
    event_date: form.eventDate || null,
    start_time: form.startTime || null,
    end_time: form.idealEndTime || projection.calculatedEnd,
    player_count: form.playerCount,
    venue_name: form.venueName.trim() || null,
    status,
    plan_data: planData,
  };
  return payload;
}
export function hydratePlan(data: StoredPlan): SetupForm {
  const p = data.plan_data ?? {};
  return {
    ...defaultForm,
    ...p,
    name: String(data.name ?? p.name ?? ""),
    eventDate: String(data.event_date ?? p.eventDate ?? today()),
    startTime: String(data.start_time ?? p.startTime ?? "18:00").slice(0, 5),
    idealEndTime: String(data.end_time ?? p.idealEndTime ?? "22:00").slice(
      0,
      5,
    ),
    playerCount: Number(data.player_count ?? p.playerCount ?? 12),
    venueName: String(data.venue_name ?? p.venueName ?? ""),
    selectedMain: Array.isArray(p.selectedMain)
      ? p.selectedMain
      : Array.isArray(p.selectedTaskIds)
        ? p.selectedTaskIds.filter((x) =>
            taskLibrary.some((t) => t.id === x && t.kind === "main"),
          )
        : defaultForm.selectedMain,
    challengeArtUrls: stringRecord(p.challengeArtUrls),
    selectedSide: Array.isArray(p.selectedSide)
      ? p.selectedSide
      : defaultForm.selectedSide,
    selectedSecret: Array.isArray(p.selectedSecret)
      ? p.selectedSecret
      : defaultForm.selectedSecret,
    customTasks: Array.isArray(p.customTasks) ? p.customTasks : [],
  };
}
export function initialSchedule(form: SetupForm): ScheduleItem[] {
  const allTasks = [...taskLibrary, ...form.customTasks];
  const preTask = allTasks.find((t) => t.id === form.preGameTaskId);
  const items: ScheduleItem[] = [
    ...(form.preGameEnabled && preTask
      ? [
          {
            id: "pregame",
            type: "pregame" as const,
            title: `Pre-game: ${preTask.title}`,
            duration: 0,
            taskId: preTask.id,
          },
        ]
      : []),
    {
      id: "welcome",
      type: "welcome",
      title: "Game begins & welcome",
      duration: 10,
    },
    ...(form.teamsEnabled
      ? [
          {
            id: "teams",
            type: "teams" as const,
            title: "Team selection",
            duration: 15,
          },
        ]
      : []),
    ...(form.preGameEnabled && form.preGameTaskId
      ? [
          {
            id: "pregame-review",
            type: "pregame-review" as const,
            title: "Review & vote on pre-game challenge",
            duration: 15,
          },
        ]
      : []),
    ...(form.secretMissions &&
    form.selectedSecret.length &&
    form.secretRevealMode === "scheduled"
      ? [
          {
            id: "secret-reveal",
            type: "secret-reveal" as const,
            title: "Reveal secret missions",
            duration: 0,
          },
        ]
      : []),
  ];
  return items;
}
