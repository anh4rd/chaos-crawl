var e=`import type { ComponentPropsWithoutRef } from "react";

export default function DataTable({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="data-table">
      <table {...props} className={\`data-table__table \${className}\`.trim()}>
        {children}
      </table>
    </div>
  );
}
`;export{e as default};