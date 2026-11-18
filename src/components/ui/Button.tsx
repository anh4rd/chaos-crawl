import { buttonClasses, type ButtonVariant } from "./buttonClasses";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

export default function Button({
  fullWidth = true,
  variant,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={buttonClasses({ variant, fullWidth, className })}
    >
      {props.children}
    </button>
  );
}
