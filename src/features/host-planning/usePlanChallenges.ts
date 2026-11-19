import {
  useState,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  Task,
  TaskKind,
  SetupForm,
  BuilderTab,
  Favourite,
  UpdatePlan,
} from "./types";
export function usePlanChallenges({
  form,
  update,
  tab,
  allTasks,
  favourites,
  toggleFavourite,
  dragged,
  setDragged,
}: {
  form: SetupForm;
  update: UpdatePlan;
  tab: BuilderTab;
  allTasks: Task[];
  favourites: Favourite[];
  toggleFavourite: (task: Task) => Promise<void>;
  dragged: string | null;
  setDragged: Dispatch<SetStateAction<string | null>>;
}) {
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [vibeFilter, setVibeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const selectedIds =
    tab === "side"
      ? form.selectedSide
      : tab === "secret"
        ? form.selectedSecret
        : [];
  const visibleTasks = allTasks
    .filter(
      (t) =>
        t.kind ===
        (tab === "main" ? "main" : tab === "side" ? "side" : "secret"),
    )
    .filter(
      (t) =>
        !favouritesOnly ||
        favourites.some((f) => f.item_type === "task" && f.item_id === t.id),
    )
    .filter((t) => vibeFilter === "all" || t.vibe.includes(vibeFilter))
    .filter(
      (t) => accessFilter === "all" || t.accessibility.includes(accessFilter),
    )
    .filter((t) => form.accessibility.every((a) => t.accessibility.includes(a)))
    .filter((t) =>
      `${t.title} ${t.description} ${t.equipment.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  function selectTask(task: Task) {
    const key =
      task.kind === "main"
        ? "selectedMain"
        : task.kind === "side"
          ? "selectedSide"
          : "selectedSecret";
    const list = form[key];
    const removing = list.includes(task.id);
    update(
      key,
      removing ? list.filter((x) => x !== task.id) : [...list, task.id],
    );
    if (
      task.kind === "secret" &&
      !removing &&
      form.secretRevealMode === "scheduled" &&
      !form.schedule.some((item) => item.type === "secret-reveal")
    ) {
      update("schedule", [
        ...form.schedule,
        {
          id: "secret-reveal",
          type: "secret-reveal",
          title: "Reveal secret missions",
          duration: 0,
        },
      ]);
    }
    if (task.kind === "secret" && removing && list.length === 1)
      update(
        "schedule",
        form.schedule.filter((item) => item.type !== "secret-reveal"),
      );
  }
  const selectionKey =
    tab === "side"
      ? "selectedSide"
      : tab === "secret"
        ? "selectedSecret"
        : "selectedMain";
  function moveTask(taskId: string, direction: -1 | 1) {
    const selection = form[selectionKey];
    const index = selection.indexOf(taskId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= selection.length) return;
    const reordered = [...selection];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    update(selectionKey, reordered);
  }
  function dropTask(targetId: string) {
    setDragged(null);
    if (!dragged || dragged === targetId) return;
    const reordered = [...form[selectionKey]];
    const from = reordered.indexOf(dragged);
    const to = reordered.indexOf(targetId);
    if (from < 0 || to < 0) return;
    reordered.splice(from, 1);
    reordered.splice(to, 0, dragged);
    update(selectionKey, reordered);
  }
  function addCustomTask(e: FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;
    const kind: TaskKind =
      tab === "side" ? "side" : tab === "secret" ? "secret" : "main";
    const task: Task = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      description: customDesc.trim() || "Custom challenge created by the host.",
      kind,
      minutes: 15,
      points: 10,
      vibe: ["creative"],
      accessibility: ["seated-option"],
      equipment: [],
      setup: "Add setup instructions.",
      prep: "No preparation required.",
      evidenceRequired: kind !== "main",
    };
    update("customTasks", [...form.customTasks, task]);
    if (tab === "main") void toggleFavourite(task);
    else selectTask(task);
    setCustomTitle("");
    setCustomDesc("");
  }
  return {
    selectedIds,
    visibleTasks,
    selectTask,
    moveTask,
    dropTask,
    addCustomTask,
    favouritesOnly,
    setFavouritesOnly,
    vibeFilter,
    setVibeFilter,
    accessFilter,
    setAccessFilter,
    search,
    setSearch,
    customTitle,
    setCustomTitle,
    customDesc,
    setCustomDesc,
  };
}
