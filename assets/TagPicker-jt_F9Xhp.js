var e=`import type { ReactNode } from "react";
export default function TagPicker({
  label,
  hint,
  count,
  children,
}: {
  label: string;
  hint: string;
  count: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="tag-picker">
      <legend>
        {label} <small>{hint}</small>
      </legend>
      <div className="tag-picker__options">{children}</div>
      <small className="tag-picker__count">{count}</small>
    </fieldset>
  );
}
`;export{e as default};