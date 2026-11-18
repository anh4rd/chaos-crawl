import { useLayoutEffect, useRef } from "react";

export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const controls = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]",
        ),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          element.getClientRects().length > 0,
      );
    // Chromium may initially focus a scrollable form instead of its first control.
    controls()[0]?.focus({ preventScroll: true });
    // Keep Tab inside even when the only control would otherwise hand focus to browser chrome.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const available = controls();
      const first = available[0];
      const last = available.at(-1);
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.close();
    };
  }, []);
  return ref;
}
