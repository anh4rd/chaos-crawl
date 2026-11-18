import type { ComponentPropsWithoutRef } from "react";

export default function TagList({
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div"> & { variant?: "idea" | "console" }) {
  return (
    <div
      {...props}
      className={`tag-list${variant ? ` tag-list--${variant}` : ""} ${className}`.trim()}
    />
  );
}
