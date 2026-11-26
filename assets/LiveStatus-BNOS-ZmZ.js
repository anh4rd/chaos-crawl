var e=`import type { ReactNode } from "react";

export default function LiveStatus({
  live,
  children,
}: {
  live: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={\`live-status\${live ? " live-status--live" : " live-status--ready"}\`}
    >
      <span className="live-status__dot" />
      {children}
    </span>
  );
}
`;export{e as default};