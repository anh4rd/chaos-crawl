import type { InputHTMLAttributes } from "react";

export default function Input(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="
        w-full
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        px-5
        py-4
        outline-none
        focus:border-yellow-400
      "
    />
  );
}