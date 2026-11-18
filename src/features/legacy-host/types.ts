export interface ChallengeListItemModel {
  id: number;
  title: string;
  description: string | null;
  points: number;
  current: boolean;
  scheduled: boolean;
  past: boolean;
  onReveal: () => void;
  onSchedule: () => void;
}

export interface ChallengeRoundModel {
  id: string;
  label: string;
  challenges: ChallengeListItemModel[];
}

export interface SideChallengeItemModel {
  id: number;
  title: string;
  description: string;
  points: number;
  completionCount: number;
  onReview: () => void;
}

export type ScoreTarget = "player" | "team";
export type ScoreAction = "award" | "dock";

export interface ScoreAdjustmentModel {
  target: ScoreTarget;
  action: ScoreAction;
  players: Array<{ id: string; name: string }>;
  teams: string[];
  selectedPlayerId: string;
  selectedTeamName: string;
  points: string;
  reason: string;
  onTargetChange: (target: ScoreTarget) => void;
  onActionChange: (action: ScoreAction) => void;
  onPlayerChange: (id: string) => void;
  onTeamChange: (name: string) => void;
  onPointsChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export interface ScoreLeaderboardModel {
  target: ScoreTarget;
  loading: boolean;
  entries: Array<{ id: string; name: string; score: number }>;
  onTargetChange: (target: ScoreTarget) => void;
}

export interface ScoreDisplayControlsModel {
  showVoteResults: boolean;
  onOpenSlideshow: () => void;
  onReturnToGame: () => void;
}
