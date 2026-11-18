import type { CatalogTask, LocationIdea, RouteIdea } from "./types";

export function favouriteData(
  item: CatalogTask | LocationIdea | RouteIdea,
): Record<string, unknown> {
  return { ...item };
}
