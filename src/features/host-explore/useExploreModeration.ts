import { useEffect, useRef, useState } from "react";
import type { CommunitySubmission } from "../../types/hostExplore";
import type { ExploreActionFeedback } from "./types";
import { apiError } from "../../lib/apiResult";
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
  const [reviewingIds, setReviewingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const pending = useRef(new Set<string>());
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    const operations = pending.current;
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
      operations.clear();
    };
  }, []);
  async function deleteCommunityChallenge(submission: CommunitySubmission) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current() || pending.current.has(submission.id)) return;
    if (
      !isPlatformAdmin ||
      !window.confirm(
        `Delete “${submission.title}” from the shared challenge library?`,
      )
    )
      return;
    pending.current.add(submission.id);
    setReviewingIds(new Set(pending.current));
    onActionStart();
    try {
      const { error: deleteError } = await deleteApprovedCommunityChallenge({
        id: submission.id,
      });
      if (!current()) return;
      if (deleteError) {
        onActionError(deleteError.message);
        return;
      }
      await loadSubmissions();
    } catch (error) {
      if (current()) onActionError(apiError(error).message);
    } finally {
      if (current()) {
        pending.current.delete(submission.id);
        setReviewingIds(new Set(pending.current));
      }
    }
  }
  async function reviewSubmission(
    submission: CommunitySubmission,
    status: "approved" | "rejected",
  ) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current() || pending.current.has(submission.id)) return;
    pending.current.add(submission.id);
    setReviewingIds(new Set(pending.current));
    onActionStart();
    try {
      const { data: userData, error: userError } = await readHostIdentity();
      if (!current()) return;
      if (userError || !userData.user || !isPlatformAdmin) {
        onActionError("Only a platform administrator can review submissions.");
        return;
      }
      const { error: updateError } = await reviewPendingCommunitySubmission({
        id: submission.id,
        status,
        reviewedBy: userData.user.id,
        reviewedAt: new Date().toISOString(),
      });
      if (!current()) return;
      if (updateError) {
        onActionError(updateError.message);
        return;
      }
      await loadSubmissions();
    } catch (error) {
      if (current()) onActionError(apiError(error).message);
    } finally {
      if (current()) {
        pending.current.delete(submission.id);
        setReviewingIds(new Set(pending.current));
      }
    }
  }

  function isReviewing(id: string) {
    return reviewingIds.has(id);
  }

  return { isReviewing, deleteCommunityChallenge, reviewSubmission };
}
