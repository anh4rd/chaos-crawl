import { useEffect, useRef } from "react";

export function useNavigationFocus() {
  const navigationRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  function restoreFocus() {
    if (!navigationRef.current) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    // A refreshed view can remove the dialog opener during the next commit.
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        active !== document.documentElement
      )
        return;
      navigationRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.focus();
    });
  }
  return { navigationRef, restoreFocus };
}
