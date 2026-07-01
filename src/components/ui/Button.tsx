import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({
  children,
  fullWidth = true,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        rounded-2xl
        bg-yellow-400
        text-black
        font-semibold
        py-4
        px-6
        transition
        hover:brightness-110
        active:scale-95
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {children}
    </button>
  );
}