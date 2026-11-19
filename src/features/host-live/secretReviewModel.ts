import type {
  GameSession,
  SecretMissionAssignment,
  SecretReviewAssignment,
  SecretReviewState,
  SecretReviewVote,
  SessionChallenge,
  SessionEvidence,
} from "./types";

interface Options {
  secretAssignments: SecretMissionAssignment[];
  secretReviewAssignments: SecretReviewAssignment[];
  secretReviewState: SecretReviewState | null;
  challenges: SessionChallenge[];
  evidence: SessionEvidence[];
  secretReviewVotes: SecretReviewVote[];
  session: GameSession | null;
}
export function buildSecretReviewModel({
  secretAssignments,
  secretReviewAssignments,
  secretReviewState,
  challenges,
  evidence,
  secretReviewVotes,
  session,
}: Options) {
  const secretReviewOptions = secretAssignments.filter(
    (assignment) =>
      assignment.status === "submitted" ||
      secretReviewAssignments.some(
        (review) =>
          review.assignment_id === assignment.id &&
          (review.status === "results" || review.status === "voting"),
      ),
  );

  const hasPendingSecretReviews = secretReviewOptions.some(
    (assignment) =>
      !secretReviewAssignments.some(
        (review) =>
          review.assignment_id === assignment.id && review.status === "results",
      ),
  );

  const selectedSecretReviewAssignmentId =
    secretReviewState?.current_assignment_id ??
    secretReviewOptions.find(
      (assignment) =>
        !secretReviewAssignments.some(
          (review) =>
            review.assignment_id === assignment.id &&
            review.status === "results",
        ),
    )?.id ??
    secretReviewOptions[0]?.id ??
    "";

  const selectedSecretReviewAssignment = secretAssignments.find(
    (assignment) => assignment.id === selectedSecretReviewAssignmentId,
  );

  const selectedSecretReview = secretReviewAssignments.find(
    (review) => review.assignment_id === selectedSecretReviewAssignmentId,
  );

  const secretReviewVotingOpen = Boolean(
    secretReviewState?.voting_open || selectedSecretReview?.status === "voting",
  );

  const selectedSecretReviewChallenge = selectedSecretReviewAssignment
    ? challenges.find(
        (challenge) =>
          challenge.id === selectedSecretReviewAssignment.challenge_id,
      )
    : undefined;

  const selectedSecretReviewEvidence = evidence.filter(
    (item) => item.secret_assignment_id === selectedSecretReviewAssignmentId,
  );

  const currentSecretReviewEvidenceId = secretReviewState?.current_evidence_id;

  const currentSecretReviewEvidenceIndex =
    selectedSecretReviewEvidence.findIndex(
      (item) => item.id === currentSecretReviewEvidenceId,
    );

  const currentSecretReviewVoteCount = selectedSecretReviewAssignmentId
    ? secretReviewVotes.filter(
        (vote) => vote.assignment_id === selectedSecretReviewAssignmentId,
      ).length
    : 0;

  const hostSecretReviewVote = session?.host_player_id
    ? secretReviewVotes.find(
        (vote) =>
          vote.assignment_id === selectedSecretReviewAssignmentId &&
          vote.player_id === session.host_player_id,
      )
    : undefined;
  return {
    secretReviewOptions,
    hasPendingSecretReviews,
    selectedSecretReviewAssignmentId,
    selectedSecretReviewAssignment,
    selectedSecretReview,
    secretReviewVotingOpen,
    selectedSecretReviewChallenge,
    selectedSecretReviewEvidence,
    currentSecretReviewEvidenceIndex,
    currentSecretReviewVoteCount,
    hostSecretReviewVote,
  };
}
