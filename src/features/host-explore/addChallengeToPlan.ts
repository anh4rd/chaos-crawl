import type { Task } from "../host-planning/types";
import { selectedChallengeKind } from "../host-planning/planImports";

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

  const selection = { selectedMain, selectedSide, selectedSecret };
  const otherKind = selectedChallengeKind(
    selection,
    customTasks,
    task,
    task.kind,
  );
  if (otherKind)
    throw new Error(
      `This challenge is already in this game as ${otherKind}. Remove it there before adding it as ${task.kind}.`,
    );
  if (selectedChallengeKind(selection, customTasks, task) === task.kind)
    return { plan, added: false };
  const id = task.id;
  const existing = customTasks.find((item) => item.id === id);
  const existingSameKind = existing?.kind === task.kind ? existing : undefined;
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
      customTasks: existingSameKind
        ? customTasks
        : [...customTasks.filter((item) => item.id !== id), nextTask],
      selectedTasks: [
        ...selectedTasks.filter((item) => item.id !== id),
        existingSameKind ?? nextTask,
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
