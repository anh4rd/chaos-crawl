import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { SetupForm, Task, ScheduleItem, UpdatePlan } from "./types";
import { initialSchedule } from "./planModel";
import { taskLibrary } from "./catalog";
export function usePlanSchedule({
  form,
  setForm,
  update,
  allTasks,
  stage,
  setNotice,
}: {
  form: SetupForm;
  setForm: Dispatch<SetStateAction<SetupForm>>;
  update: UpdatePlan;
  allTasks: Task[];
  stage: "create" | "build";
  setNotice: (message: string) => void;
}) {
  useEffect(() => {
    if (stage !== "build") return;
    setForm((current) =>
      current.schedule.length
        ? current
        : { ...current, schedule: initialSchedule(current) },
    );
  }, [stage, setForm]);
  function updateScheduleItem(itemId: string, patch: Partial<ScheduleItem>) {
    update(
      "schedule",
      form.schedule.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  }
  function setPreGameTask(taskId: string, enabled = form.preGameEnabled) {
    update("preGameTaskId", taskId);
    const task = allTasks.find((item) => item.id === taskId);
    if (
      task &&
      !taskLibrary.some((item) => item.id === task.id) &&
      !form.customTasks.some((item) => item.id === task.id)
    )
      update("customTasks", [...form.customTasks, task]);
    const withoutPreGame = form.schedule.filter(
      (item) => item.type !== "pregame" && item.type !== "pregame-review",
    );
    if (!task || !enabled) {
      update("schedule", withoutPreGame);
      return;
    }
    const welcomeIndex = withoutPreGame.findIndex(
      (item) => item.type === "welcome",
    );
    const insertAt = welcomeIndex >= 0 ? welcomeIndex + 1 : 0;
    const additions: ScheduleItem[] = [
      {
        id: "pregame",
        type: "pregame",
        title: `Pre-game: ${task.title}`,
        duration: 0,
        taskId: task.id,
      },
      {
        id: "pregame-review",
        type: "pregame-review",
        title: "Review & vote on pre-game challenge",
        duration: 15,
      },
    ];
    withoutPreGame.splice(insertAt, 0, ...additions);
    update("schedule", withoutPreGame);
  }
  function addTaskToSchedule(taskId: string) {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;
    if (
      form.schedule.some(
        (item) => item.type === "challenge" && item.taskId === taskId,
      )
    ) {
      setNotice("That challenge is already in the schedule.");
      return;
    }
    if (
      !taskLibrary.some((item) => item.id === task.id) &&
      !form.customTasks.some((item) => item.id === task.id)
    )
      update("customTasks", [...form.customTasks, task]);
    if (!form.selectedMain.includes(taskId)) {
      update("selectedMain", [...form.selectedMain, taskId]);
    }
    const stamp = Date.now();
    if (task.prepMinutes || task.performanceMinutes) {
      const phases: ScheduleItem[] = [];
      if (task.prepMinutes)
        phases.push({
          id: `task-${task.id}-prep-${stamp}`,
          type: "challenge",
          title: `${task.title} — Player prep`,
          duration: task.prepMinutes,
          taskId: task.id,
          phase: "prep",
          editable: true,
        });
      if (task.performanceMinutes)
        phases.push({
          id: `task-${task.id}-performance-${stamp}`,
          type: "challenge",
          title: `${task.title} — Player performance`,
          duration: task.performanceMinutes,
          taskId: task.id,
          phase: "performance",
          editable: true,
        });
      update("schedule", [...form.schedule, ...phases]);
    } else {
      update("schedule", [
        ...form.schedule,
        {
          id: `task-${task.id}-${stamp}`,
          type: "challenge",
          title: task.title,
          duration: task.minutes,
          taskId: task.id,
          editable: true,
        },
      ]);
    }
    setNotice(`Added “${task.title}” to the schedule.`);
  }
  function addScheduleItem(type: "break" | "challenge") {
    if (type === "break")
      update("schedule", [
        ...form.schedule,
        {
          id: `break-${Date.now()}`,
          type: "break",
          title: "Break",
          duration: 15,
        },
      ]);
    else
      update("schedule", [
        ...form.schedule,
        {
          id: `custom-schedule-${Date.now()}`,
          type: "challenge",
          title: "New challenge",
          duration: 15,
          editable: true,
        },
      ]);
  }
  function deleteScheduleItem(itemId: string) {
    const removed = form.schedule.find((item) => item.id === itemId);
    const nextSchedule = form.schedule.filter((item) => item.id !== itemId);
    update("schedule", nextSchedule);
    if (
      removed?.type === "challenge" &&
      removed.taskId &&
      !nextSchedule.some(
        (item) => item.type === "challenge" && item.taskId === removed.taskId,
      )
    ) {
      update(
        "selectedMain",
        form.selectedMain.filter((id) => id !== removed.taskId),
      );
    }
  }
  return {
    updateScheduleItem,
    setPreGameTask,
    addTaskToSchedule,
    addScheduleItem,
    deleteScheduleItem,
  };
}
