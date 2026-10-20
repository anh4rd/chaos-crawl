import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({ fullWidth = true, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-full bg-lime-300 px-6 py-4 font-black uppercase text-black shadow-[0_0_2px_#000000] transition hover:scale-105 hover:bg-black hover:text-white hover:shadow-[0_0_15px_#BDEE41] ${className}`.trim()}
    >
      {props.children}
    </button>
  );
}
