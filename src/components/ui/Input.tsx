import type { InputHTMLAttributes } from "react";

export default function Input(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border-4 border-pink-500 bg-white p-4 text-black"
    />
  );
}
