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
