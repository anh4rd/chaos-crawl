import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { SetupForm, Task, ScheduleItem, UpdatePlan } from "./types";
import { challengeScheduleItems, initialSchedule } from "./planModel";
import { taskLibrary } from "./catalog";
import { selectedChallengeKind } from "./planImports";
export function usePlanSchedule({
  form,
  setForm,
  update,
  allTasks,
  stage,
  setNotice,
  setError,
}: {
  form: SetupForm;
  setForm: Dispatch<SetStateAction<SetupForm>>;
  update: UpdatePlan;
  allTasks: Task[];
  stage: "create" | "build";
  setNotice: (message: string) => void;
  setError: (message: string) => void;
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
    const task = allTasks.find((t) => t.id === taskId && t.kind === "main");
    if (!task) return;
    const otherKind = selectedChallengeKind(
      form,
      form.customTasks,
      task,
      "main",
    );
    if (otherKind) {
      setError(
        `This challenge is already in this game as ${otherKind}. Remove it there before adding it as main.`,
      );
      return;
    }
    setError("");
    if (
      form.schedule.some(
        (item) =>
          item.type === "challenge" &&
          item.taskId &&
          selectedChallengeKind(
            {
              selectedMain: [item.taskId],
              selectedSide: [],
              selectedSecret: [],
            },
            form.customTasks,
            task,
          ) === "main",
      )
    ) {
      setNotice("That challenge is already in the schedule.");
      return;
    }
    if (!taskLibrary.some((item) => item.id === task.id)) {
      const saved = form.customTasks.find((item) => item.id === task.id);
      if (!saved || saved.kind !== task.kind)
        update("customTasks", [
          ...form.customTasks.filter((item) => item.id !== task.id),
          task,
        ]);
    }
    if (!form.selectedMain.includes(taskId)) {
      update("selectedMain", [...form.selectedMain, taskId]);
    }
    update("schedule", [
      ...form.schedule,
      ...challengeScheduleItems(task, Date.now()),
    ]);
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
