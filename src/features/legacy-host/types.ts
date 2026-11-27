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
  entries: Array<{
    id: string;
    name: string;
    score: number;
    avatarUrl?: string | null;
  }>;
  onTargetChange: (target: ScoreTarget) => void;
}

export interface ScoreDisplayControlsModel {
  showVoteResults: boolean;
  onOpenSlideshow: () => void;
  onReturnToGame: () => void;
}

export type HostTab = "live" | "challenges" | "scores" | "players";
export interface ChallengePreviewModel {
  title: string;
  description: string | null;
  points: number;
}
export interface RoundProgressModel {
  roundLabel: string;
  revealedCount: number;
  totalCount: number;
  progressPercent: number;
}
export interface CurrentChallengeModel {
  currentChallenge: ChallengePreviewModel | null;
  submissionCount: number;
  onReview: () => void;
}
export interface UpcomingChallengeModel {
  scheduledChallenge: ChallengePreviewModel | null;
  nextChallenge: ChallengePreviewModel | null;
  scheduledTime: string | null;
  busy: boolean;
  revealingNext: boolean;
  scheduleMinutes: string;
  onRevealNext: () => void;
  onCancelSchedule: () => void;
  onScheduleMinutesChange: (value: string) => void;
  onScheduleNext: () => void;
}
export interface LiveControlsModel {
  votingOpen: boolean;
  showResults: boolean;
  slideshowOpen: boolean;
  voteTarget: ScoreTarget;
  canOpenVoting: boolean;
  onCloseVoting: () => void;
  onViewResults: () => void;
  onReturnToGame: () => void;
  onVoteTargetChange: (value: ScoreTarget) => void;
  onOpenVoting: () => void;
  onToggleSlideshow: () => void;
}
export interface TeamPanelModel {
  teamCount: number;
  names: string[];
  loading: boolean;
  draft: string;
  creating: boolean;
  canCreate: boolean;
  onDraftChange: (value: string) => void;
  onCreate: () => void;
}
export interface PlayerRowModel {
  id: string;
  name: string;
  initial: string;
  avatarUrl?: string | null;
  team: string;
  onRename: (value: string) => void;
  onAssignTeam: (value: string) => void;
  onRemove: () => void;
}
export interface PlayerRosterModel {
  players: PlayerRowModel[];
  teams: string[];
  draft: string;
  creating: boolean;
  canCreate: boolean;
  onDraftChange: (value: string) => void;
  onCreate: () => void;
}
