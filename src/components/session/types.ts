export type SessionRole = "player" | "host";
export type SessionSection =
  "game" | "leaderboard" | "side-challenges" | "final" | "host-controls";

export interface SessionProfile {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  score: number;
  rank: number | null;
  badge?: string;
}

export interface SessionGame {
  tourTarget?: string;
  name: string;
  code: string;
  photoUrl?: string | null;
  copied?: boolean;
  onCopy: () => void;
}

export interface RankedParticipant {
  id: string;
  name: string;
  score: number;
  avatarUrl?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  detail?: string;
}

export interface EvidencePresentation {
  id: string;
  url: string;
  mediaType: "image" | "video";
  description: string;
}

export interface SessionMemoryItem {
  id: string;
  title: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  storagePath: string;
  submittedAt: string;
  submittedBy?: string;
}

export interface VotingEntry {
  id: string;
  participant: { name: string; avatarUrl?: string | null };
  challengeTitle: string;
  media: EvidencePresentation;
  selected: boolean;
  winner: boolean;
  voteCount: number | null;
  voters?: { id: string; name: string; avatarUrl?: string | null }[];
}

export interface RewardPresentation {
  title: string;
  method: "voting" | "host_awards" | "audience_cheers";
  target: "player" | "team";
  points: number;
  completed: boolean;
  votesCast: number;
  selectedId?: string | null;
  candidates: { id: string; name: string; detail: string }[];
  winners: { id: string; name: string; points: number; votes: number }[];
  leaderboard: RankedParticipant[];
}
