import type { ComponentPropsWithoutRef } from "react";

export default function FormLabel({
  children,
  htmlFor,
  spaced = false,
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"label"> & {
  spaced?: boolean;
  variant?:
    | "checkbox"
    | "session"
    | "session-checkbox"
    | "review"
    | "reward"
    | "award-points"
    | "access"
    | "contribution"
    | "filter";
}) {
  return (
    <label
      {...props}
      htmlFor={htmlFor}
      className={`form-label${spaced ? " form-label--spaced" : ""}${variant === "session" || variant === "session-checkbox" ? " form-label--session" : ""}${variant && variant !== "session" ? ` form-label--${variant}` : ""} ${className}`.trim()}
    >
      {children}
    </label>
  );
}
