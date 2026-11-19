import type { ComponentPropsWithoutRef } from "react";

export default function DialogActions({
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div"> & { variant?: "contribution" }) {
  return (
    <div
      {...props}
      className={`dialog-actions${variant ? ` dialog-actions--${variant}` : ""} ${className}`.trim()}
    />
  );
}
