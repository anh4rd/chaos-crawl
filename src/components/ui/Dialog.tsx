import { useLayoutEffect, type ReactNode } from "react";
import { useModalDialog } from "./useModalDialog";

export default function Dialog({
  label,
  className = "",
  onClose,
  children,
  labelledBy,
  describedBy,
  role,
  variant,
  dismissDisabled = false,
}: {
  label: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  variant?: "host" | "reveal";
  dismissDisabled?: boolean;
}) {
  const ref = useModalDialog();
  useLayoutEffect(() => {
    const dialog = ref.current;
    // Disabling the focused save control can otherwise hand focus to the inert page.
    if (dismissDisabled && dialog && !dialog.contains(document.activeElement))
      dialog.focus({ preventScroll: true });
  }, [dismissDisabled, ref]);

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      role={role}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={labelledBy ? undefined : label}
      className={`dialog${variant ? ` dialog--${variant}` : ""} ${className}`.trim()}
      onCancel={(event) => {
        event.preventDefault();
        if (!dismissDisabled) onClose();
      }}
    >
      {children}
      <button
        type="button"
        tabIndex={-1}
        className="dialog__backdrop"
        aria-label={`Close ${label}`}
        disabled={dismissDisabled}
        onClick={onClose}
      />
    </dialog>
  );
}
