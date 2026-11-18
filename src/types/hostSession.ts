export type RewardMethod = "voting" | "host_awards" | "audience_cheers";

export type RewardTargetKind = "player" | "team";

export interface PlannedTaskInfo {
  id?: string;
  title?: string;
  equipment?: string[];
  setup?: string;
  prep?: string;
}
