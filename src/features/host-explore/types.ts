import type { CommunityChallengePayload } from "../../types/hostExplore";

export type CatalogTab = "tasks" | "locations" | "routes";
export type TaskKind = CommunityChallengePayload["kind"];
export interface CatalogTask {
  id: string;
  title: string;
  description: string;
  points: number;
  minutes: number;
  prepMinutes?: number;
  performanceMinutes?: number;
  kind: TaskKind;
  tags: string[];
  setup: CommunityChallengePayload["setup"];
}

export interface LocationIdea {
  id: string;
  title: string;
  description: string;
  venueType: string;
  cost: "Free" | "Low" | "Medium" | "Higher";
  bestFor: string[];
  considerations: string[];
  oneVenue: boolean;
}

export interface RouteIdea {
  id: string;
  title: string;
  description: string;
  style: string;
  duration: string;
  budget: "Low" | "Medium" | "Higher" | "Venue-dependent";
  stops: string[];
  tags: string[];
  note: string;
}

export interface ChallengeDraft {
  title: string;
  description: string;
  kind: TaskKind;
  points: number;
  minutes: number;
  prepMinutes: number;
  performanceMinutes: number;
  tags: string[];
  setup: CatalogTask["setup"];
}
