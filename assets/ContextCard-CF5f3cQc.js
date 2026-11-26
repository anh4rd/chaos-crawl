var e=`import type { ReactNode } from "react";
export default function ContextCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={\`context-card \${className}\`.trim()}>{children}</section>
  );
}
`;export{e as default};