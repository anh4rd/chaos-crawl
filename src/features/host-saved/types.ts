import type { HostSavedItem } from "../../types/hostSaved";
export type HostSavedFilter = "all" | HostSavedItem["item_type"];
export interface SavedItemsModel {
  itemsCount: number;
  visible: HostSavedItem[];
  loading: boolean;
  error: string;
  filter: HostSavedFilter;
  onFilterChange: (filter: HostSavedFilter) => void;
  onRemove: (item: HostSavedItem) => void;
}
