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
    | "score"
    | "console-preview"
    | "console-meta"
    | "console-actions"
    | "console-actions-stack"
    | "console-schedule"
    | "console-title"
    | "console-card-actions"
    | "console-add"
    | "console-row-actions"
    | "tabs"
    | "spread"
    | "spread-start"
    | "score-actions"
    | "single-actions"
    | "single-actions-loose"
    | "chips"
    | "chips-close"
    | "slot"
    | "slot-close"
    | "slot-tight"
    | "slot-loose";
}) {
  return (
    <div
      {...props}
      className={`control-row${variant === "tabs" || variant === "spread" || variant === "spread-start" || variant === "score-actions" || variant === "single-actions" || variant === "single-actions-loose" || variant === "chips" || variant === "chips-close" || variant === "slot" || variant === "slot-close" || variant === "slot-tight" || variant === "slot-loose" ? ` control-row--${variant}` : ""}${variant?.startsWith("console-") ? ` control-row--${variant}` : ""}${variant === "console-actions-stack" ? " control-row--console-actions" : ""}${variant === "timer" || variant === "break" ? " control-row--timer" : ""}${variant === "review" ? " control-row--review" : ""}${variant === "reward" ? " control-row--reward" : ""}${variant === "break" ? " control-row--break" : ""}${variant === "idea-actions" ? " control-row--idea-actions" : ""}${variant === "heading-actions" ? " control-row--heading-actions" : ""}${variant === "moderation" ? " control-row--moderation" : ""}${variant === "filters" ? " control-row--filters" : ""}${variant === "record-header" || variant === "score" || variant === "playback" || variant === "playback-end" ? ` control-row--${variant}` : ""} ${className}`.trim()}
    />
  );
}
