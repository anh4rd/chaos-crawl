import { useEffect } from "react";
import { useHostOperation } from "../host-live/useHostOperation";
import { useAdminLifetime } from "./useAdminLifetime";

export function useAdminOperation(scope?: string) {
  const captureLifetime = useAdminLifetime(scope);
  const { setBusy } = useHostOperation();
  useEffect(() => {
    setBusy(false);
    return () => {
      setBusy(false);
    };
  }, [scope, setBusy]);
  async function run(
    operation: (current: () => boolean) => Promise<void>,
    onFailure: (cause: unknown) => void,
  ) {
    const current = captureLifetime();
    if (!current() || !setBusy(true)) return;
    try {
      await operation(current);
    } catch (cause) {
      if (current()) onFailure(cause);
    } finally {
      if (current()) setBusy(false);
    }
  }
  return run;
}
