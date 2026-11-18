import type { ComponentPropsWithoutRef } from "react";

export default function AssignmentList({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={`assignment-list ${className}`.trim()} />;
}
