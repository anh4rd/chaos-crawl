import { useCallback, useRef, useState } from "react";

export type SetHostBusy = (busy: boolean) => boolean;

export function useHostOperation() {
  const locked = useRef(false);
  const [busy, updateBusy] = useState(false);
  const setBusy = useCallback<SetHostBusy>((next) => {
    if (next && locked.current) return false;
    locked.current = next;
    updateBusy(next);
    return true;
  }, []);
  return { busy, setBusy };
}
