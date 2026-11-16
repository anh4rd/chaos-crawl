import { useCallback, useEffect, useState } from "react";
import {
  PLAYER_SESSION_CHANGED_EVENT,
  readPlayerSession,
} from "../../lib/playerSession";

export function usePlayerSession() {
  const [session, setSession] = useState(readPlayerSession);
  const refresh = useCallback(() => setSession(readPlayerSession()), []);
  const reload = useCallback(async () => refresh(), [refresh]);
  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener(PLAYER_SESSION_CHANGED_EVENT, refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PLAYER_SESSION_CHANGED_EVENT, refresh);
    };
  }, [refresh]);
  return {
    ...session,
    error: session.status === "unavailable" ? session.error : null,
    reload,
  };
}
