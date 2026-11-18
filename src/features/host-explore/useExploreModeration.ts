import { useEffect, useRef, useState } from "react";
import type { CommunitySubmission } from "../../types/hostExplore";
import type { ExploreActionFeedback } from "./types";
import { readHostIdentity } from "../../lib/hostAuth";
import {
  deleteApprovedCommunityChallenge,
  reviewPendingCommunitySubmission,
} from "../../lib/hostExploreCommands";

export function useExploreModeration({
  isPlatformAdmin,
  onActionStart,
  onActionError,
  loadSubmissions,
}: ExploreActionFeedback & {
  isPlatformAdmin: boolean;
  loadSubmissions: () => Promise<void>;
}) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function deleteCommunityChallenge(submission: CommunitySubmission) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    if (
      !isPlatformAdmin ||
      !window.confirm(
        `Delete “${submission.title}” from the shared challenge library?`,
      )
    )
      return;
    setReviewingId(submission.id);
    onActionStart();
    const { error: deleteError } = await deleteApprovedCommunityChallenge({
      id: submission.id,
    });
    if (!current()) return;
    setReviewingId(null);
    if (deleteError) {
      onActionError(deleteError.message);
      return;
    }
    await loadSubmissions();
  }
  async function reviewSubmission(
    submission: CommunitySubmission,
    status: "approved" | "rejected",
  ) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    setReviewingId(submission.id);
    onActionStart();
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user || !isPlatformAdmin) {
      onActionError("Only a platform administrator can review submissions.");
      setReviewingId(null);
      return;
    }
    const { error: updateError } = await reviewPendingCommunitySubmission({
      id: submission.id,
      status,
      reviewedBy: userData.user.id,
      reviewedAt: new Date().toISOString(),
    });
    if (!current()) return;
    setReviewingId(null);
    if (updateError) {
      onActionError(updateError.message);
      return;
    }
    await loadSubmissions();
  }

  return { reviewingId, deleteCommunityChallenge, reviewSubmission };
}
