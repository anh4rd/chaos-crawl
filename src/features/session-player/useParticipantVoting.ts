import type { Dispatch, SetStateAction } from "react";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";
import type {
  FinalGalleryItem,
  PlayerRewardRound,
  SecretReviewView,
} from "./types";

interface Options {
  rewardRound: PlayerRewardRound | null;
  token: string | null;
  code: string;
  busyKey: string | null;
  setBusyKey: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string>>;
  loadView: () => Promise<void>;
  secretReview: SecretReviewView | null;
}
export function useParticipantVoting({
  rewardRound,
  token,
  code,
  busyKey,
  setBusyKey,
  setError,
  loadView,
  secretReview,
}: Options) {
  async function voteInRewardRound(candidateId: string) {
    if (
      !rewardRound ||
      !token ||
      !code ||
      busyKey !== null ||
      rewardRound.status !== "open"
    )
      return;
    setBusyKey("reward-vote");
    setError("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSessionRewardVote({
        p_join_code: code,
        p_player_token: token,
        p_reward_round_id: rewardRound.id,
        p_target_player_id:
          rewardRound.target_kind === "player" ? candidateId : null,
        p_target_team_id:
          rewardRound.target_kind === "team" ? candidateId : null,
      });
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }

  async function voteForFinalMedia(item: FinalGalleryItem) {
    if (!token || !code) return;
    setBusyKey(`vote:${item.id}`);
    setError("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSessionFinalRoundVote({
        p_join_code: code,
        p_player_token: token,
        p_evidence_id: item.id,
      });
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }

  async function voteOnSecretReview(vote: "success" | "fail") {
    if (
      !token ||
      !code ||
      !secretReview?.assignment_id ||
      !secretReview.voting_open
    )
      return;
    setBusyKey("secret-review-vote");
    setError("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSecretReviewVote({
        p_join_code: code,
        p_player_token: token,
        p_assignment_id: secretReview.assignment_id,
        p_vote: vote,
      });
    setBusyKey(null);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    await loadView();
  }
  return { voteInRewardRound, voteForFinalMedia, voteOnSecretReview };
}
