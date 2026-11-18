import type { ReactNode } from "react";
export default function StatusPill({
  tone,
  variant,
  children,
}: { children: ReactNode } & (
  | { variant: "review"; tone: "submitted" | "approved" | "rejected" }
  | { variant: "history"; tone: "pending" | "approved" | "rejected" }
  | { variant: "reward"; tone: "open" | "completed" }
  | { variant?: undefined; tone: "planned" | "draft" | "live" | "completed" }
)) {
  return (
    <span
      className={`status-pill status-pill--${tone}${variant ? ` status-pill--${variant}` : ""}`}
    >
      {children}
    </span>
  );
}
