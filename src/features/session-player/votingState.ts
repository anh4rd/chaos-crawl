import type { FinalGalleryView, SecretReviewView, SessionInfo } from "./types";

// Contradictory voting signals must keep unpublished results private.
export function isFinalVotingOpen(
  gallery: Pick<FinalGalleryView, "voting_open" | "challenge_status"> | null,
  session?: Pick<SessionInfo, "final_voting_open"> | null,
) {
  return Boolean(
    session?.final_voting_open ||
    gallery?.voting_open ||
    gallery?.challenge_status === "voting",
  );
}

export function isSecretVotingOpen(
  review: Pick<SecretReviewView, "voting_open" | "mission"> | null,
) {
  return Boolean(review?.voting_open || review?.mission?.status === "voting");
}
