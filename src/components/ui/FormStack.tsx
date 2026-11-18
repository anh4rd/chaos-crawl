import type { ComponentPropsWithoutRef } from "react";
export default function FormStack({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"form">) {
  return <form {...props} className={`form-stack ${className}`.trim()} />;
}
