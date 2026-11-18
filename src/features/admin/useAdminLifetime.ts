import { useCallback, useEffect, useRef } from "react";

export function useAdminLifetime(scope?: string) {
  const lifetime = useRef({ mounted: false, generation: 0, scope });
  if (lifetime.current.scope !== scope) {
    lifetime.current = {
      mounted: false,
      generation: lifetime.current.generation + 1,
      scope,
    };
  }
  useEffect(() => {
    lifetime.current.mounted = true;
    lifetime.current.generation += 1;
    return () => {
      lifetime.current.mounted = false;
    };
  }, [scope]);
  return useCallback(() => {
    const generation = lifetime.current.generation;
    return () =>
      lifetime.current.mounted && lifetime.current.generation === generation;
  }, []);
}
