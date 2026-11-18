import type { ReactNode } from "react";
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
  variant?: "host" | "reveal" | "contribution";
  dismissDisabled?: boolean;
}) {
  const ref = useModalDialog();

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
