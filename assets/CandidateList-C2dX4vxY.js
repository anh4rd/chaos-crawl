var e=`import type { ReactNode } from "react";

export default function CandidateList({
  children,
  spaced = false,
}: {
  children: ReactNode;
  spaced?: boolean;
}) {
  return (
    <div className={\`candidate-list\${spaced ? " candidate-list--spaced" : ""}\`}>
      {children}
    </div>
  );
}
`;export{e as default};