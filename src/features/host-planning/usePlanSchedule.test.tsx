import { useState } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { defaultForm } from "./catalog";
import { createPlanWrite, derivePlan, hydratePlan } from "./planModel";
import { usePlanSchedule } from "./usePlanSchedule";
import type { SetupForm, UpdatePlan } from "./types";
afterEach(cleanup);
it("initializes on build entry while preserving subsequent timeline edits", () => {
  const { result } = renderHook(() => {
    const [form, setForm] = useState<SetupForm>({ ...defaultForm });
    const [stage, setStage] = useState<"create" | "build">("create");
    const update: UpdatePlan = (key, value) =>
      setForm((current) => ({ ...current, [key]: value }));
    const actions = usePlanSchedule({
      form,
      setForm,
      update,
      allTasks: derivePlan(form).allTasks,
      stage,
      setNotice: vi.fn(),
    });
    return { form, setForm, stage, setStage, update, ...actions };
  });
  act(() => result.current.setStage("build"));
  expect(result.current.form.schedule.map((item) => item.id)).toEqual([
    "welcome",
    "teams",
  ]);
  act(() => {
    result.current.updateScheduleItem("welcome", { duration: 22 });
    result.current.update("teamsEnabled", false);
  });
  expect(result.current.form.schedule[0]?.duration).toBe(22);
  expect(result.current.form.schedule).toHaveLength(2);
  act(() => result.current.setStage("create"));
  act(() => result.current.setStage("build"));
  expect(result.current.form.schedule[0]?.duration).toBe(22);
  act(() => result.current.update("schedule", []));
  expect(result.current.form.schedule).toEqual([]);
  act(() => result.current.setStage("create"));
  act(() => result.current.setStage("build"));
  expect(result.current.form.schedule.map((item) => item.id)).toEqual([
    "welcome",
  ]);
});
it("keeps an imported main task selected once while preserving both timing phases", () => {
  const task = {
    id: "imported",
    title: "Imported act",
    description: "Prepare and perform",
    kind: "main" as const,
    minutes: 10,
    prepMinutes: 3,
    performanceMinutes: 7,
    points: 20,
    vibe: [],
    accessibility: [],
    equipment: [],
    setup: "",
    prep: "",
    evidenceRequired: false,
  };
  const { result } = renderHook(() => {
    const [form, setForm] = useState<SetupForm>({
      ...defaultForm,
      selectedMain: [task.id],
      customTasks: [task],
    });

    const update: UpdatePlan = (key, value) =>
      setForm((current) => ({ ...current, [key]: value }));
    const actions = usePlanSchedule({
      form,
      setForm,
      update,
      allTasks: derivePlan(form).allTasks,
      stage: "build",
      setNotice: vi.fn(),
    });
    return { form, ...actions };
  });
  act(() => result.current.addTaskToSchedule(task.id));
  expect(result.current.form.selectedMain).toEqual([task.id]);
  expect(
    result.current.form.schedule
      .filter((item) => item.taskId === task.id)
      .map((item) => [item.phase, item.duration]),
  ).toEqual([
    ["prep", 3],
    ["performance", 7],
  ]);
  act(() => result.current.addTaskToSchedule(task.id));
  expect(
    result.current.form.schedule.filter((item) => item.taskId === task.id),
  ).toHaveLength(2);
});
it.each(["schedule", "pre-game"] as const)(
  "snapshots an Explore main challenge when added to %s",
  (target) => {
    const task = {
      id: "catalog:task-main",
      title: "Explore main",
      description: "An idea",
      kind: "main" as const,
      minutes: 10,
      points: 20,
      vibe: [],
      accessibility: [],
      equipment: [],
      setup: "",
      prep: "",
      evidenceRequired: false,
    };
    const { result } = renderHook(() => {
      const [form, setForm] = useState<SetupForm>({
        ...defaultForm,
        preGameEnabled: true,
      });
      const update: UpdatePlan = (key, value) =>
        setForm((current) => ({ ...current, [key]: value }));
      return {
        form,
        ...usePlanSchedule({
          form,
          setForm,
          update,
          allTasks: [...derivePlan(form).allTasks, task],
          stage: "build",
          setNotice: vi.fn(),
        }),
      };
    });
    act(() => {
      if (target === "schedule") result.current.addTaskToSchedule(task.id);
      else result.current.setPreGameTask(task.id);
    });
    expect(result.current.form.customTasks).toContainEqual(task);
    expect(derivePlan(result.current.form).selectedTasks).toContainEqual(task);
    const saved = createPlanWrite(result.current.form, "host", "draft");
    const reopened = hydratePlan({
      id: "plan",
      ...saved,
      plan_data: { ...saved.plan_data },
    });
    expect(derivePlan(reopened).selectedTasks).toContainEqual(task);
    expect(result.current.form.schedule).toContainEqual(
      expect.objectContaining({ taskId: task.id }),
    );
  },
);
