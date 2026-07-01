import type { ButtonHTMLAttributes } from "react";

export default function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      style={{
        width: "100%",
        padding: "18px",
        borderRadius: 14,
        border: "none",
        background: "#FACC15",
        color: "#111",
        fontWeight: 700,
        fontSize: 18,
        marginBottom: 16,
      }}
    />
  );
}