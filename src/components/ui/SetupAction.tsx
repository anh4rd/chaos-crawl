import type { ButtonHTMLAttributes } from "react";
export default function SetupAction({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`setup-action ${className}`.trim()}>
      {props.children}
    </button>
  );
}
