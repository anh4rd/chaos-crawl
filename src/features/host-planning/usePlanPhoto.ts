import { useEffect, useRef } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import { uploadPlanCover, planCoverUrl } from "../../lib/hostPlanApi";
import type { UpdatePlan } from "./types";
export function usePlanPhoto({
  id,
  update,
  setError,
  setNotice,
}: {
  id?: string;
  update: UpdatePlan;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const scope = useRef(0);
  useEffect(
    () => () => {
      scope.current += 1;
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

  return { uploadGamePhoto };
}
