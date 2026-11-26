var e=`import type { HTMLAttributes } from "react";
import ContentPanel from "../ui/ContentPanel";

export default function PresentationControls({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <ContentPanel
      {...props}
      variant="session"
      className={\`presentation-controls \${className}\`.trim()}
    />
  );
}
`;export{e as default};