import { useCallback, useEffect, useRef, useState } from "react";
import {
  readLegacyHostTeams,
  subscribeLegacyHostTeams,
} from "../../lib/legacyHostQueries";
import { apiError } from "../../lib/apiResult";
import type { LegacyHostTeam } from "../../types/legacyHost";

export function useLegacyTeams() {
  const [data, setData] = useState<LegacyHostTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(
    null,
  );
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const request = useRef(0);
  const reload = useCallback(async () => {
    if (!mounted.current) return;
    const generation = lifetime.current;
    const read = ++request.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      request.current === read;
    setLoading(true);
    try {
      const { data, error } = await readLegacyHostTeams();
      if (!current()) return;
      if (error) {
        console.error("Could not load teams", error);
        setError(new Error(error.message));
        return;
      }
      setData(data ?? []);
      setError(null);
    } catch (cause) {
      if (!current()) return;
      console.error("Could not load teams", cause);
      setError(new Error(apiError(cause).message));
    } finally {
      if (current()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    void reload();
    setSubscriptionError(null);
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeLegacyHostTeams(() => {
        void reload();
      });
    } catch (cause) {
      console.error("Could not subscribe to teams", cause);
      setSubscriptionError(new Error(apiError(cause).message));
    }
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [reload]);
  return { data, loading, error: subscriptionError ?? error, reload };
}
