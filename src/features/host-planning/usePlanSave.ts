import { useEffect, useRef, useState } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import { createHostPlan, updateHostPlan } from "../../lib/hostPlanApi";
import { createPlanWrite, validatePlan } from "./planModel";
import type { SetupForm } from "./types";
import type { ApiError } from "../../lib/apiResult";
export function usePlanSave({
  id,
  form,
  ownerId,
  navigate,
  setError,
  setNotice,
}: {
  id?: string;
  form: SetupForm;
  ownerId?: string | null;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const scope = useRef(0);
  useEffect(() => {
    busy.current = false;
    setSaving(false);
    return () => {
      scope.current += 1;
    };
  }, [id]);
  async function save(status: "draft" | "planned") {
    if (busy.current) return;
    const issue = status === "planned" ? validatePlan(form) : "";
    if (issue) {
      setError(issue);
      return;
    }
    const request = scope.current;
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data: auth } = await readHostIdentity();
      if (request !== scope.current) return;
      if (!auth.user) {
        setError("Your host session expired. Log in again.");
        return;
      }
      const payload = createPlanWrite(form, auth.user.id, status);
      let savedId = id;
      let saveError: ApiError | null = null;
      if (id) {
        if (!ownerId) {
          setError("Couldn't verify the owner of this game plan.");
          return;
        }
        const { host_id: _hostId, ...values } = payload;
        const { error } = await updateHostPlan({
          hostGameId: id,
          hostId: ownerId,
          values,
        });
        saveError = error;
      } else {
        const { data, error } = await createHostPlan(payload);
        if (error) saveError = error;
        else savedId = data?.id ? String(data.id) : undefined;
      }
      if (request !== scope.current) return;
      if (saveError || !savedId) {
        setError(saveError?.message ?? "Couldn't save the game plan.");
        return;
      }
      if (status === "draft") {
        setNotice("Draft saved.");
        if (!id) navigate(`/host/games/${savedId}/edit`, { replace: true });
      } else navigate("/host?created=1", { replace: true });
    } finally {
      if (request === scope.current) {
        busy.current = false;
        setSaving(false);
      }
    }
  }
  return { saving, save };
}
