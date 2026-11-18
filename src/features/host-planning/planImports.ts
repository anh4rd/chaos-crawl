import type { Task, TaskKind, SetupForm } from "./types";
import type { CommunityPlanTask } from "../../types/hostPlanning";
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
    evidenceRequired: kind === "side",
    tags: Array.isArray(payload.tags)
      ? payload.tags.map(String)
      : ["Community"],
  };
}
export function explorePlanTask(json: string, kind: TaskKind): Task {
  const idea: unknown = JSON.parse(json);
  if (!isExploreIdea(idea)) throw new Error("Invalid Explore challenge.");
  return {
    id: `explore-${idea.id}`,
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
    evidenceRequired: kind === "side",
    tags: idea.tags ?? [],
  };
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
    sideChallenges: kind === "side" ? true : current.sideChallenges,
  };
}
