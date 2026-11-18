import type { HTMLAttributes } from "react";

export default function ContentCopy({
  variant,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant: "console" | "console-list" }) {
  return (
    <div
      {...props}
      className={`content-copy content-copy--console${variant === "console-list" ? " content-copy--console-list" : ""} ${className}`.trim()}
    />
  );
}
