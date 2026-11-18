import type { ComponentPropsWithoutRef } from "react";

export default function ControlRow({
  className = "",
  variant,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  variant?:
    | "playback"
    | "playback-end"
    | "timer"
    | "break"
    | "review"
    | "reward"
    | "idea-actions"
    | "heading-actions"
    | "moderation"
    | "filters"
    | "record-header"
    | "score";
}) {
  return (
    <div
      {...props}
      className={`control-row${variant === "timer" || variant === "break" ? " control-row--timer" : ""}${variant === "review" ? " control-row--review" : ""}${variant === "reward" ? " control-row--reward" : ""}${variant === "break" ? " control-row--break" : ""}${variant === "idea-actions" ? " control-row--idea-actions" : ""}${variant === "heading-actions" ? " control-row--heading-actions" : ""}${variant === "moderation" ? " control-row--moderation" : ""}${variant === "filters" ? " control-row--filters" : ""}${variant === "record-header" || variant === "score" || variant === "playback" || variant === "playback-end" ? ` control-row--${variant}` : ""} ${className}`.trim()}
    />
  );
}
