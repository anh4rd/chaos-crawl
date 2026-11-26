var e=`import type { HTMLAttributes } from "react";

export default function ContentCopy({
  variant,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant: "console" | "console-list" | "directory";
}) {
  return (
    <div
      {...props}
      className={\`content-copy content-copy--\${variant === "directory" ? "directory" : "console"}\${variant === "console-list" ? " content-copy--console-list" : ""} \${className}\`.trim()}
    />
  );
}
`;export{e as default};