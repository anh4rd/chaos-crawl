import type { CommunitySubmission } from "../../types/hostExplore";
import type { CatalogTab, CatalogTask, LocationIdea, RouteIdea } from "./types";

export function communityTasksFromSubmissions(
  submissions: CommunitySubmission[],
): CatalogTask[] {
  return submissions
    .filter(
      (submission) =>
        submission.item_type === "challenge" &&
        submission.status === "approved",
    )
    .map<CatalogTask>((submission) => ({
      id: `community-${submission.id}`,
      title: submission.title,
      description: submission.description,
      points: Number(submission.payload.points ?? 20),
      minutes: Number(submission.payload.minutes ?? 10),
      prepMinutes: Number(submission.payload.prepMinutes ?? 0) || undefined,
      performanceMinutes:
        Number(submission.payload.performanceMinutes ?? 0) || undefined,
      kind:
        submission.payload.kind === "side" ||
        submission.payload.kind === "secret"
          ? submission.payload.kind
          : "main",
      tags: Array.isArray(submission.payload.tags)
        ? submission.payload.tags.map(String)
        : ["community"],
      setup:
        submission.payload.setup === "basic" ||
        submission.payload.setup === "some"
          ? submission.payload.setup
          : "none",
    }));
}

export function categoriesForTab(tab: CatalogTab): string[] {
  if (tab === "tasks")
    return [
      "all",
      "main",
      "side",
      "secret",
      "quick",
      "team",
      "creative",
      "no prep",
    ];
  if (tab === "locations")
    return [
      "all",
      "one venue",
      "outdoors",
      "budget",
      "performance",
      "large groups",
    ];
  return [
    "all",
    "one venue",
    "budget",
    "outdoors",
    "photo",
    "finale",
    "quirky",
  ];
}

export function filterTasks(
  items: CatalogTask[],
  search: string,
  category: string,
) {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    const searchable = [item.title, item.description, item.kind, ...item.tags]
      .join(" ")
      .toLowerCase();
    const searchMatch = !q || searchable.includes(q);
    const categoryMatch =
      category === "all" ||
      category === item.kind ||
      item.tags.some((tag) => tag.toLowerCase().includes(category));
    return searchMatch && categoryMatch;
  });
}

export function filterLocations(
  items: LocationIdea[],
  search: string,
  category: string,
) {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    const searchable = [
      item.title,
      item.description,
      item.venueType,
      item.cost,
      ...item.bestFor,
      ...item.considerations,
    ]
      .join(" ")
      .toLowerCase();
    const searchMatch = !q || searchable.includes(q);
    const categoryMatch =
      category === "all" ||
      (category === "one venue" && item.oneVenue) ||
      (category === "outdoors" && item.bestFor.includes("outdoors")) ||
      (category === "budget" && ["Free", "Low"].includes(item.cost)) ||
      item.bestFor.some((tag) => tag.toLowerCase().includes(category));
    return searchMatch && categoryMatch;
  });
}

export function filterRoutes(
  items: RouteIdea[],
  search: string,
  category: string,
) {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    const searchable = [
      item.title,
      item.description,
      item.style,
      item.duration,
      item.budget,
      ...item.stops,
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase();
    const searchMatch = !q || searchable.includes(q);
    const categoryMatch =
      category === "all" ||
      (category === "one venue" && item.tags.includes("one venue")) ||
      (category === "budget" && item.budget === "Low") ||
      item.tags.some((tag) => tag.toLowerCase().includes(category));
    return searchMatch && categoryMatch;
  });
}
