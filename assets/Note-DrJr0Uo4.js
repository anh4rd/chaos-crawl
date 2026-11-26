var e=`import type { HTMLAttributes } from "react";

export default function Note({
  compact = false,
  variant,
  as: Element = "p",
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  compact?: boolean;
  variant?:
    | "participant-count"
    | "playback-loading"
    | "playback-waiting"
    | "playback-notice"
    | "media-unavailable"
    | "slideshow-copy"
    | "slideshow-error"
    | "slideshow-feedback"
    | "lobby"
    | "control"
    | "session"
    | "access-intro"
    | "access-help"
    | "collection-loading"
    | "inverse"
    | "record"
    | "console-points"
    | "console-body"
    | "console-muted"
    | "console-empty"
    | "workspace-muted"
    | "workspace-meta"
    | "description"
    | "metadata"
    | "body"
    | "empty"
    | "empty-muted"
    | "detail"
    | "status"
    | "help"
    | "summary"
    | "warning"
    | "success"
    | "secondary"
    | "quiet"
    | "media"
    | "schedule"
    | "emphasis"
    | "total";
  as?: "p" | "output" | "small" | "div" | "span";
}) {
  return (
    <Element
      {...props}
      className={\`note\${Element === "small" ? " note--inline" : ""}\${compact ? " note--compact" : ""}\${variant ? \` note--\${variant}\` : ""} \${className}\`.trim()}
    />
  );
}
`;export{e as default};