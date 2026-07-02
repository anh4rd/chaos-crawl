import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({ fullWidth = true, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-full bg-pink-500 px-6 py-4 font-black uppercase text-white shadow-[0_0_20px_#ff1493] transition hover:scale-105 hover:bg-pink-400 ${className}`.trim()}
    >
      {props.children}
    </button>
  );
}
