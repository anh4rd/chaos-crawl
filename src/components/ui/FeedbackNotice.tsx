import type { HTMLAttributes } from "react";

export default function FeedbackNotice({
  tone,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone: "error" | "success" }) {
  return (
    <div
      {...props}
      className={`feedback-notice feedback-notice--${tone} ${className}`.trim()}
    />
  );
}
