var e=`import { useId } from "react";

export function Toggle({
  title,
  detail,
  checked,
  onChange,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const detailId = useId();
  return (
    <label className="toggle" aria-label={title}>
      <span>
        <strong>{title}</strong>
        <small id={detailId}>{detail}</small>
      </span>
      <input
        type="checkbox"
        aria-describedby={detailId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i className="toggle__track" />
    </label>
  );
}
`;export{e as default};