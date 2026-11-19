import type { ComponentPropsWithoutRef } from "react";

export default function MetadataList({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={`metadata-list ${className}`.trim()} />;
}
