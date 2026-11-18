import type { ComponentPropsWithoutRef } from "react";
export default function FormStack({
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"form"> & { variant?: "contribution" }) {
  return (
    <form
      {...props}
      className={`form-stack${variant ? ` form-stack--${variant}` : ""} ${className}`.trim()}
    />
  );
}
