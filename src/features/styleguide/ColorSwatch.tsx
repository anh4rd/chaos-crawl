import { useLayoutEffect, useState } from "react";
export default function ColorSwatch({
  label,
  token,
}: {
  label: string;
  token:
    | "--purple"
    | "--purple-mid"
    | "--purple-dark"
    | "--pink"
    | "--lime"
    | "--yellow"
    | "--black"
    | "--white";
}) {
  const [value, setValue] = useState("");
  useLayoutEffect(() => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim();
    setValue(color.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, "#$1$1$2$2$3$3"));
  }, [token]);
  return (
    <div className="color-swatch">
      <div className={`color-swatch__sample color-swatch__sample${token}`} />
      <strong className="color-swatch__name">{label}</strong>
      <code className="color-swatch__token">{token}</code>
      <small className="color-swatch__value">{value}</small>
    </div>
  );
}
