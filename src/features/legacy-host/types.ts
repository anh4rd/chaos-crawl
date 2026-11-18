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
