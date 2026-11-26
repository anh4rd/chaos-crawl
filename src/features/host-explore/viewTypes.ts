import type { FormEvent, ReactNode } from "react";
import type {
  CatalogTab,
  CatalogTask,
  ChallengeDraft,
  LocationIdea,
  RouteIdea,
} from "./types";

export interface TaskCardModel {
  task: CatalogTask;
  saved: boolean;
  busy: boolean;
  onToggleSaved: () => void;
  onAdd: (kind: CatalogTask["kind"]) => void;
  adminActions?: { busy: boolean; onEdit: () => void; onDelete: () => void };
}
export interface LocationCardModel {
  location: LocationIdea;
  saved: boolean;
  busy: boolean;
  onToggleSaved: () => void;
  onUse: () => void;
}
export interface RouteCardModel {
  route: RouteIdea;
  saved: boolean;
  busy: boolean;
  expanded: boolean;
  onToggleSaved: () => void;
  onToggleExpanded: () => void;
}
export interface ReviewItemModel {
  id: string;
  itemType: string;
  title: string;
  description: string;
  details?: { kind: string; minutes: string; points: string };
  submittedDate: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}
export interface SubmissionHistoryItem {
  id: string;
  title: string;
  itemType: string;
  submittedDate: string;
  reviewNote: string | null;
  status: "pending" | "approved" | "rejected";
}
export interface CatalogueFiltersModel {
  tab: CatalogTab;
  counts: { tasks: number; locations: number; routes: number };
  search: string;
  category: string;
  categories: string[];
  onTabChange: (tab: CatalogTab) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}
export interface ContributionFormModel {
  draft: ChallengeDraft;
  editing: boolean;
  busy: boolean;
  onDraftChange: (change: Partial<ChallengeDraft>) => void;
  onToggleTag: (tag: string, selected: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
export interface CatalogueViewModel {
  filters: CatalogueFiltersModel;
  tasks: TaskCardModel[];
  locations: LocationCardModel[];
  routes: RouteCardModel[];
  reviewItems: ReviewItemModel[];
  historyItems: SubmissionHistoryItem[];
  itemCount: number;
  loadingFavourites: boolean;
  error: string;
  onCreate: () => void;
  onClearFilters: () => void;
  dialog?: ReactNode;
}
