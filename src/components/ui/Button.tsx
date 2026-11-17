import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`btn${fullWidth ? " btn--block" : ""} ${className}`.trim()}
    >
      {props.children}
    </button>
  );
}
