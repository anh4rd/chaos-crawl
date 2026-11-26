import type { Task } from "../host-planning/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function addChallengeToPlan(plan: unknown, task: Task) {
  if (!isRecord(plan))
    throw new Error("Open and save this game plan before adding challenges.");
  const {
    customTasks,
    selectedTasks,
    selectedTaskIds,
    selectedMain,
    selectedSide,
    selectedSecret,
    schedule,
  } = plan;
  if (
    !Array.isArray(customTasks) ||
    !customTasks.every(isRecord) ||
    !Array.isArray(selectedTasks) ||
    !selectedTasks.every(isRecord) ||
    !Array.isArray(selectedTaskIds) ||
    !selectedTaskIds.every((id) => typeof id === "string") ||
    !Array.isArray(selectedMain) ||
    !selectedMain.every((id) => typeof id === "string") ||
    !Array.isArray(selectedSide) ||
    !selectedSide.every((id) => typeof id === "string") ||
    !Array.isArray(selectedSecret) ||
    !selectedSecret.every((id) => typeof id === "string") ||
    !Array.isArray(schedule) ||
    !schedule.every(isRecord)
  )
    throw new Error("Open and save this game plan before adding challenges.");

  const collision = customTasks.find((item) => item.id === task.id);
  const id =
    collision && collision.kind !== task.kind
      ? `${task.id}-${task.kind}`
      : task.id;
  const existing = customTasks.find((item) => item.id === id);
  if (existing && existing.kind !== task.kind)
    throw new Error(
      "This challenge conflicts with another saved challenge. Open the plan to add it.",
    );
  const selected =
    task.kind === "main"
      ? selectedMain
      : task.kind === "side"
        ? selectedSide
        : selectedSecret;
  if (selected.includes(id)) return { plan, added: false };
  const nextTask = { ...task, id };
  const nextSchedule = [...schedule];
  if (
    task.kind === "main" &&
    !nextSchedule.some(
      (item) => item.type === "challenge" && item.taskId === id,
    )
  ) {
    if (task.prepMinutes || task.performanceMinutes) {
      if (task.prepMinutes)
        nextSchedule.push({
          id: `task-${id}-prep`,
          type: "challenge",
          title: `${task.title} — Player prep`,
          duration: task.prepMinutes,
          taskId: id,
          phase: "prep",
          editable: true,
        });
      if (task.performanceMinutes)
        nextSchedule.push({
          id: `task-${id}-performance`,
          type: "challenge",
          title: `${task.title} — Player performance`,
          duration: task.performanceMinutes,
          taskId: id,
          phase: "performance",
          editable: true,
        });
    } else {
      nextSchedule.push({
        id: `task-${id}`,
        type: "challenge",
        title: task.title,
        duration: task.minutes,
        taskId: id,
        editable: true,
      });
    }
  } else if (
    task.kind === "secret" &&
    plan.secretRevealMode !== "random" &&
    !nextSchedule.some((item) => item.type === "secret-reveal")
  ) {
    nextSchedule.push({
      id: "secret-reveal",
      type: "secret-reveal",
      title: "Reveal secret missions",
      duration: 0,
    });
  }
  return {
    plan: {
      ...plan,
      customTasks: existing ? customTasks : [...customTasks, nextTask],
      selectedTasks: [
        ...selectedTasks.filter((item) => item.id !== id),
        existing ?? nextTask,
      ],
      selectedTaskIds: [...new Set([...selectedTaskIds, id])],
      selectedMain: task.kind === "main" ? [...selectedMain, id] : selectedMain,
      selectedSide: task.kind === "side" ? [...selectedSide, id] : selectedSide,
      selectedSecret:
        task.kind === "secret" ? [...selectedSecret, id] : selectedSecret,
      ...(task.kind === "side"
        ? { sideChallenges: true, slideshow: true, liveFinal: true }
        : {}),
      ...(task.kind === "secret" ? { secretMissions: true } : {}),
      schedule: nextSchedule,
    },
    added: true,
  };
}
