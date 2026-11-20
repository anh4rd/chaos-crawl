import { useEffect, useRef } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import {
  challengeIconAssetUrl,
  planCoverUrl,
  uploadChallengeIconAsset,
  uploadPlanCover,
} from "../../lib/hostPlanApi";
import type { UpdatePlan } from "./types";
export function usePlanPhoto({
  id,
  update,
  setChallengeArtUrl,
  setError,
  setNotice,
}: {
  id?: string;
  update: UpdatePlan;
  setChallengeArtUrl: (taskId: string, url: string) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const scope = useRef(0);
  const iconUploadRequests = useRef(new Map<string, number>());
  useEffect(
    () => () => {
      scope.current += 1;
      iconUploadRequests.current.clear();
    },
    [id],
  );
  async function uploadGamePhoto(file: File) {
    const request = scope.current;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Game images must be 8 MB or smaller.");
      return;
    }
    const { data: auth } = await readHostIdentity();
    if (request !== scope.current) return;
    if (!auth.user) {
      setError("Please log in again.");
      return;
    }
    const path = `${auth.user.id}/${id ?? `draft-${Date.now()}`}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: uploadError } = await uploadPlanCover(path, file);
    if (request !== scope.current) return;
    if (uploadError) {
      setError(
        `Photo upload failed: ${uploadError.message}. Create the game-assets storage bucket using the included migration.`,
      );
      return;
    }
    update("gamePhotoUrl", planCoverUrl(path));
    setNotice("Game photo uploaded.");
  }

  async function uploadChallengeIcon(taskId: string, file: File) {
    const request = scope.current;
    const iconRequest = (iconUploadRequests.current.get(taskId) ?? 0) + 1;
    iconUploadRequests.current.set(taskId, iconRequest);
    const isCurrent = () =>
      request === scope.current &&
      iconUploadRequests.current.get(taskId) === iconRequest;
    setError("");
    setNotice("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Challenge icons must be 8 MB or smaller.");
      return;
    }
    const { data: auth } = await readHostIdentity();
    if (!isCurrent()) return;
    if (!auth.user) {
      setError("Please log in again.");
      return;
    }
    const safeTaskId = taskId.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${auth.user.id}/${id ?? `draft-${Date.now()}`}/challenge-icons/${safeTaskId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: uploadError } = await uploadChallengeIconAsset(path, file);
    if (!isCurrent()) return;
    if (uploadError) {
      setError(
        `Challenge icon upload failed: ${uploadError.message}. Apply the challenge-icons Supabase migration and try again.`,
      );
      return;
    }
    setChallengeArtUrl(taskId, challengeIconAssetUrl(path));
    setNotice("Challenge icon uploaded.");
  }

  return { uploadGamePhoto, uploadChallengeIcon };
}
