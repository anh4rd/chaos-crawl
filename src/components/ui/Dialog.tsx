import type { ReactNode } from "react";
import { useModalDialog } from "./useModalDialog";

export default function Dialog({
  label,
  className = "",
  onClose,
  children,
}: {
  label: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useModalDialog();

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-label={label}
      className={`dialog ${className}`.trim()}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
      <button
        type="button"
        tabIndex={-1}
        className="dialog__backdrop"
        aria-label={`Close ${label}`}
        onClick={onClose}
      />
    </dialog>
  );
}
