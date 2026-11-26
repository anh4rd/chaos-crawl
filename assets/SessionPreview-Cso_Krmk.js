var e=`import type { ReactNode } from "react";
export default function SessionPreview({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: "inverse";
}) {
  return (
    <div
      className={\`session-preview\${variant ? \` session-preview--\${variant}\` : ""}\`}
    >
      {children}
    </div>
  );
}
`;export{e as default};