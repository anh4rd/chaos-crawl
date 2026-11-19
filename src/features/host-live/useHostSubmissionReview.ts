import type { Dispatch, SetStateAction } from "react";
import * as hostSubmissionCommands from "../../lib/hostSubmissionCommands";
import type { SessionChallenge, SessionSubmission } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  challenges: SessionChallenge[];
  setError: Dispatch<SetStateAction<string>>;
  setBusy: SetHostBusy;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
}
export function useHostSubmissionReview({
  challenges,
  setError,
  setBusy,
  setNotice,
  load,
}: Options) {
  async function reviewSubmission(
    submission: SessionSubmission,
    approve: boolean,
  ) {
    const challenge = challenges.find(
      (item) => item.id === submission.challenge_id,
    );
    if (challenge?.kind === "side") {
      setError("Side-challenge submissions are approved automatically.");
      return;
    }
    const suggested = Number(challenge?.points ?? 0);
    const points = approve
      ? Number(
          window.prompt(
            `Points to award (suggested: ${suggested})`,
            String(suggested),
          ) ?? "-1",
        )
      : 0;
    if (approve && (!Number.isFinite(points) || points < 0)) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: reviewError } =
      await hostSubmissionCommands.hostReviewSessionSubmission({
        p_submission_id: submission.id,
        p_approve: approve,
        p_points: points,
      });
    setBusy(false);
    if (reviewError) {
      setError(reviewError.message);
      return;
    }
    setNotice(
      !approve
        ? "Submission rejected."
        : `Approved submission for ${points} points.`,
    );
    await load();
  }
  return { reviewSubmission };
}
