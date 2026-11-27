import type { Favourite, Task, TaskKind, SetupForm } from "./types";
import type { CommunityPlanTask } from "../../types/hostPlanning";
import type { CatalogTask } from "../host-explore/types";
import { tasks as exploreTasks } from "../host-explore/catalogue";
import { taskLibrary } from "./catalog";
interface ExploreIdea {
  id: string;
  title: string;
  description: string;
  minutes?: unknown;
  points?: unknown;
  prepMinutes?: unknown;
  performanceMinutes?: unknown;
  setup?: unknown;
  tags?: string[];
}
function isExploreIdea(value: unknown): value is ExploreIdea {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("title" in value) ||
    !("description" in value)
  )
    return false;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string"
  )
    return false;
  return (
    !("tags" in value) ||
    value.tags === undefined ||
    (Array.isArray(value.tags) &&
      value.tags.every((tag) => typeof tag === "string"))
  );
}
export function communityPlanTask(
  submission: CommunityPlanTask,
  kind: TaskKind,
): Task {
  const payload = submission.payload ?? {};
  return {
    id: `community-${submission.id}`,
    title: String(submission.title),
    description: String(submission.description ?? ""),
    kind,
    minutes: Math.max(1, Number(payload.minutes ?? 10)),
    prepMinutes: Number(payload.prepMinutes ?? 0) || undefined,
    performanceMinutes: Number(payload.performanceMinutes ?? 0) || undefined,
    points: Math.max(0, Number(payload.points ?? 20)),
    vibe: Array.isArray(payload.tags)
      ? payload.tags.map(String)
      : ["community"],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: [],
    setup:
      payload.setup === "basic"
        ? "Prepare the basic equipment needed for this challenge."
        : payload.setup === "some"
          ? "Some preparation may be needed before this challenge."
          : "No special setup.",
    prep:
      payload.setup === "none"
        ? "No preparation required."
        : "Check the challenge setup before the event.",
    evidenceRequired: kind !== "main",
    tags: Array.isArray(payload.tags)
      ? payload.tags.map(String)
      : ["Community"],
  };
}
function taskFromExploreIdea(
  idea: ExploreIdea,
  kind: TaskKind,
  id: string,
): Task {
  return {
    id,
    title: idea.title,
    description: idea.description,
    kind,
    minutes: Math.max(1, Number(idea.minutes) || 10),
    prepMinutes: Number(idea.prepMinutes ?? 0) || undefined,
    performanceMinutes: Number(idea.performanceMinutes ?? 0) || undefined,
    points: Math.max(0, Number(idea.points) || 0),
    vibe: idea.tags ?? [],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: [],
    setup:
      idea.setup === "basic"
        ? "Prepare basic equipment."
        : idea.setup === "some"
          ? "Some preparation may be needed."
          : "No special setup.",
    prep: "No preparation required.",
    evidenceRequired: kind !== "main",
    tags: idea.tags ?? [],
  };
}
export function explorePlanTask(json: string, kind: TaskKind): Task {
  const idea: unknown = JSON.parse(json);
  if (!isExploreIdea(idea)) throw new Error("Invalid Explore challenge.");
  return taskFromExploreIdea(idea, kind, `explore-${idea.id}`);
}

export function cataloguePlanTask(idea: CatalogTask): Task {
  return taskFromExploreIdea(idea, idea.kind, `catalog:${idea.id}`);
}

export function favouriteTaskId(id: string): string {
  if (id.startsWith("catalog:")) return id.slice("catalog:".length);
  if (id.startsWith("explore-")) return id.slice("explore-".length);
  const task = taskLibrary.find((item) => item.id === id);
  if (!task) return id;
  return (
    exploreTasks.find(
      (idea) =>
        idea.title === task.title &&
        idea.description === task.description &&
        idea.kind === task.kind &&
        idea.minutes === task.minutes &&
        idea.points === task.points &&
        idea.prepMinutes === task.prepMinutes &&
        idea.performanceMinutes === task.performanceMinutes,
    )?.id ?? id
  );
}

export function savedSecretTasks(favourites: Favourite[]) {
  const tasks: Task[] = [];
  let invalid = 0;
  for (const favourite of favourites) {
    const data = favourite.item_data;
    if (
      favourite.item_type !== "task" ||
      typeof data !== "object" ||
      data === null ||
      !("kind" in data) ||
      data.kind !== "secret"
    )
      continue;
    if (!isExploreIdea(data)) {
      invalid += 1;
      continue;
    }
    const task = taskFromExploreIdea(data, "secret", favourite.item_id);
    if (
      "vibe" in data &&
      Array.isArray(data.vibe) &&
      data.vibe.every((value) => typeof value === "string")
    )
      task.vibe = data.vibe;
    if (
      "accessibility" in data &&
      Array.isArray(data.accessibility) &&
      data.accessibility.every((value) => typeof value === "string")
    )
      task.accessibility = data.accessibility;
    if (
      "equipment" in data &&
      Array.isArray(data.equipment) &&
      data.equipment.every((value) => typeof value === "string")
    )
      task.equipment = data.equipment;
    if (
      "setup" in data &&
      typeof data.setup === "string" &&
      !["none", "basic", "some"].includes(data.setup)
    )
      task.setup = data.setup;
    if ("prep" in data && typeof data.prep === "string") task.prep = data.prep;
    if ("instructions" in data && typeof data.instructions === "string")
      task.instructions = data.instructions;
    tasks.push(task);
  }
  return { tasks, invalid };
}
export function attachPlanTask(current: SetupForm, task: Task): SetupForm {
  const kind = task.kind;
  return {
    ...current,
    customTasks: [
      ...current.customTasks.filter((item) => item.id !== task.id),
      task,
    ],
    selectedMain:
      kind === "main"
        ? [...new Set([...current.selectedMain, task.id])]
        : current.selectedMain,
    selectedSide:
      kind === "side"
        ? [...new Set([...current.selectedSide, task.id])]
        : current.selectedSide,
    selectedSecret:
      kind === "secret"
        ? [...new Set([...current.selectedSecret, task.id])]
        : current.selectedSecret,
    sideChallenges: kind === "side" ? true : current.sideChallenges,
    secretMissions: kind === "secret" ? true : current.secretMissions,
  };
}
