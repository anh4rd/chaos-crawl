var e=`import type { ReactNode } from "react";

export default function TabPanel({
  id,
  labelledBy,
  active,
  children,
}: {
  id: string;
  labelledBy: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className="tab-panel"
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={!active}
      tabIndex={active ? 0 : -1}
    >
      {children}
    </div>
  );
}
`;export{e as default};