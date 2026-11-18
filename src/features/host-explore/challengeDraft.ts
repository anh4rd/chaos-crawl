import type {
  CommunityChallengePayload,
  CommunitySubmission,
} from "../../types/hostExplore";
import type { ChallengeDraft } from "./types";

export function createChallengeDraft(): ChallengeDraft {
  return {
    title: "",
    description: "",
    kind: "main",
    points: 20,
    minutes: 10,
    prepMinutes: 0,
    performanceMinutes: 0,
    tags: ["creative", "team"],
    setup: "none",
  };
}

export function draftFromSubmission(
  submission: CommunitySubmission,
): ChallengeDraft {
  return {
    title: submission.title,
    description: submission.description,
    kind:
      submission.payload.kind === "side" || submission.payload.kind === "secret"
        ? submission.payload.kind
        : "main",
    points: Number(submission.payload.points ?? 20),
    minutes: Number(submission.payload.minutes ?? 10),
    prepMinutes: Number(submission.payload.prepMinutes ?? 0),
    performanceMinutes: Number(submission.payload.performanceMinutes ?? 0),
    tags: Array.isArray(submission.payload.tags)
      ? submission.payload.tags.map(String).slice(0, 8)
      : ["creative", "team"],
    setup:
      submission.payload.setup === "basic" ||
      submission.payload.setup === "some"
        ? submission.payload.setup
        : "none",
  };
}

export function challengePayload(
  draft: ChallengeDraft,
): CommunityChallengePayload {
  return {
    kind: draft.kind,
    points: Math.max(0, Math.min(100, Number(draft.points) || 0)),
    minutes: Math.max(1, Math.min(180, Number(draft.minutes) || 1)),
    prepMinutes: Math.max(0, Math.min(180, Number(draft.prepMinutes) || 0)),
    performanceMinutes: Math.max(
      0,
      Math.min(180, Number(draft.performanceMinutes) || 0),
    ),
    tags: draft.tags.slice(0, 8),
    setup: draft.setup,
  };
}
