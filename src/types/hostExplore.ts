export interface CommunitySubmission {
  id: string;
  item_type: "challenge" | "venue";
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  submitted_by: string;
  review_note: string | null;
  created_at: string;
}

export interface HostFavourite {
  id: string;
  item_type: "task" | "venue" | "route";
  item_id: string;
  item_data: Record<string, unknown>;
}
