import { useState } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { defaultForm } from "./catalog";
import { derivePlan } from "./planModel";
import { usePlanChallenges } from "./usePlanChallenges";
import type { SetupForm, UpdatePlan } from "./types";

afterEach(cleanup);

it.each(["side", "secret"] as const)(
  "reorders only the active %s selection using buttons and drag/drop",
  (tab) => {
    const key = tab === "side" ? "selectedSide" : "selectedSecret";
    const initial: SetupForm = {
      ...defaultForm,
      selectedMain: ["pineapple", "best-noise"],
      selectedSide: ["team-handshake", "team-laugh"],
      selectedSecret: ["secret-word", "secret-toast"],
    };
    const first = initial[key][0];
    const second = initial[key][1];
    const { result } = renderHook(() => {
      const [form, setForm] = useState(initial);
      const [dragged, setDragged] = useState<string | null>(null);
      const update: UpdatePlan = (field, value) =>
        setForm((current) => ({ ...current, [field]: value }));
      const actions = usePlanChallenges({
        form,
        update,
        tab,
        allTasks: derivePlan(form).allTasks,
        favourites: [],
        toggleFavourite: vi.fn(),
        dragged,
        setDragged,
        setError: vi.fn(),
      });
      return { form, dragged, setDragged, ...actions };
    });
    act(() => result.current.moveTask(second, -1));
    expect(result.current.form).toEqual({ ...initial, [key]: [second, first] });
    act(() => result.current.moveTask(second, -1));
    expect(result.current.form[key]).toEqual([second, first]);
    act(() => result.current.moveTask(second, 1));
    expect(result.current.form).toEqual(initial);
    act(() => result.current.setDragged(second));
    act(() => result.current.dropTask(first));
    expect(result.current.form).toEqual({ ...initial, [key]: [second, first] });
    expect(result.current.dragged).toBeNull();
    act(() => result.current.setDragged("pineapple"));
    act(() => result.current.dropTask(first));
    expect(result.current.form).toEqual({ ...initial, [key]: [second, first] });
    expect(result.current.dragged).toBeNull();
  },
);

it("copies a selected saved mission into the plan so it survives unfavouriting", () => {
  const task = {
    id: "saved-secret",
    title: "Saved secret",
    description: "A mission",
    kind: "secret" as const,
    minutes: 5,
    points: 10,
    vibe: [],
    accessibility: [],
    equipment: [],
    setup: "",
    prep: "",
    evidenceRequired: true,
  };
  const { result } = renderHook(() => {
    const [form, setForm] = useState(defaultForm);
    const update: UpdatePlan = (field, value) =>
      setForm((current) => ({ ...current, [field]: value }));
    return {
      form,
      ...usePlanChallenges({
        form,
        update,
        tab: "secret",
        allTasks: [...derivePlan(form).allTasks, task],
        favourites: [],
        toggleFavourite: vi.fn(),
        dragged: null,
        setDragged: vi.fn(),
        setError: vi.fn(),
      }),
    };
  });

  act(() => result.current.selectTask(task));
  expect(result.current.form).toMatchObject({
    secretMissions: true,
    selectedSecret: ["saved-secret"],
    customTasks: [task],
    schedule: [{ type: "secret-reveal" }],
  });
});

it("snapshots an Explore side challenge without enabling secret missions", () => {
  const task = {
    id: "catalog:task-side",
    title: "Explore side",
    description: "A side challenge",
    kind: "side" as const,
    minutes: 5,
    points: 10,
    vibe: [],
    accessibility: [],
    equipment: [],
    setup: "",
    prep: "",
    evidenceRequired: true,
  };
  const { result } = renderHook(() => {
    const [form, setForm] = useState({
      ...defaultForm,
      secretMissions: false,
    });
    const update: UpdatePlan = (field, value) =>
      setForm((current) => ({ ...current, [field]: value }));
    return {
      form,
      ...usePlanChallenges({
        form,
        update,
        tab: "side",
        allTasks: [task],
        favourites: [
          {
            id: "fav",
            item_type: "task",
            item_id: "task-side",
            item_data: {},
          },
        ],
        toggleFavourite: vi.fn(),
        dragged: null,
        setDragged: vi.fn(),
        setError: vi.fn(),
      }),
    };
  });
  act(() => result.current.setFavouritesOnly(true));
  expect(result.current.visibleTasks).toEqual([task]);
  act(() => result.current.selectTask(task));
  expect(result.current.form.secretMissions).toBe(false);
  expect(derivePlan(result.current.form).sideTasks).toContainEqual(task);
});

it("blocks a different type even when the selected challenge uses another source ID", () => {
  const task = {
    id: "catalog:idea",
    title: "Idea",
    description: "Test",
    kind: "secret" as const,
    minutes: 5,
    points: 10,
    vibe: [],
    accessibility: [],
    equipment: [],
    setup: "",
    prep: "",
    evidenceRequired: true,
  };
  const notice = vi.fn();
  const { result } = renderHook(() => {
    const [form, setForm] = useState({
      ...defaultForm,
      selectedMain: ["explore-idea"],
    });
    const update: UpdatePlan = (field, value) =>
      setForm((current) => ({ ...current, [field]: value }));
    return {
      form,
      ...usePlanChallenges({
        form,
        update,
        tab: "secret",
        allTasks: [task],
        favourites: [],
        toggleFavourite: vi.fn(),
        dragged: null,
        setDragged: vi.fn(),
        setError: notice,
      }),
    };
  });
  act(() => result.current.selectTask(task));
  expect(result.current.form.selectedSecret).toEqual([]);
  expect(result.current.form.selectedMain).toEqual(["explore-idea"]);
  expect(notice).toHaveBeenCalledWith(
    expect.stringContaining("already in this game as main"),
  );
});
