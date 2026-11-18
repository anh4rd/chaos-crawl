import type { ComponentPropsWithoutRef } from "react";

export default function ControlRow({
  className = "",
  variant,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  variant?: "timer" | "break" | "review" | "reward";
}) {
  return (
    <div
      {...props}
      className={`control-row${variant === "timer" || variant === "break" ? " control-row--timer" : ""}${variant === "review" ? " control-row--review" : ""}${variant === "reward" ? " control-row--reward" : ""}${variant === "break" ? " control-row--break" : ""} ${className}`.trim()}
    />
  );
}
