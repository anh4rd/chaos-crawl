import { useEffect, useState } from "react";
import type { ApiResult } from "../../lib/apiResult";
import type { SessionSlideshowView } from "../../types/sessionSlideshow";

export function useSlideshowData<View extends SessionSlideshowView>({
  sessionId,
  load,
  onView,
  failurePrefix,
}: {
  sessionId: string;
  load: (id: string) => Promise<ApiResult<View>>;
  onView: (view: View | null) => void;
  failurePrefix: string;
}) {
  const [error, setError] = useState("");
  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let requestId = 0;
    let latestAppliedRequestId = 0;
    const refresh = async () => {
      const currentRequestId = ++requestId;
      const { data, error: loadError } = await load(sessionId);
      if (!active || currentRequestId < latestAppliedRequestId) return;
      latestAppliedRequestId = currentRequestId;
      if (loadError) {
        setError(`${failurePrefix}${loadError.message}`);
        return;
      }
      if (data) setError("");
      onView(data);
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 1500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [sessionId, load, onView, failurePrefix]);
  return { error, setError };
}
