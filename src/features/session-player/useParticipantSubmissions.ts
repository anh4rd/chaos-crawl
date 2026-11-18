import type { Dispatch, SetStateAction } from "react";
import { type ChangeEvent } from "react";
import {
  prepareSessionEvidence,
  uploadSessionEvidence,
} from "../../lib/sessionEvidence";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";
import type {
  ChallengeInfo,
  SecretMission,
  SecretReviewView,
  SessionEvidence,
  SessionView,
} from "./types";

interface Options {
  view: SessionView | null;
  token: string | null;
  code: string;
  setError: Dispatch<SetStateAction<string>>;
  secretReview: SecretReviewView | null;
  setBusyKey: Dispatch<SetStateAction<string | null>>;
  loadView: () => Promise<void>;
  evidenceForChallenge: (challengeId: string) => SessionEvidence[];
  evidenceForSecret: (assignmentId: string) => SessionEvidence[];
}
export function useParticipantSubmissions({
  view,
  token,
  code,
  setError,
  secretReview,
  setBusyKey,
  loadView,
  evidenceForChallenge,
  evidenceForSecret,
}: Options) {
  async function uploadEvidence(
    event: ChangeEvent<HTMLInputElement>,
    parent:
      | { type: "challenge"; challenge: ChallengeInfo }
      | { type: "secret"; mission: SecretMission },
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !view || !token || !code) return;

    const prepared = prepareSessionEvidence(file);
    if (prepared.error || !prepared.data) {
      setError(prepared.error?.message ?? "Choose a supported file.");
      return;
    }
    const parentKey =
      parent.type === "challenge"
        ? parent.challenge.id
        : parent.mission.assignment_id;
    if (
      parent.type === "challenge" &&
      parent.challenge.submission_status === "approved"
    ) {
      setError(
        "This challenge has already been approved, so no more evidence can be added.",
      );
      return;
    }
    if (parent.type === "secret") {
      const finalReview = secretReview?.my_final_reviews.find(
        (item) => item.assignment_id === parent.mission.assignment_id,
      );
      if (parent.mission.status === "approved" || finalReview) {
        setError(
          "This secret mission has a final result, so no more evidence can be added.",
        );
        return;
      }
    }

    setBusyKey(`upload:${parentKey}`);
    setError("");
    const result = await uploadSessionEvidence({
      file,
      sessionId: view.session.id,
      playerId: view.player.id,
      code,
      token,
      challengeId:
        parent.type === "challenge"
          ? parent.challenge.id
          : parent.mission.challenge_id,
      assignmentId:
        parent.type === "secret" ? parent.mission.assignment_id : null,
      metadata: prepared.data,
    });
    setBusyKey(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    await loadView();
  }

  async function submitChallenge(challenge: ChallengeInfo) {
    if (!token || !code) return;
    if (
      (challenge.kind === "side" || challenge.allow_photo_upload) &&
      evidenceForChallenge(challenge.id).length === 0
    ) {
      setError(
        "Upload at least one photo or video before marking this challenge complete.",
      );
      return;
    }
    setBusyKey(challenge.id);
    setError("");
    const { error: submitError } =
      await sessionParticipantCommands.playerSubmitSessionChallenge({
        p_join_code: code,
        p_player_token: token,
        p_challenge_id: challenge.id,
      });
    setBusyKey(null);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    await loadView();
  }

  async function submitSecretMission(mission: SecretMission) {
    if (!token || !code) return;
    if (
      secretReview?.my_final_reviews.some(
        (item) => item.assignment_id === mission.assignment_id,
      )
    ) {
      setError(
        "This secret mission has already received a final review result.",
      );
      return;
    }
    if (
      mission.allow_photo_upload &&
      evidenceForSecret(mission.assignment_id).length === 0
    ) {
      setError(
        "Upload at least one photo or video before submitting this secret mission.",
      );
      return;
    }
    setBusyKey(mission.assignment_id);
    setError("");
    const { error: submitError } =
      await sessionParticipantCommands.playerSubmitSecretMission({
        p_join_code: code,
        p_player_token: token,
        p_assignment_id: mission.assignment_id,
      });
    setBusyKey(null);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    await loadView();
  }
  return { uploadEvidence, submitChallenge, submitSecretMission };
}
