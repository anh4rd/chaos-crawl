import type { SecretMissionAssignment } from "./types";

export function secretAssignmentStatus(
  assignment: SecretMissionAssignment,
  voting: boolean,
) {
  if (voting) return "Voting in progress";
  if (assignment.status === "scheduled")
    return `Scheduled · ${new Date(assignment.scheduled_at).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}`;
  if (assignment.status === "sent") return "Sent to player";
  if (assignment.status === "submitted") return "Needs review";
  if (assignment.final_review_outcome === "success")
    return `Success · +${assignment.awarded_points} pts`;
  if (assignment.final_review_outcome === "fail")
    return "Fail · final · no points";
  if (assignment.status === "approved")
    return `Approved · +${assignment.awarded_points} pts`;
  if (assignment.status === "rejected") return "Rejected";
  return "Cancelled";
}
