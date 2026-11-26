var e=`import type { HTMLAttributes } from "react";

export default function PanelGrid({
  className = "",
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?:
    | "private-feed"
    | "collection"
    | "ideas"
    | "stack"
    | "stats"
    | "console-list"
    | "console-ranking"
    | "console-roster"
    | "games"
    | "directory"
    | "feed"
    | "feed-tight"
    | "feed-page"
    | "feed-feedback";
}) {
  return (
    <div
      {...props}
      className={\`panel-grid\${variant ? \` panel-grid--\${variant}\` : ""} \${className}\`.trim()}
    />
  );
}
`;export{e as default};