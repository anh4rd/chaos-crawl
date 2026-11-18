import type { ReactNode } from "react";
import IconButton from "./IconButton";

export default function DialogNotice({
  children,
  kind,
  onDismiss,
}: {
  children: ReactNode;
  kind: "warning" | "error";
  onDismiss?: () => void;
}) {
  const Container = onDismiss ? "div" : "p";
  return (
    <Container
      className={`dialog-notice dialog-notice--${kind}${onDismiss ? " dialog-notice--dismissible" : ""}`}
      role={onDismiss ? "alert" : undefined}
    >
      {onDismiss ? (
        <>
          <span className="dialog-notice__message">{children}</span>
          <IconButton
            type="button"
            variant="dialog-dismiss"
            icon="x"
            iconClassName="icon--size-16"
            label="Dismiss error"
            onClick={onDismiss}
          />
        </>
      ) : (
        children
      )}
    </Container>
  );
}
