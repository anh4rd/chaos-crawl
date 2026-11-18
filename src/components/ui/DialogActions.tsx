import type { ComponentPropsWithoutRef } from "react";

export default function DialogActions({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={`dialog-actions ${className}`.trim()} />;
}
