import type { PlannedTaskInfo } from "../../types/hostSession";
import type { GameScheduleItem } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
function isPlannedTask(
  value: unknown,
): value is Record<string, unknown> & PlannedTaskInfo {
  return (
    isRecord(value) &&
    optionalString(value.id) &&
    optionalString(value.title) &&
    optionalString(value.setup) &&
    optionalString(value.prep) &&
    (value.equipment === undefined || isStringArray(value.equipment))
  );
}
function projectTask(task: PlannedTaskInfo): PlannedTaskInfo {
  return {
    ...(task.id !== undefined ? { id: task.id } : {}),
    ...(task.title !== undefined ? { title: task.title } : {}),
    ...(task.equipment !== undefined ? { equipment: task.equipment } : {}),
    ...(task.setup !== undefined ? { setup: task.setup } : {}),
    ...(task.prep !== undefined ? { prep: task.prep } : {}),
  };
}
function isScheduleItem(value: unknown): value is GameScheduleItem {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    typeof value.title === "string" &&
    typeof value.duration === "number" &&
    Number.isFinite(value.duration) &&
    optionalString(value.id) &&
    optionalString(value.taskId) &&
    optionalString(value.phase)
  );
}
export function projectLiveHostPlan(value: unknown) {
  const plan = isRecord(value) ? value : {};
  const photos = isRecord(plan.teamPhotoUrls) ? plan.teamPhotoUrls : {};
  const teamPhotoUrls: Record<string, string> = {};
  for (const [id, url] of Object.entries(photos))
    if (typeof url === "string") teamPhotoUrls[id] = url;
  const breakMinutes =
    typeof plan.breakMinutes === "number" ||
    typeof plan.breakMinutes === "string"
      ? Number(plan.breakMinutes)
      : 0;
  return {
    gamePhotoUrl:
      typeof plan.gamePhotoUrl === "string" ? plan.gamePhotoUrl : null,
    teamPhotoUrls,
    autoplayEnabled: Boolean(plan.autoplay),
    defaultBreakMinutes: Number.isFinite(breakMinutes)
      ? Math.max(0, breakMinutes)
      : 0,
    gameSchedule: Array.isArray(plan.schedule)
      ? plan.schedule.filter(isScheduleItem).map((item) => ({
          type: item.type,
          title: item.title,
          duration: item.duration,
          ...(item.id !== undefined ? { id: item.id } : {}),
          ...(item.taskId !== undefined ? { taskId: item.taskId } : {}),
          ...(item.phase !== undefined ? { phase: item.phase } : {}),
        }))
      : [],
    plannedTasks: Array.isArray(plan.selectedTasks)
      ? plan.selectedTasks.filter(isPlannedTask).map(projectTask)
      : [],
  };
}

export function patchLiveHostPlanTask(
  value: unknown,
  id: string,
  patch: {
    title: string;
    description: string;
    minutes: number;
    points: number;
    equipment: string[];
  },
) {
  if (
    !isRecord(value) ||
    !Array.isArray(value.selectedTasks) ||
    !value.selectedTasks.every(isPlannedTask)
  )
    return null;
  const selectedTasks = value.selectedTasks.map((task) =>
    task.id === id ? { ...task, ...patch } : task,
  );
  return {
    planData: { ...value, selectedTasks },
    plannedTasks: selectedTasks.map(projectTask),
  };
}
