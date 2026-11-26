var e=`import { type ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
  variant,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  variant?: "comic" | "lobby" | "console";
}) {
  return (
    <label className={\`field\${variant ? \` field--\${variant}\` : ""}\`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
`;export{e as default};