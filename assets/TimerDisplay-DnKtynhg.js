var e=`import type { ComponentPropsWithoutRef } from "react";

export default function TimerDisplay({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={\`timer-display \${className}\`.trim()} />;
}
`;export{e as default};