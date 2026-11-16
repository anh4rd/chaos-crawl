import { completeChallenge } from "./completionApi";
import { uploadMedia } from "./mediaApi";
import type { ChallengeType, Player } from "../types/database";

export interface UploadChallenge {
  id: string | number;
  title: string;
  points: number;
  type: ChallengeType;
}
export interface ChallengeSubmission {
  challenge: UploadChallenge;
  player: Player;
  pub: string;
}

/** Upload first, then record completion. The phase notification lets the UI
 * become optimistic only after an optional upload has succeeded.
 */
export async function submitChallenge(
  { player, challenge, pub }: ChallengeSubmission,
  file: File | undefined,
  onCompleting: () => void,
): Promise<void> {
  let photoId: string | number | null = null;
  if (file) {
    const { data, error } = await uploadMedia(file, {
      playerId: player.id,
      playerName: player.name,
      team: player.team,
      challenge: challenge.title,
      pub,
      points: challenge.points,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    if (!data) throw new Error("Upload returned no media. Please try again.");
    photoId = data.id;
  }
  onCompleting();
  try {
    const { error } = await completeChallenge({
      playerId: player.id,
      challengeType: challenge.type,
      challengeId: challenge.id,
      points: challenge.points,
      photoId,
    });
    if (error && error.code !== "ALREADY_COMPLETED")
      throw new Error(error.message);
  } catch (failure) {
    if (!file) throw failure;
    const message =
      failure instanceof Error
        ? failure.message
        : "Could not save challenge. Please try again.";
    throw new Error(
      `Media uploaded, but challenge completion failed: ${message}`,
    );
  }
}
