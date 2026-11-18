export interface HostSavedItem {
  id: string;
  item_type: "task" | "venue" | "route";
  item_id: string;
  item_data: {
    title?: string;
    name?: string;
    description?: string;
    points?: number;
    venueType?: string;
    stops?: string[];
  };
}
